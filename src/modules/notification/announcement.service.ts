import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { AssociationMember } from '../association/association.entity';
import { User } from '../user/user.entity';
import {
  Announcement,
  AnnouncementRecipient,
} from './notification.entity';
import {
  AnnouncementAttendanceDto,
  QueryAnnouncementRecipientsDto,
  QueryAnnouncementsDto,
  SaveAnnouncementDto,
} from './dto/announcement.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRecipient)
    private readonly recipientRepo: Repository<AnnouncementRecipient>,
    @InjectRepository(AssociationMember)
    private readonly memberRepo: Repository<AssociationMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAdminList(query: QueryAnnouncementsDto, associationId?: number) {
    const { page, pageSize, keyword, category, status, startDate, endDate } =
      query;
    const qb = this.announcementRepo
      .createQueryBuilder('a')
      .where('a.deleted_at IS NULL');
    if (associationId) {
      qb.andWhere('a.audience_association_id = :associationId', {
        associationId,
      });
    }
    this.applyFilters(qb, { keyword, category, status, startDate, endDate });
    qb.orderBy('a.is_pinned', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    const counts = await this.recipientCounts(list.map((item) => item.id));
    return paginate(
      list.map((item) => ({ ...item, ...(counts.get(item.id) ?? this.emptyCounts()) })),
      total,
      page,
      pageSize,
    );
  }

  async findAnnouncement(id: number, associationId?: number) {
    const announcement = await this.announcementRepo
      .createQueryBuilder('a')
      .where('a.id = :id', { id })
      .andWhere('a.deleted_at IS NULL')
      .getOne();
    if (!announcement) throw new NotFoundException('通知公告不存在');
    this.assertAssociationScope(announcement, associationId);
    const counts = await this.recipientCounts([id]);
    const selectedMembers = announcement.audienceUserIds?.length
      ? await this.findMembersByUserIds(
          announcement.audienceUserIds,
          announcement.audienceAssociationId ?? undefined,
        )
      : [];
    return {
      ...announcement,
      userIds: announcement.audienceUserIds ?? [],
      selectedMembers,
      ...(counts.get(id) ?? this.emptyCounts()),
    };
  }

  async create(
    dto: SaveAnnouncementDto,
    adminId: number,
    associationId?: number,
  ) {
    this.validateAudience(dto);
    const announcement = this.announcementRepo.create({
      ...this.toEntity(dto),
      status: 0,
      publisherAdminId: adminId,
      audienceAssociationId: associationId ?? null,
    });
    return this.announcementRepo.save(announcement);
  }

  async update(id: number, dto: SaveAnnouncementDto, associationId?: number) {
    this.validateAudience(dto);
    const existing = await this.requireAnnouncement(id);
    this.assertAssociationScope(existing, associationId);
    const values = this.toEntity(dto);
    if (existing.status !== 1) {
      Object.assign(existing, values);
      return this.announcementRepo.save(existing);
    }

    return this.dataSource.transaction(async (manager) => {
      const announcements = manager.getRepository(Announcement);
      const current = await announcements
        .createQueryBuilder('a')
        .where('a.id = :id', { id })
        .andWhere('a.deleted_at IS NULL')
        .getOne();
      if (!current) throw new NotFoundException('通知公告不存在');
      Object.assign(current, values);
      await announcements.save(current);
      const userIds = await this.resolveRecipients(
        manager,
        dto,
        current.audienceAssociationId ?? undefined,
      );
      await this.syncRecipients(manager, id, userIds);
      return current;
    });
  }

  async publish(id: number, associationId?: number) {
    const announcement = await this.requireAnnouncement(id);
    this.assertAssociationScope(announcement, associationId);
    if (!announcement.activityAt) {
      throw new BadRequestException('发布通知前必须填写活动时间');
    }
    return this.dataSource.transaction(async (manager) => {
      const recipients = await this.resolveRecipients(
        manager,
        announcement,
        announcement.audienceAssociationId ?? undefined,
      );
      if (!recipients.length) {
        throw new BadRequestException('发布范围内没有符合条件的有效会员');
      }
      const current = await manager
        .getRepository(Announcement)
        .createQueryBuilder('a')
        .where('a.id = :id', { id })
        .andWhere('a.deleted_at IS NULL')
        .getOne();
      if (!current) throw new NotFoundException('通知公告不存在');
      current.status = 1;
      current.publishedAt = new Date();
      current.withdrawnAt = null;
      await manager.getRepository(Announcement).save(current);
      await this.syncRecipients(manager, id, recipients);
      return { success: true, recipientCount: recipients.length };
    });
  }

  async withdraw(id: number, associationId?: number) {
    const announcement = await this.requireAnnouncement(id);
    this.assertAssociationScope(announcement, associationId);
    if (announcement.status !== 1) {
      throw new BadRequestException('只有已发布的通知才能撤回');
    }
    announcement.status = 2;
    announcement.withdrawnAt = new Date();
    await this.announcementRepo.save(announcement);
    return { success: true };
  }

  async remove(id: number, associationId?: number) {
    const announcement = await this.requireAnnouncement(id);
    this.assertAssociationScope(announcement, associationId);
    if (announcement.status === 1) {
      throw new BadRequestException('请先撤回已发布的通知再删除');
    }
    announcement.deletedAt = new Date();
    await this.announcementRepo.save(announcement);
    return { success: true };
  }

  async findMembers(query: QueryAnnouncementsDto, associationId?: number) {
    const { page, pageSize, keyword, role } = query;
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .innerJoin(User, 'u', 'u.id = m.user_id')
      .leftJoin('m.association', 'a')
      .select('m.id', 'memberId')
      .addSelect('m.user_id', 'userId')
      .addSelect('m.real_name', 'realName')
      .addSelect('m.phone', 'phone')
      .addSelect('m.role', 'role')
      .addSelect('a.name', 'associationName')
      .where('m.status = 1')
      .andWhere('u.status = 1');
    if (associationId) {
      qb.andWhere('m.association_id = :associationId', { associationId });
    }
    if (role !== undefined) qb.andWhere('m.role = :role', { role });
    if (keyword) {
      qb.andWhere('(m.real_name LIKE :kw OR m.phone LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('a.name', 'ASC')
      .addOrderBy('m.real_name', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await Promise.all([
      qb.getRawMany(),
      this.countMembers(keyword, associationId, role),
    ]);
    return paginate(
      list.map((row) => ({
        memberId: Number(row.memberId),
        userId: Number(row.userId),
        realName: row.realName,
        phone: row.phone,
        role: Number(row.role),
        associationName: row.associationName,
      })),
      total,
      page,
      pageSize,
    );
  }

  async findAdminRecipients(
    id: number,
    query: QueryAnnouncementRecipientsDto,
    associationId?: number,
  ) {
    const announcement = await this.requireAnnouncement(id);
    this.assertAssociationScope(announcement, associationId);
    const { page, pageSize, keyword, isRead, attendanceStatus } = query;
    const qb = this.recipientRepo
      .createQueryBuilder('r')
      .where('r.announcement_id = :id', { id });
    if (isRead !== undefined) qb.andWhere('r.is_read = :isRead', { isRead });
    if (attendanceStatus !== undefined) {
      if (attendanceStatus === 0) {
        qb.andWhere('r.attendance_status IS NULL');
      } else {
        qb.andWhere('r.attendance_status = :attendanceStatus', {
          attendanceStatus,
        });
      }
    }
    if (keyword) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM users u WHERE u.id = r.user_id AND (u.real_name LIKE :kw OR u.nickname LIKE :kw OR u.phone LIKE :kw))',
        { kw: `%${keyword}%` },
      );
    }
    qb.orderBy('r.is_read', 'ASC')
      .addOrderBy('r.user_id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [recipients, total] = await qb.getManyAndCount();
    const users = recipients.length
      ? await this.userRepo.find({
          where: { id: In(recipients.map((recipient) => recipient.userId)) },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));
    return paginate(
      recipients.map((recipient) => {
        const user = userMap.get(recipient.userId);
        return {
          ...recipient,
          realName: user?.realName ?? user?.nickname ?? '',
          phone: user?.phone ?? '',
        };
      }),
      total,
      page,
      pageSize,
    );
  }

  async exportAttendance(id: number, associationId?: number): Promise<string> {
    const announcement = await this.requireAnnouncement(id);
    this.assertAssociationScope(announcement, associationId);
    const recipients = await this.recipientRepo.find({
      where: { announcementId: id },
      order: { userId: 'ASC' },
    });
    const users = recipients.length
      ? await this.userRepo.find({
          where: { id: In(recipients.map((recipient) => recipient.userId)) },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));
    const escapeCsv = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['姓名', '手机号', '阅读状态', '阅读时间', '参加状态', '反馈时间']
        .map(escapeCsv)
        .join(','),
      ...recipients.map((recipient) => {
        const user = userMap.get(recipient.userId);
        return [
          user?.realName ?? user?.nickname ?? '',
          user?.phone ?? '',
          recipient.isRead ? '已读' : '未读',
          recipient.readAt?.toISOString() ?? '',
          recipient.attendanceStatus === 1
            ? '参加'
            : recipient.attendanceStatus === 2
              ? '不参加'
              : '未反馈',
          recipient.respondedAt?.toISOString() ?? '',
        ]
          .map(escapeCsv)
          .join(',');
      }),
    ];
    return `\uFEFF${lines.join('\r\n')}`;
  }

  async findMyAnnouncements(userId: number, query: QueryAnnouncementsDto) {
    const { page, pageSize, keyword, category, startDate, endDate } = query;
    const qb = this.recipientRepo
      .createQueryBuilder('r')
      .innerJoinAndMapOne(
        'r.announcement',
        Announcement,
        'a',
        'a.id = r.announcement_id AND a.status = 1 AND a.deleted_at IS NULL',
      )
      .where('r.user_id = :userId', { userId });
    if (keyword) qb.andWhere('(a.title LIKE :kw OR a.content LIKE :kw)', { kw: `%${keyword}%` });
    if (category) qb.andWhere('a.category = :category', { category });
    this.applyDateFilters(qb, 'a.published_at', startDate, endDate);
    qb.orderBy('a.is_pinned', 'DESC')
      .addOrderBy('a.published_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [recipients, total] = await qb.getManyAndCount();
    return paginate(
      recipients.map((recipient) => {
        const { announcement, ...receipt } = recipient as AnnouncementRecipient & {
          announcement: Announcement;
        };
        const { audienceUserIds, ...visibleAnnouncement } = announcement;
        return this.toUserAnnouncement(visibleAnnouncement, receipt);
      }),
      total,
      page,
      pageSize,
    );
  }

  async findMyAnnouncement(id: number, userId: number) {
    const recipient = await this.recipientRepo.findOne({
      where: { announcementId: id, userId },
    });
    const announcement = await this.announcementRepo
      .createQueryBuilder('a')
      .where('a.id = :id', { id })
      .andWhere('a.status = 1')
      .andWhere('a.deleted_at IS NULL')
      .getOne();
    if (!recipient || !announcement) {
      throw new NotFoundException('通知公告不存在或无权查看');
    }
    if (!recipient.isRead) {
      recipient.isRead = 1;
      recipient.readAt = new Date();
      await this.recipientRepo.save(recipient);
    }
    const { audienceUserIds, ...visibleAnnouncement } = announcement;
    return this.toUserAnnouncement(visibleAnnouncement, recipient);
  }

  async respondAttendance(
    id: number,
    userId: number,
    dto: AnnouncementAttendanceDto,
  ) {
    const announcement = await this.announcementRepo
      .createQueryBuilder('a')
      .where('a.id = :id', { id })
      .andWhere('a.status = 1')
      .andWhere('a.deleted_at IS NULL')
      .getOne();
    if (!announcement) throw new NotFoundException('通知公告不存在或已撤回');
    if (!announcement.requiresAttendance) {
      throw new BadRequestException('该通知不需要确认参加');
    }
    const recipient = await this.recipientRepo.findOne({
      where: { announcementId: id, userId },
    });
    if (!recipient) throw new NotFoundException('您不在该通知的接收范围内');
    recipient.attendanceStatus = dto.attendanceStatus;
    recipient.respondedAt = new Date();
    recipient.isRead = 1;
    recipient.readAt = recipient.readAt ?? new Date();
    await this.recipientRepo.save(recipient);
    return { success: true, attendanceStatus: recipient.attendanceStatus };
  }

  private async recipientCounts(ids: number[]) {
    const result = new Map<number, {
      recipientCount: number;
      readCount: number;
      unreadCount: number;
      attendingCount: number;
      notAttendingCount: number;
    }>();
    if (!ids.length) return result;
    const rows = await this.recipientRepo
      .createQueryBuilder('r')
      .select('r.announcement_id', 'announcementId')
      .addSelect('COUNT(*)', 'recipientCount')
      .addSelect('SUM(CASE WHEN r.is_read = 1 THEN 1 ELSE 0 END)', 'readCount')
      .addSelect('SUM(CASE WHEN r.is_read = 0 THEN 1 ELSE 0 END)', 'unreadCount')
      .addSelect('SUM(CASE WHEN r.attendance_status = 1 THEN 1 ELSE 0 END)', 'attendingCount')
      .addSelect('SUM(CASE WHEN r.attendance_status = 2 THEN 1 ELSE 0 END)', 'notAttendingCount')
      .where('r.announcement_id IN (:...ids)', { ids })
      .groupBy('r.announcement_id')
      .getRawMany();
    rows.forEach((row) =>
      result.set(Number(row.announcementId), {
        recipientCount: Number(row.recipientCount),
        readCount: Number(row.readCount),
        unreadCount: Number(row.unreadCount),
        attendingCount: Number(row.attendingCount),
        notAttendingCount: Number(row.notAttendingCount),
      }),
    );
    return result;
  }

  private toUserAnnouncement(
    announcement: Omit<Announcement, 'audienceUserIds'>,
    recipient: AnnouncementRecipient,
  ) {
    return {
      ...announcement,
      isRead: recipient.isRead,
      readAt: recipient.readAt,
      attendanceStatus: recipient.attendanceStatus,
      respondedAt: recipient.respondedAt,
    };
  }

  private emptyCounts() {
    return {
      recipientCount: 0,
      readCount: 0,
      unreadCount: 0,
      attendingCount: 0,
      notAttendingCount: 0,
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<Announcement>,
    filters: {
      keyword?: string;
      category?: string;
      status?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { keyword, category, status, startDate, endDate } = filters;
    if (keyword) {
      qb.andWhere('(a.title LIKE :kw OR a.content LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (category) qb.andWhere('a.category = :category', { category });
    if (status !== undefined) qb.andWhere('a.status = :status', { status });
    this.applyDateFilters(qb, 'a.created_at', startDate, endDate);
  }

  private applyDateFilters(
    qb: SelectQueryBuilder<any>,
    field: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (startDate) qb.andWhere(`${field} >= :startDate`, { startDate });
    if (endDate) qb.andWhere(`${field} <= :endDate`, { endDate: `${endDate} 23:59:59` });
  }

  private validateAudience(dto: SaveAnnouncementDto) {
    if (!dto.activityAt) {
      throw new BadRequestException('活动时间为必填项');
    }
    if (
      (dto.audienceType === 'selected_members' ||
        dto.audienceType === 'association_presidents') &&
      dto.userIds?.length &&
      new Set(dto.userIds).size !== dto.userIds.length
    ) {
      throw new BadRequestException('指定接收人不能重复');
    }
    if (
      dto.audienceType === 'selected_members' &&
      (!dto.userIds?.length || new Set(dto.userIds).size !== dto.userIds.length)
    ) {
      throw new BadRequestException('指定会员范围必须选择不重复的会员');
    }
  }

  private toEntity(dto: SaveAnnouncementDto) {
    return {
      title: dto.title.trim(),
      category: dto.category.trim(),
      publisherUnit: dto.publisherUnit?.trim() || null,
      content: dto.content,
      activityAt: dto.activityAt ? new Date(dto.activityAt) : null,
      location: dto.location?.trim() || null,
      participants: dto.participants?.trim() || null,
      attachments: dto.attachments?.length ? dto.attachments : null,
      audienceType: dto.audienceType,
      isPinned: dto.isPinned ? 1 : 0,
      isImportant: dto.isImportant ? 1 : 0,
      requiresAttendance: dto.requiresAttendance ? 1 : 0,
      audienceUserIds:
        ['selected_members', 'association_presidents'].includes(dto.audienceType)
          ? dto.userIds?.length
            ? dto.userIds
            : null
          : null,
    };
  }

  private async requireAnnouncement(id: number) {
    const announcement = await this.announcementRepo
      .createQueryBuilder('a')
      .where('a.id = :id', { id })
      .andWhere('a.deleted_at IS NULL')
      .getOne();
    if (!announcement) throw new NotFoundException('通知公告不存在');
    return announcement;
  }

  private async countMembers(
    keyword?: string,
    associationId?: number,
    role?: number,
  ) {
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .innerJoin(User, 'u', 'u.id = m.user_id')
      .where('m.status = 1')
      .andWhere('u.status = 1');
    if (associationId) {
      qb.andWhere('m.association_id = :associationId', { associationId });
    }
    if (keyword) {
      qb.andWhere('(m.real_name LIKE :kw OR m.phone LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (role !== undefined) qb.andWhere('m.role = :role', { role });
    return qb.getCount();
  }

  private async findMembersByUserIds(
    userIds: number[],
    associationId?: number,
  ) {
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .innerJoin(User, 'u', 'u.id = m.user_id')
      .leftJoin('m.association', 'a')
      .select('m.user_id', 'userId')
      .addSelect('m.real_name', 'realName')
      .addSelect('m.phone', 'phone')
      .addSelect('a.name', 'associationName')
      .where('m.user_id IN (:...userIds)', { userIds })
      .andWhere('m.status = 1')
      .andWhere('u.status = 1');
    if (associationId) {
      qb.andWhere('m.association_id = :associationId', { associationId });
    }
    const rows = await qb.getRawMany();
    return rows.map((row) => ({
      userId: Number(row.userId),
      realName: row.realName,
      phone: row.phone,
      associationName: row.associationName,
    }));
  }

  private async resolveRecipients(
    manager: EntityManager,
    source: SaveAnnouncementDto | Announcement,
    associationId?: number,
  ): Promise<number[]> {
    const memberRepo = manager.getRepository(AssociationMember);
    const audienceType = source.audienceType;
    const scopedAssociationId =
      (source as Announcement).audienceAssociationId ?? associationId;
    let members: AssociationMember[];
    const userIds =
      (source as SaveAnnouncementDto).userIds ??
      (source as Announcement).audienceUserIds ??
      [];
    if (
      audienceType === 'selected_members' ||
      (audienceType === 'association_presidents' && userIds.length > 0)
    ) {
      if (audienceType === 'selected_members' && !userIds.length) {
        throw new BadRequestException('指定会员范围必须选择会员');
      }
      const memberQuery = memberRepo
        .createQueryBuilder('m')
        .innerJoin(User, 'u', 'u.id = m.user_id')
        .where('m.user_id IN (:...userIds)', { userIds })
        .andWhere('m.status = 1')
        .andWhere('u.status = 1');
      if (audienceType === 'association_presidents') {
        memberQuery.andWhere('m.role = 1');
      }
      if (scopedAssociationId) {
        memberQuery.andWhere('m.association_id = :associationId', {
          associationId: scopedAssociationId,
        });
      }
      members = await memberQuery.getMany();
      const found = new Set(members.map((member) => member.userId));
      if (userIds.some((userId) => !found.has(userId))) {
        throw new BadRequestException(
          audienceType === 'association_presidents'
            ? '指定接收人中包含非有效冬泳协会会长'
            : '指定会员中包含非有效协会会员',
        );
      }
    } else {
      const qb = memberRepo
        .createQueryBuilder('m')
        .innerJoin(User, 'u', 'u.id = m.user_id')
        .where('m.status = 1')
        .andWhere('u.status = 1');
      if (audienceType === 'association_admins') {
        qb.andWhere('m.role IN (1, 2)');
      } else if (audienceType === 'association_presidents') {
        qb.andWhere('m.role = 1');
      } else if (audienceType !== 'all_members') {
        throw new BadRequestException('无效的通知接收范围');
      }
      if (scopedAssociationId) {
        qb.andWhere('m.association_id = :associationId', {
          associationId: scopedAssociationId,
        });
      }
      members = await qb.getMany();
    }
    return [...new Set(members.map((member) => member.userId))];
  }

  private async syncRecipients(
    manager: EntityManager,
    announcementId: number,
    userIds: number[],
  ) {
    const repo = manager.getRepository(AnnouncementRecipient);
    const existing = await repo.find({ where: { announcementId } });
    const wanted = new Set(userIds);
    const obsolete = existing.filter((recipient) => !wanted.has(recipient.userId));
    if (obsolete.length) {
      await repo.delete({ id: In(obsolete.map((recipient) => recipient.id)) });
    }
    const present = new Set(existing.map((recipient) => recipient.userId));
    const additions = userIds
      .filter((userId) => !present.has(userId))
      .map((userId) => repo.create({ announcementId, userId }));
    if (additions.length) await repo.save(additions);
  }

  private assertAssociationScope(
    announcement: Announcement,
    associationId?: number,
  ) {
    if (
      associationId &&
      announcement.audienceAssociationId !== associationId
    ) {
      throw new ForbiddenException('无权管理其他协会的通知公告');
    }
  }
}
