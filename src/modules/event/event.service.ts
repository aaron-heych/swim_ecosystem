import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Event,
  EventGroup,
  EventRegistration,
  EventRegistrationItem,
} from './event.entity';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  AuditEventDto,
  UpdateEventHotDto,
} from './dto/create-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import {
  RegisterEventDto,
  RegisterEventItemDto,
} from './dto/register-event.dto';
import {
  QueryRegistrationDto,
  UpdateRegistrationPayStatusDto,
} from './dto/query-registration.dto';
import { aesEncrypt, aesDecrypt, maskIdCard, maskPhone } from '../../common/utils/aes.util';

/** 生成业务订单号：YYYYMMDDHHmm + 6 位随机 */
function generateOrderNo(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const ymd =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `E${ymd}${rand}`;
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventGroup)
    private readonly groupRepo: Repository<EventGroup>,
    @InjectRepository(EventRegistration)
    private readonly regRepo: Repository<EventRegistration>,
    @InjectRepository(EventRegistrationItem)
    private readonly itemRepo: Repository<EventRegistrationItem>,
    private readonly dataSource: DataSource,
  ) {}

  // ========================================================
  // C 端：赛事浏览
  // ========================================================

  /** 1. 赛事列表（auditStatus=1 通过；按 startDate 排序） */
  async listPublic(query: QueryEventDto): Promise<PaginatedResult<Event>> {
    const {
      page,
      pageSize,
      keyword,
      eventType,
      level,
      province,
      city,
      status,
      isHot,
    } = query;
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.audit_status = :audit', { audit: 1 });

    if (eventType) qb.andWhere('e.event_type = :eventType', { eventType });
    if (level !== undefined && level !== null) {
      qb.andWhere('e.level = :level', { level });
    }
    if (province) qb.andWhere('e.province = :province', { province });
    if (city) qb.andWhere('e.city = :city', { city });
    if (status !== undefined && status !== null) {
      qb.andWhere('e.status = :status', { status });
    }
    if (isHot !== undefined && isHot !== null) {
      qb.andWhere('e.is_hot = :isHot', { isHot });
    }
    if (keyword) {
      qb.andWhere(
        '(e.title LIKE :kw OR e.organizer LIKE :kw OR e.address LIKE :kw OR e.venue_name LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    qb.orderBy('e.start_date', 'ASC')
      .addOrderBy('e.is_hot', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 2. 赛事详情（含 groups[]、source、viewCount++） */
  async findPublicDetail(id: number): Promise<Event> {
    const event = await this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.groups', 'groups')
      .leftJoinAndSelect('e.source', 'source')
      .where('e.id = :id', { id })
      .andWhere('e.audit_status = :audit', { audit: 1 })
      .orderBy('groups.sort', 'ASC')
      .addOrderBy('groups.id', 'ASC')
      .getOne();
    if (!event) throw new NotFoundException('赛事不存在或未通过审核');

    // 浏览量 +1（不阻塞详情返回）
    await this.eventRepo.increment({ id } as any, 'viewCount', 1);
    event.viewCount = (event.viewCount || 0) + 1;

    return event;
  }

  // ========================================================
  // C 端：报名
  // ========================================================

  /** 3. 提交报名（事务：写报名单 + 明细 + 增加 group.registeredCount + event.registerCount） */
  async register(
    userId: number,
    eventId: number,
    dto: RegisterEventDto,
  ): Promise<EventRegistration> {
    return this.dataSource.transaction(async (manager) => {
      // 校验赛事
      const event = await manager.findOne(Event, {
        where: { id: eventId, auditStatus: 1 } as any,
        lock: { mode: 'pessimistic_write' },
      });
      if (!event) throw new NotFoundException('赛事不存在或未通过审核');
      if (event.status !== 1) {
        throw new BadRequestException('赛事当前不在报名中');
      }
      // 报名时间校验
      const now = new Date();
      if (event.registerStart && now < event.registerStart) {
        throw new BadRequestException('报名尚未开始');
      }
      if (event.registerEnd && now > event.registerEnd) {
        throw new BadRequestException('报名已截止');
      }

      // 加载所有组别并校验
      const groupIds = dto.items.map((i) => i.groupId);
      const groups = await manager.find(EventGroup, {
        where: dto.items.map((i) => ({ id: i.groupId, eventId } as any)),
        lock: { mode: 'pessimistic_write' },
      });
      if (groups.length !== groupIds.length) {
        throw new BadRequestException('部分组别不存在或不属于该赛事');
      }
      const groupMap = new Map(groups.map((g) => [g.id, g]));

      // 名额校验 + 性别 / 年龄校验
      for (const item of dto.items) {
        const g = groupMap.get(item.groupId);
        if (!g) {
          throw new BadRequestException(`组别 ${item.groupId} 不存在`);
        }
        if (g.quota > 0 && g.registeredCount >= g.quota) {
          throw new ConflictException(`组别「${g.name}」名额已满`);
        }
        if (g.genderLimit && item.gender && g.genderLimit !== item.gender) {
          throw new BadRequestException(`组别「${g.name}」性别要求不符`);
        }
      }

      // 计算总费用
      let totalFee = 0;
      const itemEntities: EventRegistrationItem[] = [];
      for (const item of dto.items) {
        const g = groupMap.get(item.groupId)!;
        totalFee += Number(g.fee) || 0;
        const it = manager.create(EventRegistrationItem, {
          groupId: item.groupId,
          participantName: item.participantName,
          idCardEnc: item.idCard ? aesEncrypt(item.idCard) : null,
          gender: item.gender ?? 0,
          birthday: item.birthday ?? null,
          phone: item.phone ?? null,
          fee: g.fee,
          status: 1, // 有效
        });
        itemEntities.push(it);
      }

      // 生成订单号（重试一次）
      let orderNo = generateOrderNo();
      let existed = await manager.findOne(EventRegistration, {
        where: { orderNo } as any,
      });
      if (existed) {
        orderNo = generateOrderNo();
      }

      // 创建报名单
      const reg = manager.create(EventRegistration, {
        orderNo,
        eventId,
        userId,
        associationId: null,
        teamName: dto.teamName ?? null,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        idCardEnc: dto.idCard ? aesEncrypt(dto.idCard) : null,
        emergencyName: dto.emergencyName ?? null,
        emergencyPhone: dto.emergencyPhone ?? null,
        totalFee,
        payStatus: 0, // 待支付
        status: 0, // 待支付
        remark: dto.remark ?? null,
      });
      const savedReg = await manager.save(EventRegistration, reg);

      // 写明细
      for (const it of itemEntities) {
        it.registrationId = savedReg.id;
      }
      await manager.save(EventRegistrationItem, itemEntities);

      // 增加组别已报数 + 赛事已报数
      for (const item of dto.items) {
        const g = groupMap.get(item.groupId)!;
        g.registeredCount = (g.registeredCount || 0) + 1;
      }
      await manager.save(EventGroup, Array.from(groupMap.values()));
      event.registerCount = (event.registerCount || 0) + dto.items.length;
      await manager.save(Event, event);

      savedReg.items = itemEntities;
      return savedReg;
    });
  }

  /** 4. 我的报名记录 */
  async listMyRegistrations(
    userId: number,
    query: QueryRegistrationDto,
  ): Promise<PaginatedResult<EventRegistration>> {
    const { page, pageSize, status, payStatus, orderNo } = query;
    const qb = this.regRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId });
    if (status !== undefined && status !== null) {
      qb.andWhere('r.status = :status', { status });
    }
    if (payStatus !== undefined && payStatus !== null) {
      qb.andWhere('r.pay_status = :payStatus', { payStatus });
    }
    if (orderNo) qb.andWhere('r.order_no LIKE :orderNo', { orderNo: `%${orderNo}%` });
    qb.leftJoinAndSelect('r.event', 'event')
      .leftJoinAndSelect('r.items', 'items')
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    // 脱敏
    list.forEach((r) => this.maskRegistration(r));
    return paginate(list, total, page, pageSize);
  }

  /** 5. 报名单详情 */
  async findRegistrationByOrderNo(
    orderNo: string,
    userId?: number,
  ): Promise<EventRegistration> {
    const qb = this.regRepo
      .createQueryBuilder('r')
      .where('r.order_no = :orderNo', { orderNo })
      .leftJoinAndSelect('r.event', 'event')
      .leftJoinAndSelect('r.items', 'items');
    if (userId) qb.andWhere('r.user_id = :userId', { userId });
    const reg = await qb.getOne();
    if (!reg) throw new NotFoundException('报名单不存在');
    return this.maskRegistration(reg);
  }

  /** 6. 取消报名（仅未支付时；status=2, 恢复 group.registeredCount/event.registerCount） */
  async cancelByUser(
    orderNo: string,
    userId: number,
  ): Promise<EventRegistration> {
    return this.dataSource.transaction(async (manager) => {
      const reg = await manager.findOne(
        EventRegistration,
        {
          where: { orderNo, userId } as any,
          relations: ['items'],
          lock: { mode: 'pessimistic_write' },
        },
      );
      if (!reg) throw new NotFoundException('报名单不存在');
      if (reg.payStatus !== 0) {
        throw new BadRequestException('已支付订单无法自助取消，请申请退款');
      }
      if (reg.status === 2) {
        throw new BadRequestException('报名单已取消');
      }
      const prevStatus = reg.status;
      reg.status = 2; // 已取消
      const saved = await manager.save(EventRegistration, reg);

      // 仅当之前是有效状态才回滚计数
      if (prevStatus === 0 || prevStatus === 1) {
        // 明细置为取消
        if (reg.items && reg.items.length) {
          for (const it of reg.items) {
            it.status = 0;
          }
          await manager.save(EventRegistrationItem, reg.items);
        }
        // 恢复组别已报数
        const groupIds = (reg.items || []).map((i) => i.groupId);
        if (groupIds.length) {
          const groups = await manager.find(EventGroup, {
            where: groupIds.map((id) => ({ id } as any)),
            lock: { mode: 'pessimistic_write' },
          });
          for (const g of groups) {
            g.registeredCount = Math.max(0, (g.registeredCount || 0) - 1);
          }
          await manager.save(EventGroup, groups);
        }
        // 恢复赛事已报数
        const event = await manager.findOne(Event, {
          where: { id: reg.eventId } as any,
          lock: { mode: 'pessimistic_write' },
        });
        if (event) {
          event.registerCount = Math.max(
            0,
            (event.registerCount || 0) - (reg.items?.length || 0),
          );
          await manager.save(Event, event);
        }
      }
      return this.maskRegistration(saved);
    });
  }

  // ========================================================
  // 后台：赛事
  // ========================================================

  /** 1. 分页（含 auditStatus/status/keyword） */
  async listAdmin(query: QueryEventDto): Promise<PaginatedResult<Event>> {
    const {
      page,
      pageSize,
      keyword,
      eventType,
      level,
      province,
      city,
      status,
      auditStatus,
      isHot,
    } = query;
    const qb = this.eventRepo.createQueryBuilder('e');
    if (auditStatus !== undefined && auditStatus !== null) {
      qb.andWhere('e.audit_status = :audit', { audit: auditStatus });
    }
    if (eventType) qb.andWhere('e.event_type = :eventType', { eventType });
    if (level !== undefined && level !== null) {
      qb.andWhere('e.level = :level', { level });
    }
    if (province) qb.andWhere('e.province = :province', { province });
    if (city) qb.andWhere('e.city = :city', { city });
    if (status !== undefined && status !== null) {
      qb.andWhere('e.status = :status', { status });
    }
    if (isHot !== undefined && isHot !== null) {
      qb.andWhere('e.is_hot = :isHot', { isHot });
    }
    if (keyword) {
      qb.andWhere(
        '(e.title LIKE :kw OR e.organizer LIKE :kw OR e.venue_name LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    qb.leftJoinAndSelect('e.source', 'source')
      .orderBy('e.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findById(id: number): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id } as any,
      relations: ['groups', 'source', 'creator'],
    });
    if (!event) throw new NotFoundException('赛事不存在');
    return event;
  }

  /** 2. 手工创建赛事（sourceId=null, externalId=null） */
  async create(dto: CreateEventDto, adminId: number): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      sourceId: null,
      externalId: null,
      creatorId: adminId,
      auditStatus: 0,
      status: 0,
    } as Event);
    return this.eventRepo.save(event);
  }

  /** 3. 更新赛事 */
  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findById(id);
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  /** 4. 审核 */
  async audit(id: number, dto: AuditEventDto): Promise<Event> {
    const event = await this.findById(id);
    event.auditStatus = dto.auditStatus;
    return this.eventRepo.save(event);
  }

  /** 5. 修改赛事状态 */
  async updateStatus(id: number, dto: UpdateEventStatusDto): Promise<Event> {
    const event = await this.findById(id);
    event.status = dto.status;
    return this.eventRepo.save(event);
  }

  /** 6. 发布（publishAt + status=1 报名中） */
  async publish(id: number): Promise<Event> {
    const event = await this.findById(id);
    if (event.auditStatus !== 1) {
      throw new BadRequestException('赛事未通过审核，无法发布');
    }
    event.publishAt = new Date();
    event.status = 1;
    return this.eventRepo.save(event);
  }

  /** 7. 设置/取消热门 */
  async updateHot(id: number, dto: UpdateEventHotDto): Promise<Event> {
    const event = await this.findById(id);
    event.isHot = dto.isHot;
    return this.eventRepo.save(event);
  }

  /** 8. 软删除 */
  async softDelete(id: number): Promise<void> {
    const event = await this.findById(id);
    await this.eventRepo.softDelete(event.id);
  }

  // ========================================================
  // 后台：组别
  // ========================================================

  /** 9. 创建组别 */
  async createGroup(eventId: number, dto: CreateGroupDto): Promise<EventGroup> {
    const event = await this.findById(eventId);
    const group = this.groupRepo.create({
      ...dto,
      eventId: event.id,
    } as EventGroup);
    return this.groupRepo.save(group);
  }

  /** 10. 更新组别 */
  async updateGroup(groupId: number, dto: UpdateGroupDto): Promise<EventGroup> {
    const group = await this.findGroupById(groupId);
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  /** 11. 删除组别 */
  async deleteGroup(groupId: number): Promise<void> {
    const group = await this.findGroupById(groupId);
    // 已有报名的组别禁止删除
    if (group.registeredCount > 0) {
      throw new BadRequestException('该组别已有报名，无法删除');
    }
    await this.groupRepo.softDelete(group.id);
  }

  private async findGroupById(groupId: number): Promise<EventGroup> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId } as any,
      relations: ['event'],
    });
    if (!group) throw new NotFoundException('组别不存在');
    return group;
  }

  // ========================================================
  // 后台：报名单
  // ========================================================

  /** 12. 报名单分页 */
  async listRegistrations(
    query: QueryRegistrationDto,
  ): Promise<PaginatedResult<EventRegistration>> {
    const {
      page,
      pageSize,
      keyword,
      eventId,
      userId,
      status,
      payStatus,
      orderNo,
    } = query;
    const qb = this.regRepo.createQueryBuilder('r');
    if (eventId) qb.andWhere('r.event_id = :eventId', { eventId });
    if (userId) qb.andWhere('r.user_id = :userId', { userId });
    if (status !== undefined && status !== null) {
      qb.andWhere('r.status = :status', { status });
    }
    if (payStatus !== undefined && payStatus !== null) {
      qb.andWhere('r.pay_status = :payStatus', { payStatus });
    }
    if (orderNo) qb.andWhere('r.order_no LIKE :orderNo', { orderNo: `%${orderNo}%` });
    if (keyword) {
      qb.andWhere(
        '(r.contact_name LIKE :kw OR r.contact_phone LIKE :kw OR r.team_name LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    qb.leftJoinAndSelect('r.event', 'event')
      .leftJoinAndSelect('r.items', 'items')
      .leftJoinAndSelect('r.user', 'user')
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    list.forEach((r) => this.maskRegistration(r));
    return paginate(list, total, page, pageSize);
  }

  async findRegistrationById(id: number): Promise<EventRegistration> {
    const reg = await this.regRepo.findOne({
      where: { id } as any,
      relations: ['event', 'items', 'user'],
    });
    if (!reg) throw new NotFoundException('报名单不存在');
    return this.maskRegistration(reg);
  }

  /** 13. 标记已支付（payStatus=1, payTime, transactionId, status=1 已报名） */
  async updateRegistrationPayStatus(
    id: number,
    dto: UpdateRegistrationPayStatusDto,
  ): Promise<EventRegistration> {
    return this.dataSource.transaction(async (manager) => {
      const reg = await manager.findOne(EventRegistration, {
        where: { id } as any,
        lock: { mode: 'pessimistic_write' },
      });
      if (!reg) throw new NotFoundException('报名单不存在');
      reg.payStatus = dto.payStatus;
      if (dto.payStatus === 1) {
        reg.payTime = new Date();
        if (dto.transactionId) reg.transactionId = dto.transactionId;
        reg.status = 1; // 已报名
      } else if (dto.payStatus === 2) {
        if (dto.transactionId) reg.transactionId = dto.transactionId;
      } else if (dto.payStatus === 0) {
        reg.payTime = null;
        reg.transactionId = null;
      }
      return manager.save(EventRegistration, reg);
    });
  }

  /** 14. 退款（payStatus=2, status=3 已退费；回滚已报数） */
  async refundRegistration(id: number): Promise<EventRegistration> {
    return this.dataSource.transaction(async (manager) => {
      const reg = await manager.findOne(
        EventRegistration,
        {
          where: { id } as any,
          relations: ['items'],
          lock: { mode: 'pessimistic_write' },
        },
      );
      if (!reg) throw new NotFoundException('报名单不存在');
      if (reg.payStatus !== 1) {
        throw new BadRequestException('仅已支付订单可退款');
      }
      reg.payStatus = 2; // 已退款
      reg.status = 3; // 已退费
      const saved = await manager.save(EventRegistration, reg);

      // 回滚赛事已报数 + 组别已报数 + 明细置为取消
      if (reg.items && reg.items.length) {
        for (const it of reg.items) {
          if (it.status === 1) {
            it.status = 0;
          }
        }
        await manager.save(EventRegistrationItem, reg.items);

        const groupIds = reg.items.map((i) => i.groupId);
        if (groupIds.length) {
          const groups = await manager.find(EventGroup, {
            where: groupIds.map((gid) => ({ id: gid } as any)),
            lock: { mode: 'pessimistic_write' },
          });
          for (const g of groups) {
            g.registeredCount = Math.max(0, (g.registeredCount || 0) - 1);
          }
          await manager.save(EventGroup, groups);
        }

        const event = await manager.findOne(Event, {
          where: { id: reg.eventId } as any,
          lock: { mode: 'pessimistic_write' },
        });
        if (event) {
          event.registerCount = Math.max(
            0,
            (event.registerCount || 0) - reg.items.length,
          );
          await manager.save(Event, event);
        }
      }
      return saved;
    });
  }

  // ========================================================
  // 私有：脱敏
  // ========================================================

  /** 报名单脱敏（手机/身份证） */
  private maskRegistration(reg: EventRegistration): EventRegistration {
    if (reg.contactPhone) {
      (reg as any).contactPhone = maskPhone(reg.contactPhone);
    }
    if (reg.emergencyPhone) {
      (reg as any).emergencyPhone = maskPhone(reg.emergencyPhone);
    }
    if (reg.idCardEnc) {
      try {
        (reg as any).idCardMasked = maskIdCard(aesDecrypt(reg.idCardEnc));
      } catch {
        (reg as any).idCardMasked = null;
      }
      (reg as any).idCardEnc = undefined;
    }
    if (reg.items && reg.items.length) {
      reg.items.forEach((it) => {
        if (it.phone) (it as any).phone = maskPhone(it.phone);
        if (it.idCardEnc) {
          try {
            (it as any).idCardMasked = maskIdCard(aesDecrypt(it.idCardEnc));
          } catch {
            (it as any).idCardMasked = null;
          }
          (it as any).idCardEnc = undefined;
        }
      });
    }
    return reg;
  }
}
