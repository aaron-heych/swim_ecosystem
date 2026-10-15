import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CrawlLog, EventSource } from './event.entity';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import {
  CreateSourceDto,
  UpdateSourceDto,
  ToggleSourceDto,
} from './dto/create-source.dto';
import { QuerySourceDto } from './dto/query-source.dto';
import { QueryCrawlLogDto } from './dto/query-crawl-log.dto';

@Injectable()
export class EventSourceService {
  constructor(
    @InjectRepository(EventSource)
    private readonly sourceRepo: Repository<EventSource>,
    @InjectRepository(CrawlLog)
    private readonly logRepo: Repository<CrawlLog>,
    private readonly dataSource: DataSource,
  ) {}

  // ========================================================
  // 后台：抓取源
  // ========================================================

  /** 1. 数据源分页 */
  async listSources(query: QuerySourceDto): Promise<PaginatedResult<EventSource>> {
    const { page, pageSize, keyword, parserType, enabled } = query;
    const qb = this.sourceRepo.createQueryBuilder('s');
    if (parserType) qb.andWhere('s.parser_type = :parserType', { parserType });
    if (enabled !== undefined && enabled !== null) {
      qb.andWhere('s.enabled = :enabled', { enabled });
    }
    if (keyword) {
      qb.andWhere('(s.name LIKE :kw OR s.website LIKE :kw OR s.remark LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('s.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findSourceById(id: number): Promise<EventSource> {
    const source = await this.sourceRepo.findOne({ where: { id } as any });
    if (!source) throw new NotFoundException('抓取源不存在');
    return source;
  }

  /** 2. 创建数据源 */
  async createSource(dto: CreateSourceDto): Promise<EventSource> {
    const source = this.sourceRepo.create({
      ...dto,
      lastCrawledAt: null,
      lastStatus: null,
    } as EventSource);
    return this.sourceRepo.save(source);
  }

  /** 3. 更新 */
  async updateSource(id: number, dto: UpdateSourceDto): Promise<EventSource> {
    const source = await this.findSourceById(id);
    Object.assign(source, dto);
    return this.sourceRepo.save(source);
  }

  /** 4. 启用/停用 */
  async toggleSource(id: number, dto: ToggleSourceDto): Promise<EventSource> {
    const source = await this.findSourceById(id);
    source.enabled = dto.enabled;
    return this.sourceRepo.save(source);
  }

  /** 5. 删除（停用的才允许删除） */
  async deleteSource(id: number): Promise<void> {
    const source = await this.findSourceById(id);
    if (source.enabled !== 0) {
      throw new BadRequestException('请先停用抓取源后再删除');
    }
    await this.sourceRepo.softDelete(source.id);
  }

  // ========================================================
  // 后台：抓取日志
  // ========================================================

  /** 7. 抓取日志分页（按 sourceId） */
  async listLogsBySource(
    sourceId: number,
    query: QueryCrawlLogDto,
  ): Promise<PaginatedResult<CrawlLog>> {
    await this.findSourceById(sourceId);
    return this.listLogsInternal(query, sourceId);
  }

  /** 8. 抓取日志详情 */
  async findLogById(logId: number): Promise<CrawlLog> {
    const log = await this.logRepo.findOne({
      where: { id: logId } as any,
      relations: ['source'],
    });
    if (!log) throw new NotFoundException('抓取日志不存在');
    return log;
  }

  /** 通用日志分页 */
  async listLogs(query: QueryCrawlLogDto): Promise<PaginatedResult<CrawlLog>> {
    return this.listLogsInternal(query);
  }

  private async listLogsInternal(
    query: QueryCrawlLogDto,
    fixedSourceId?: number,
  ): Promise<PaginatedResult<CrawlLog>> {
    const { page, pageSize, sourceId, triggerType, status } = query;
    const qb = this.logRepo.createQueryBuilder('l');
    if (fixedSourceId) {
      qb.andWhere('l.source_id = :sid', { sid: fixedSourceId });
    } else if (sourceId) {
      qb.andWhere('l.source_id = :sourceId', { sourceId });
    }
    if (triggerType !== undefined && triggerType !== null) {
      qb.andWhere('l.trigger_type = :triggerType', { triggerType });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('l.status = :status', { status });
    }
    qb.leftJoinAndSelect('l.source', 'source')
      .orderBy('l.started_at', 'DESC')
      .addOrderBy('l.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  // ========================================================
  // 抓取触发（手动）
  // ========================================================

  /**
   * 6. 手动触发抓取
   * - 记录 CrawlLog(triggerType=2, status=0 进行中)
   * - 留 TODO 调真实抓取
   * - 抓取完成后更新 source.lastCrawledAt/lastStatus + log 状态
   * @returns logId
   */
  async triggerCrawl(sourceId: number): Promise<{ logId: number }> {
    const source = await this.findSourceById(sourceId);
    if (source.enabled !== 1) {
      throw new BadRequestException('抓取源未启用，无法触发抓取');
    }

    // 创建日志：status=0 进行中
    const log = this.logRepo.create({
      sourceId: source.id,
      triggerType: 2, // 手动
      startedAt: new Date(),
      finishedAt: null,
      status: 0, // 进行中
      totalCount: 0,
      newCount: 0,
      errorMsg: null,
    } as CrawlLog);
    const saved = await this.logRepo.save(log);

    // TODO: 调用真实抓取器（cheerio / puppeteer / api / manual）
    // 此处仅同步占位实现：标记为成功（无新增），并更新 source
    try {
      // await this.doCrawl(source, saved);  // 实际抓取入口
      await this.dataSource.transaction(async (manager) => {
        const lg = await manager.findOne(CrawlLog, {
          where: { id: saved.id } as any,
          lock: { mode: 'pessimistic_write' },
        });
        if (!lg) return;
        lg.status = 1; // 成功
        lg.finishedAt = new Date();
        // 占位：totalCount / newCount 仍为 0
        await manager.save(CrawlLog, lg);

        const src = await manager.findOne(EventSource, {
          where: { id: source.id } as any,
        });
        if (src) {
          src.lastCrawledAt = new Date();
          src.lastStatus = 1; // 成功
          await manager.save(EventSource, src);
        }
      });
    } catch (err) {
      // 失败兜底：更新日志状态 + source.lastStatus
      await this.dataSource.transaction(async (manager) => {
        const lg = await manager.findOne(CrawlLog, {
          where: { id: saved.id } as any,
        });
        if (lg) {
          lg.status = 2; // 失败
          lg.finishedAt = new Date();
          lg.errorMsg = (err as Error)?.message?.slice(0, 1000) ?? String(err);
          await manager.save(CrawlLog, lg);
        }
        const src = await manager.findOne(EventSource, {
          where: { id: source.id } as any,
        });
        if (src) {
          src.lastCrawledAt = new Date();
          src.lastStatus = 0; // 失败
          await manager.save(EventSource, src);
        }
      });
    }

    return { logId: saved.id };
  }
}
