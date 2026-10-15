import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Association, AssociationMember } from './association.entity';
import { Region } from '../region/region.entity';
import { User } from '../user/user.entity';
import { CreateAssociationDto } from './dto/create-association.dto';
import { ApplyMemberDto } from './dto/apply-member.dto';
import { AuditAssociationDto } from './dto/audit-association.dto';
import { AuditMemberDto } from './dto/audit-member.dto';
import { QueryAssociationDto } from './dto/query-association.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { aesEncrypt, aesDecrypt } from '../../common/utils/aes.util';

@Injectable()
export class AssociationService {
  constructor(
    @InjectRepository(Association)
    private readonly associationRepo: Repository<Association>,
    @InjectRepository(AssociationMember)
    private readonly memberRepo: Repository<AssociationMember>,
    private readonly dataSource: DataSource,
  ) {}

  /** Region 仓库（AssociationModule 未 forFeature Region，故走 DataSource 间接拿） */
  private get regionRepo(): Repository<Region> {
    return this.dataSource.getRepository(Region);
  }

  /** User 仓库（同样走 DataSource 间接拿，用于更新会员头像/性别） */
  private get userRepo(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  /** 会员关联用户字段脱敏：避免身份证密文等敏感字段随列表/详情接口下发 */
  private sanitizeMemberUser(member: AssociationMember): AssociationMember {
    if (member.user) {
      const { idCardEnc, ...safeUser } = member.user as any;
      member.user = safeUser as User;
    }
    return member;
  }

  /**
   * 按 DTO 里的 code 反查并填充 name（province/city/district）。
   * - 仅当传了 code 时反查；code 无效则抛 404 提示编码不存在。
   * - 若同时传了 name，以反查结果为准（避免前后端不一致）。
   * - 若清空 code（传 null），同步清空 name，避免脏数据。
   */
  private async applyRegionCodes<
    T extends {
      provinceCode?: string | null;
      cityCode?: string | null;
      districtCode?: string | null;
      province?: string | null;
      city?: string | null;
      district?: string | null;
    },
  >(target: T): Promise<T> {
    const codeKeys: Array<
      'provinceCode' | 'cityCode' | 'districtCode'
    > = ['provinceCode', 'cityCode', 'districtCode'];
    const nameKeys: Array<'province' | 'city' | 'district'> = [
      'province',
      'city',
      'district',
    ];
    const codes = codeKeys
      .map((k) => target[k])
      .filter((c): c is string => !!c && typeof c === 'string');
    const codeToName = new Map<string, string>();
    if (codes.length) {
      const rows = await this.regionRepo
        .createQueryBuilder('r')
        .select(['r.code', 'r.name'])
        .where('r.code IN (:...codes)', { codes })
        .getMany();
      rows.forEach((r) => codeToName.set(r.code, r.name));
      for (const c of codes) {
        if (!codeToName.has(c)) {
          throw new NotFoundException(`行政区划编码不存在: ${c}`);
        }
      }
    }
    codeKeys.forEach((codeKey, i) => {
      const code = target[codeKey];
      const nameKey = nameKeys[i];
      if (code) {
        target[nameKey] = codeToName.get(code) ?? null;
      } else if (code === null || code === undefined) {
        if (code === null) target[nameKey] = null;
      }
    });
    return target;
  }

  /* ============================= C 端 ============================= */

  /** C 端：已审核通过、状态正常的协会分页列表 */
  async findPublicList(query: QueryAssociationDto): Promise<PaginatedResult<Association>> {
    const { page, pageSize, keyword, province, city } = query;
    const qb = this.associationRepo
      .createQueryBuilder('a')
      .where('a.audit_status = :audit', { audit: 1 })
      .andWhere('a.status = :status', { status: 1 })
      .andWhere('a.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(a.name LIKE :kw OR a.short_name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (province) qb.andWhere('a.province = :province', { province });
    if (city) qb.andWhere('a.city = :city', { city });

    qb.orderBy('a.member_count', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** C 端：协会详情（仅返回已审核通过的协会） */
  async findPublicDetail(id: number): Promise<Association> {
    const assoc = await this.associationRepo.findOne({
      where: { id, auditStatus: 1, status: 1 },
    });
    if (!assoc) throw new NotFoundException('协会不存在或未通过审核');
    return assoc;
  }

  /** C 端：用户提交入会报名 */
  async apply(userId: number, dto: ApplyMemberDto): Promise<AssociationMember> {
    const assoc = await this.associationRepo.findOne({
      where: { id: dto.associationId, auditStatus: 1, status: 1 },
    });
    if (!assoc) throw new NotFoundException('协会不存在或未通过审核');

    // 唯一索引 (associationId, userId)：同一协会重复报名校验
    const existed = await this.memberRepo.findOne({
      where: { associationId: dto.associationId, userId },
    });
    if (existed && existed.status === 0) {
      throw new BadRequestException('已提交报名，请等待审核');
    }
    if (existed && existed.status === 1) {
      throw new BadRequestException('您已是该协会会员');
    }
    // status=2/3/4 允许重新报名：硬删除历史记录（含软删除残留，避免唯一键冲突）后创建新记录
    if (existed) {
      await this.memberRepo.delete({ id: existed.id });
    }
    await this.memberRepo.delete({ associationId: dto.associationId, userId });

    const member = this.memberRepo.create({
      associationId: dto.associationId,
      userId,
      role: 3,
      realName: dto.realName,
      phone: dto.phone,
      idCardEnc: dto.idCard ? aesEncrypt(dto.idCard) : null,
      emergencyName: dto.emergencyName ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      healthDeclaration: dto.healthDeclaration ?? null,
      applyRemark: dto.applyRemark ?? null,
      status: 0,
    });
    return this.memberRepo.save(member);
  }

  /** C 端：我的协会报名记录列表 */
  async findMyMemberships(
    userId: number,
    query: QueryMemberDto,
  ): Promise<PaginatedResult<AssociationMember>> {
    const { page, pageSize, status, role } = query;
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.association', 'a')
      .where('m.user_id = :userId', { userId })
      .andWhere('m.deleted_at IS NULL');

    if (status !== undefined && status !== null) {
      qb.andWhere('m.status = :status', { status });
    }
    if (role) qb.andWhere('m.role = :role', { role });

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** C 端：用户创建新协会（审核状态默认 0 待审核） */
  async createByUser(userId: number, dto: CreateAssociationDto): Promise<Association> {
    const existed = await this.associationRepo.findOne({
      where: { name: dto.name },
    });
    if (existed) throw new BadRequestException('协会名称已存在');

    const payload = await this.applyRegionCodes({ ...dto });
    const assoc = this.associationRepo.create({
      ...payload,
      memberCount: 0,
      auditStatus: 0,
      status: 1,
      creatorId: userId,
    });
    return this.associationRepo.save(assoc);
  }

  /** C 端：取消报名（仅 status=0 待审核可取消） */
  async cancelApply(userId: number, memberId: number): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, userId },
    });
    if (!member) throw new NotFoundException('报名记录不存在');
    if (member.status !== 0) {
      throw new BadRequestException('仅待审核状态的报名可取消');
    }
    await this.memberRepo.delete({ id: memberId });
  }

  /* ============================= 后台 ============================= */

  /** 后台：协会分页列表 */
  async findAdminList(
    query: QueryAssociationDto,
    userAssociationId?: number,
  ): Promise<PaginatedResult<Association>> {
    const {
      page,
      pageSize,
      keyword,
      auditStatus,
      status,
      province,
      city,
      contactName,
      contactPhone,
    } = query;
    const qb = this.associationRepo.createQueryBuilder('a');

    // 协会会长只能看到自己所属协会
    if (userAssociationId) {
      qb.andWhere('a.id = :assocId', { assocId: userAssociationId });
    }
    qb.andWhere('a.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(a.name LIKE :kw OR a.short_name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (auditStatus !== undefined && auditStatus !== null) {
      qb.andWhere('a.audit_status = :auditStatus', { auditStatus });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (province) qb.andWhere('a.province = :province', { province });
    if (city) qb.andWhere('a.city = :city', { city });
    if (contactName) {
      qb.andWhere('a.contact_name LIKE :contactName', {
        contactName: `%${contactName}%`,
      });
    }
    if (contactPhone) {
      qb.andWhere('a.contact_phone LIKE :contactPhone', {
        contactPhone: `%${contactPhone}%`,
      });
    }

    qb.orderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 后台：协会详情（含 members 列表） */
  async findAdminDetail(
    id: number,
    userAssociationId?: number,
  ): Promise<Association> {
    // 协会会长只能查看自己所属协会
    if (userAssociationId && id !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会信息');
    }
    const assoc = await this.associationRepo.findOne({
      where: { id },
      relations: ['members', 'members.user', 'auditor', 'creator'],
    });
    if (!assoc) throw new NotFoundException('协会不存在');
    return assoc;
  }

  /** 后台：管理员创建协会 */
  async createByAdmin(dto: CreateAssociationDto): Promise<Association> {
    const existed = await this.associationRepo.findOne({
      where: { name: dto.name },
    });
    if (existed) throw new BadRequestException('协会名称已存在');

    const payload = await this.applyRegionCodes({ ...dto });
    // 管理员创建默认审核通过、状态正常
    const assoc = this.associationRepo.create({
      ...payload,
      memberCount: 0,
      auditStatus: 1,
      status: 1,
    });
    return this.associationRepo.save(assoc);
  }

  /** 后台：更新协会基本信息 */
  async update(id: number, dto: Partial<CreateAssociationDto>): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');

    if (dto.name && dto.name !== assoc.name) {
      const dup = await this.associationRepo.findOne({
        where: { name: dto.name },
      });
      if (dup) throw new BadRequestException('协会名称已存在');
    }

    const payload = await this.applyRegionCodes({ ...dto });
    Object.assign(assoc, payload);
    return this.associationRepo.save(assoc);
  }

  /** 后台：审核协会 */
  async audit(
    id: number,
    adminId: number,
    dto: AuditAssociationDto,
  ): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    if (assoc.auditStatus !== 0) {
      throw new BadRequestException('该协会已审核，不可重复审核');
    }

    assoc.auditStatus = dto.auditStatus;
    assoc.auditRemark = dto.auditRemark ?? null;
    assoc.auditorId = adminId;
    assoc.auditedAt = new Date();
    return this.associationRepo.save(assoc);
  }

  /** 后台：启用/停用协会 */
  async updateStatus(id: number, status: number): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    assoc.status = status;
    return this.associationRepo.save(assoc);
  }

  /** 后台：软删除协会 */
  async softRemove(id: number): Promise<void> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    await this.associationRepo.softDelete(id);
  }

  /** 后台：协会会员分页 */
  async findMembers(
    associationId: number,
    query: QueryMemberDto,
    userAssociationId?: number,
  ): Promise<PaginatedResult<AssociationMember>> {
    // 协会会长只能查看自己所属协会的会员
    if (userAssociationId && associationId !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会会员');
    }
    const {
      page,
      pageSize,
      status,
      role,
      keyword,
      phone,
      hasInsurance,
      gender,
      joinedStart,
      joinedEnd,
    } = query;
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.association_id = :associationId', { associationId })
      .andWhere('m.deleted_at IS NULL');

    if (status !== undefined && status !== null) {
      qb.andWhere('m.status = :status', { status });
    }
    if (role) qb.andWhere('m.role = :role', { role });
    if (keyword) {
      qb.andWhere('(m.real_name LIKE :kw OR m.member_no LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (phone) {
      qb.andWhere('m.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (hasInsurance !== undefined && hasInsurance !== null) {
      if (hasInsurance === 1) {
        qb.andWhere('m.has_insurance = 1');
      } else {
        // 未缴纳：含未填写(NULL)
        qb.andWhere('(m.has_insurance = 0 OR m.has_insurance IS NULL)');
      }
    }
    if (gender !== undefined && gender !== null) {
      qb.andWhere('u.gender = :gender', { gender });
    }
    if (joinedStart) {
      qb.andWhere('m.joined_at >= :joinedStart', {
        joinedStart: `${joinedStart} 00:00:00`,
      });
    }
    if (joinedEnd) {
      qb.andWhere('m.joined_at <= :joinedEnd', {
        joinedEnd: `${joinedEnd} 23:59:59`,
      });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    list.forEach((m) => this.sanitizeMemberUser(m));
    return paginate(list, total, page, pageSize);
  }

  /** 后台：审核会员（status 1通过/2拒绝） */
  async auditMember(
    memberId: number,
    reviewerId: number,
    dto: AuditMemberDto,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }
    if (member.status !== 0) {
      throw new BadRequestException('该报名已审核，不可重复审核');
    }

    member.status = dto.status;
    member.reviewerId = reviewerId;
    member.reviewedAt = new Date();

    if (dto.status === 1) {
      // 通过：生成会员编号 + 入会时间 + 协会冗余计数 +1
      member.memberNo = this.generateMemberNo(member.associationId);
      member.joinedAt = new Date();

      if (member.association) {
        member.association.memberCount = (member.association.memberCount || 0) + 1;
        await this.associationRepo.save(member.association);
      }
    }

    return this.memberRepo.save(member);
  }

  /** 后台：修改会员角色（1会长 2管理员 3普通） */
  async updateMemberRole(
    memberId: number,
    role: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }
    if (member.status !== 1) {
      throw new BadRequestException('仅已通过审核的会员可修改角色');
    }
    member.role = role;
    return this.memberRepo.save(member);
  }

  /** 后台：移除/恢复会员（status 3退出 4移除） */
  async updateMemberStatus(
    memberId: number,
    status: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    const prevStatus = member.status;
    member.status = status;
    const result = await this.memberRepo.save(member);

    // 协会冗余计数同步：被移除/退出时 -1，恢复为通过时 +1
    if (member.association) {
      const wasActive = prevStatus === 1;
      const isActive = status === 1;
      if (!wasActive && isActive) {
        member.association.memberCount = (member.association.memberCount || 0) + 1;
        await this.associationRepo.save(member.association);
      } else if (wasActive && !isActive) {
        member.association.memberCount = Math.max(0, (member.association.memberCount || 0) - 1);
        await this.associationRepo.save(member.association);
      }
    }
    return result;
  }

  /** 后台：删除会员记录 */
  async deleteMember(memberId: number, userAssociationId?: number): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    // 若为已通过会员，协会冗余计数 -1
    if (member.status === 1 && member.association) {
      member.association.memberCount = Math.max(0, (member.association.memberCount || 0) - 1);
      await this.associationRepo.save(member.association);
    }
    // 逻辑删除
    await this.memberRepo.softDelete({ id: memberId });
  }

  /** 后台：会员详情（身份证号解密后随 idCard 字段返回） */
  async findMemberDetail(
    memberId: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user', 'association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会的会员');
    }
    this.sanitizeMemberUser(member);
    let idCard: string | null = null;
    if (member.idCardEnc) {
      try {
        idCard = aesDecrypt(member.idCardEnc);
      } catch {
        idCard = null;
      }
    }
    return { ...member, idCard } as AssociationMember;
  }

  /** 后台：编辑会员（仅更新传入字段；身份证号明文传入时重新加密） */
  async updateMember(
    memberId: number,
    dto: UpdateMemberDto,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    if (dto.role !== undefined) member.role = dto.role;
    if (dto.realName !== undefined) member.realName = dto.realName;
    if (dto.phone !== undefined) member.phone = dto.phone;
    if (dto.idCard) member.idCardEnc = aesEncrypt(dto.idCard);
    if (dto.emergencyName !== undefined) member.emergencyName = dto.emergencyName;
    if (dto.emergencyPhone !== undefined) member.emergencyPhone = dto.emergencyPhone;
    if (dto.healthDeclaration !== undefined) member.healthDeclaration = dto.healthDeclaration;
    if (dto.applyRemark !== undefined) member.applyRemark = dto.applyRemark;
    if (dto.joinedAt) member.joinedAt = new Date(`${dto.joinedAt} 00:00:00`);
    if (dto.hasInsurance !== undefined && dto.hasInsurance !== null) {
      member.hasInsurance = dto.hasInsurance;
    }
    if (dto.buyedInsuranceAt) {
      member.buyedInsuranceAt = new Date(`${dto.buyedInsuranceAt} 00:00:00`);
    }
    if (dto.insuranceStartAt) {
      member.insuranceStartAt = new Date(`${dto.insuranceStartAt} 00:00:00`);
    }
    if (dto.insuranceEndAt) {
      member.insuranceEndAt = new Date(`${dto.insuranceEndAt} 00:00:00`);
    }
    // 头像/性别保存在关联的 C 端用户表上
    if (dto.avatar !== undefined || dto.gender !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: member.userId } });
      if (user) {
        if (dto.avatar !== undefined) user.avatarUrl = dto.avatar || null;
        if (dto.gender !== undefined) user.gender = dto.gender;
        await this.userRepo.save(user);
      }
    }
    return this.memberRepo.save(member);
  }

  /* ============================= 私有工具 ============================= */

  /** 生成会员编号：ASC + associationId(0填充6位) + 随机6位 */
  private generateMemberNo(associationId: number): string {
    const padId = String(associationId).padStart(6, '0');
    const rand = Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    return `ASC${padId}${dateStr}${rand}`.slice(0, 32);
  }
}
