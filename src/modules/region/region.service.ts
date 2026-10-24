import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Region } from './region.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

/**
 * 行政区划服务（省 / 市 / 区县级联查询及后台维护）
 */
@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    private readonly dataSource: DataSource,
  ) {}

  async findAdminTree() {
    type RegionNode = Region & { children: RegionNode[] };
    const regions = await this.regionRepo.find({
      order: { level: 'ASC', sort: 'ASC', code: 'ASC' },
    });
    const nodes = new Map(
      regions.map((region) => [
        String(region.id),
        { ...region, children: [] as RegionNode[] } as RegionNode,
      ]),
    );
    const roots: RegionNode[] = [];
    for (const region of regions) {
      const node = nodes.get(String(region.id))!;
      if (region.parentId == null) {
        roots.push(node);
      } else {
        nodes.get(String(region.parentId))?.children.push(node);
      }
    }
    return roots;
  }

  async create(dto: CreateRegionDto): Promise<Region> {
    const code = dto.code.trim();
    const name = dto.name.trim();
    if (!code || !name) {
      throw new BadRequestException('行政区名称和 code 不能为空');
    }
    const parent = await this.validateParent(dto.level, dto.parentId);
    try {
      return await this.regionRepo.save(
        this.regionRepo.create({
          code,
          name,
          level: dto.level,
          parentId: parent?.id ?? null,
          sort: dto.sort ?? 0,
          status: 1,
        }),
      );
    } catch (error) {
      if (this.isDuplicateCode(error)) {
        throw new ConflictException('行政区划 code 已存在');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateRegionDto): Promise<Region> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Region);
        const region = await repo.findOne({ where: { id } });
        if (!region) throw new NotFoundException('行政区不存在');

        if (dto.status === 1 && region.parentId != null) {
          const parent = await repo.findOne({ where: { id: region.parentId } });
          if (!parent || parent.status !== 1) {
            throw new BadRequestException('请先启用上级行政区');
          }
        }
        if (dto.status === 0) {
          const activeChildren = await repo.count({
            where: { parentId: id, status: 1 },
          });
          if (activeChildren) {
            throw new BadRequestException('请先停用所有下级行政区，再停用此地区');
          }
        }

        const oldCode = region.code;
        const oldName = region.name;
        if (dto.code !== undefined) {
          region.code = dto.code.trim();
          if (!region.code) {
            throw new BadRequestException('行政区 code 不能为空');
          }
        }
        if (dto.name !== undefined) {
          region.name = dto.name.trim();
          if (!region.name) {
            throw new BadRequestException('行政区名称不能为空');
          }
        }
        if (dto.sort !== undefined) region.sort = dto.sort;
        if (dto.status !== undefined) region.status = dto.status;

        const saved = await repo.save(region);
        if (oldCode !== saved.code || oldName !== saved.name) {
          await this.syncBusinessRegionReferences(
            manager,
            saved.level,
            oldCode,
            saved.code,
            saved.name,
          );
        }
        return saved;
      });
    } catch (error) {
      if (this.isDuplicateCode(error)) {
        throw new ConflictException('行政区划 code 已存在');
      }
      throw error;
    }
  }

  private async validateParent(
    level: number,
    parentId?: number,
  ): Promise<Region | undefined> {
    if (level === 1) {
      if (parentId !== undefined) {
        throw new BadRequestException('省级行政区不能设置上级地区');
      }
      return undefined;
    }
    if (parentId === undefined) {
      throw new BadRequestException('市、区县必须指定上级地区');
    }
    const parent = await this.regionRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('上级行政区不存在');
    if (parent.level !== level - 1) {
      throw new BadRequestException('上级地区层级不正确');
    }
    if (parent.status !== 1) {
      throw new BadRequestException('不能在已停用的行政区下新增地区');
    }
    return parent;
  }

  private async syncBusinessRegionReferences(
    manager: EntityManager,
    level: number,
    oldCode: string,
    newCode: string,
    newName: string,
  ): Promise<void> {
    const codeColumn = ['province_code', 'city_code', 'district_code'][level - 1];
    const nameColumn = ['province', 'city', 'district'][level - 1];
    const tables = ['associations', 'venues', 'winter_activities', 'winter_competitions'];
    for (const table of tables) {
      await manager.query(
        `UPDATE \`${table}\` SET \`${codeColumn}\` = ?, \`${nameColumn}\` = ? WHERE \`${codeColumn}\` = ?`,
        [newCode, newName, oldCode],
      );
    }
  }

  private isDuplicateCode(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === 'ER_DUP_ENTRY'
    );
  }

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
