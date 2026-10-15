import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './region.entity';

/**
 * 行政区划只读服务（省 / 市 / 区县级联查询）
 * 数据由 scripts/seed-regions.js 离线种子脚本一次性灌入。
 */
@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  /** 省级列表（level=1），按 sort/code 升序 */
  async findProvinces(): Promise<Region[]> {
    return this.regionRepo.find({
      where: { level: 1, status: 1 },
      order: { sort: 'ASC', code: 'ASC' },
    });
  }

  /** 某父节点的直接子列表（按 sort/code 升序） */
  async findChildren(parentId: number): Promise<Region[]> {
    return this.regionRepo.find({
      where: { parentId, status: 1 },
      order: { sort: 'ASC', code: 'ASC' },
    });
  }

  /** 按 code 查单个节点（含禁用） */
  async findByCode(code: string): Promise<Region> {
    const r = await this.regionRepo.findOne({ where: { code } });
    if (!r) throw new NotFoundException(`行政区划编码不存在: ${code}`);
    return r;
  }

  /** 按 code 列表批量查（用于 venue 编辑回显 / service 反查 name） */
  async findByCodes(codes: string[]): Promise<Map<string, Region>> {
    if (!codes.length) return new Map();
    const rows = await this.regionRepo
      .createQueryBuilder('r')
      .where('r.code IN (:...codes)', { codes })
      .getMany();
    return new Map(rows.map((r) => [r.code, r]));
  }
}
