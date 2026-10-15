import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Venue, Coach } from './venue.entity';
import { Region } from '../region/region.entity';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { CreateVenueDto, UpdateVenueDto } from './dto/create-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { AuditVenueDto, UpdateVenueStatusDto } from './dto/audit-venue.dto';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Coach)
    private readonly coachRepo: Repository<Coach>,
    private readonly dataSource: DataSource,
  ) {}

  /** Region 仓库（ VenueModule 未 forFeature Region，故走 DataSource 间接拿） */
  private get regionRepo(): Repository<Region> {
    return this.dataSource.getRepository(Region);
  }

  /**
   * 按 DTO 里的 code 反查并填充 name（province/city/district）。
   * - 仅当传了 code 时反查；code 无效则抛 404 提示编码不存在。
   * - 若同时传了 name，以反查结果为准（避免前后端不一致）。
   * - 若清空 code（传 undefined/null），同步清空 name，避免脏数据。
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
    // 收集需要反查的 code（非空字符串）
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
      // 校验编码是否全部存在
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
        // 显式清空 code 时同步清空 name
        if (code === null) target[nameKey] = null;
      }
    });
    return target;
  }

  // ============================ C 端 ============================

  /** C 端：场馆列表（仅 auditStatus=1 通过、status=1 正常） */
  async listPublic(query: QueryVenueDto): Promise<PaginatedResult<Venue>> {
    const { page, pageSize, keyword, type, province, city, sort, order } =
      query;
    const qb = this.venueRepo
      .createQueryBuilder('v')
      .where('v.audit_status = :audit', { audit: 1 })
      .andWhere('v.status = :st', { st: 1 });

    if (type) qb.andWhere('v.type = :type', { type });
    if (province) qb.andWhere('v.province = :province', { province });
    if (city) qb.andWhere('v.city = :city', { city });
    if (keyword) {
      qb.andWhere(
        '(v.name LIKE :kw OR v.address LIKE :kw OR v.intro LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    const sortField = sort === 'rating' ? 'v.rating' : 'v.created_at';
    qb.orderBy(sortField, order === 'ASC' ? 'ASC' : 'DESC');

    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** C 端：场馆详情（含简要教练列表） */
  async findPublicDetail(id: number): Promise<Venue> {
    const venue = await this.venueRepo.findOne({
      where: { id, auditStatus: 1, status: 1 } as any,
      relations: ['coaches'],
    });
    if (!venue) throw new NotFoundException('场馆不存在或已下架');
    return venue;
  }

  /** C 端：场馆下教练列表（仅 auditStatus=1、status=1 上架） */
  async listCoachesByVenue(venueId: number): Promise<Coach[]> {
    const venue = await this.venueRepo.findOne({
      where: { id: venueId, auditStatus: 1, status: 1 } as any,
    });
    if (!venue) throw new NotFoundException('场馆不存在或已下架');
    return this.coachRepo.find({
      where: { venueId, auditStatus: 1, status: 1 } as any,
      order: { sort: 'DESC', rating: 'DESC' },
    });
  }

  // ============================ 后台 ============================

  async listAdmin(query: QueryVenueDto): Promise<PaginatedResult<Venue>> {
    const { page, pageSize, keyword, type, province, city, auditStatus } =
      query;
    const qb = this.venueRepo.createQueryBuilder('v');

    if (auditStatus !== undefined && auditStatus !== null) {
      qb.andWhere('v.audit_status = :audit', { audit: auditStatus });
    }
    if (type) qb.andWhere('v.type = :type', { type });
    if (province) qb.andWhere('v.province = :province', { province });
    if (city) qb.andWhere('v.city = :city', { city });
    if (keyword) {
      qb.andWhere(
        '(v.name LIKE :kw OR v.address LIKE :kw OR v.province LIKE :kw OR v.city LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    qb.orderBy('v.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findById(id: number): Promise<Venue> {
    const venue = await this.venueRepo.findOne({
      where: { id } as any,
      relations: ['creator', 'coaches'],
    });
    if (!venue) throw new NotFoundException('场馆不存在');
    return venue;
  }

  async create(dto: CreateVenueDto, adminId: number): Promise<Venue> {
    const payload = await this.applyRegionCodes({ ...dto });
    const venue = this.venueRepo.create({ ...payload, creatorId: adminId });
    return this.venueRepo.save(venue);
  }

  async update(id: number, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.findById(id);
    const payload = await this.applyRegionCodes({ ...dto });
    Object.assign(venue, payload);
    return this.venueRepo.save(venue);
  }

  async audit(id: number, dto: AuditVenueDto): Promise<Venue> {
    const venue = await this.findById(id);
    venue.auditStatus = dto.auditStatus;
    return this.venueRepo.save(venue);
  }

  async updateStatus(id: number, dto: UpdateVenueStatusDto): Promise<Venue> {
    const venue = await this.findById(id);
    venue.status = dto.status;
    return this.venueRepo.save(venue);
  }

  async softDelete(id: number): Promise<void> {
    const venue = await this.findById(id);
    await this.venueRepo.softDelete(venue.id);
  }
}
