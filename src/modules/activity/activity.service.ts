import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WinterActivity } from './activity.entity';
import { Region } from '../region/region.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(WinterActivity)
    private readonly activityRepo: Repository<WinterActivity>,
    private readonly dataSource: DataSource,
  ) {}

  /** Region 仓库（ActivityModule 未 forFeature Region，走 DataSource 间接拿） */
  private get regionRepo(): Repository<Region> {
    return this.dataSource.getRepository(Region);
  }

  /**
   * 按 DTO 里的 code 反查并填充 province/city/district 名称。
   * 与 association.service.applyRegionCodes 同模式。
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
      } else if (code === null) {
        target[nameKey] = null;
      }
    });
    // 直辖市的地级在国标区划数据中叫「市辖区」，展示时用省级名代替
    if (target.city === '市辖区' && target.province) {
      target.city = target.province;
    }
    return target;
  }

  /** datetime 字段转换：undefined 跳过 / '' 清空 / 其他转 Date */
  private toDate(v: string | undefined | null): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  /** 逐字段把 DTO 应用到实体（仅赋值 DTO 中显式出现的字段） */
  private applyDto(act: WinterActivity, dto: UpdateActivityDto) {
    if (dto.title !== undefined) act.title = dto.title;
    if (dto.type !== undefined) act.type = dto.type;
    if (dto.description !== undefined) act.description = dto.description ?? null;
    if (dto.provinceCode !== undefined) act.provinceCode = dto.provinceCode ?? null;
    if (dto.cityCode !== undefined) act.cityCode = dto.cityCode ?? null;
    if (dto.districtCode !== undefined) act.districtCode = dto.districtCode ?? null;
    if (dto.province !== undefined) act.province = dto.province ?? null;
    if (dto.city !== undefined) act.city = dto.city ?? null;
    if (dto.district !== undefined) act.district = dto.district ?? null;
    if (dto.location !== undefined) act.location = dto.location ?? null;
    if (dto.fee !== undefined) act.fee = dto.fee ?? null;
    if (dto.capacity !== undefined) act.capacity = dto.capacity ?? null;
    if (dto.organizer !== undefined) act.organizer = dto.organizer ?? null;
    if (dto.contactName !== undefined) act.contactName = dto.contactName ?? null;
    if (dto.contactPhone !== undefined) act.contactPhone = dto.contactPhone ?? null;
    const startAt = this.toDate(dto.startAt);
    if (startAt !== undefined) act.startAt = startAt;
    const endAt = this.toDate(dto.endAt);
    if (endAt !== undefined) act.endAt = endAt;
    const regEndAt = this.toDate(dto.regEndAt);
    if (regEndAt !== undefined) act.regEndAt = regEndAt;
    if (dto.status !== undefined) act.status = dto.status;
  }

  /** 后台：活动分页列表 */
  async findAdminList(
    query: QueryActivityDto,
  ): Promise<PaginatedResult<WinterActivity>> {
    const {
      page,
      pageSize,
      keyword,
      type,
      status,
      startDate,
      endDate,
      organizer,
    } = query;
    const qb = this.activityRepo
      .createQueryBuilder('a')
      .where('a.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('a.title LIKE :kw', { kw: `%${keyword}%` });
    }
    if (type !== undefined && type !== null) {
      qb.andWhere('a.type = :type', { type });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (startDate) {
      qb.andWhere('a.start_at >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }
    if (endDate) {
      qb.andWhere('a.start_at <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }
    if (organizer) {
      qb.andWhere('a.organizer LIKE :organizer', {
        organizer: `%${organizer}%`,
      });
    }

    qb.orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 后台：创建活动（默认草稿） */
  async create(dto: CreateActivityDto, adminId?: number) {
    await this.applyRegionCodes(dto);
    const act = this.activityRepo.create({
      title: dto.title,
      type: dto.type ?? 1,
      status: 0,
      createdBy: adminId ?? null,
    });
    this.applyDto(act, dto);
    // 创建一律为草稿，忽略 DTO 中的 status
    act.status = 0;
    return this.activityRepo.save(act);
  }

  /** 后台：更新活动 */
  async update(id: number, dto: UpdateActivityDto) {
    const act = await this.activityRepo.findOne({ where: { id } });
    if (!act) throw new NotFoundException('活动不存在');
    await this.applyRegionCodes(dto);
    this.applyDto(act, dto);
    return this.activityRepo.save(act);
  }

  /** 后台：修改状态 */
  async updateStatus(id: number, status: number) {
    const act = await this.activityRepo.findOne({ where: { id } });
    if (!act) throw new NotFoundException('活动不存在');
    act.status = status;
    return this.activityRepo.save(act);
  }

  /** 后台：软删除 */
  async softRemove(id: number) {
    await this.activityRepo.softDelete({ id });
  }
}
