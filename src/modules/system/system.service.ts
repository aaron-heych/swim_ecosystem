/**
 * 系统服务 — Banner / Feedback / SysConfig / OperationLog
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner, Feedback, SysConfig, OperationLog, AccessStat } from './system.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { QueryAccessStatDto } from './dto/query-access-stat.dto';
import { QueryAccessStatDetailDto } from './dto/query-access-stat-detail.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

/** C 端访问量统计模块目录（URL 前缀 → 模块 key + 中文标签） */
export const ACCESS_MODULES: { key: string; label: string }[] = [
  { key: 'association', label: '冬泳协会' },
  { key: 'event', label: '参赛报名' },
  { key: 'venue', label: '游泳场馆' },
  { key: 'coach', label: '教练预约' },
  { key: 'circle', label: '游泳圈子' },
  { key: 'user', label: '用户中心' },
  { key: 'system', label: '系统服务' },
  { key: 'notification', label: '消息通知' },
];

/** 取 +08:00 当地日期字符串 YYYY-MM-DD */
function todayShanghai(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/** 将 stat_date 查询结果（可能是 Date 对象 / 字符串）规范为 YYYY-MM-DD */
function toISODate(v: any): string {
  if (v == null) return '';
  if (v instanceof Date) {
    return v.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  }
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(SysConfig)
    private readonly configRepo: Repository<SysConfig>,
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
    @InjectRepository(AccessStat)
    private readonly accessRepo: Repository<AccessStat>,
  ) {}

  /* ============================ Banner - C 端 ============================ */

  /** C 端：按位置获取已上线 Banner（status=1 + 当前时间在 startAt/endAt 之间） */
  async findActiveBanners(position?: string): Promise<Banner[]> {
    const now = new Date();
    const qb = this.bannerRepo.createQueryBuilder('b');
    qb.where('b.status = 1');
    if (position) qb.andWhere('b.position = :position', { position });
    qb.andWhere('(b.start_at IS NULL OR b.start_at <= :now)', { now });
    qb.andWhere('(b.end_at IS NULL OR b.end_at >= :now)', { now });
    qb.orderBy('b.sort', 'DESC').addOrderBy('b.createdAt', 'DESC');
    return qb.getMany();
  }

  /* ============================ Banner - 后台 ============================ */

  async findBanners(query: QueryBannerDto): Promise<PaginatedResult<Banner>> {
    const { page, pageSize, keyword, position, status } = query;
    const qb = this.bannerRepo.createQueryBuilder('b');
    if (position) qb.andWhere('b.position = :position', { position });
    if (status !== undefined) qb.andWhere('b.status = :status', { status });
    if (keyword) qb.andWhere('b.title LIKE :kw', { kw: `%${keyword}%` });
    qb.orderBy('b.sort', 'DESC').addOrderBy('b.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async createBanner(dto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannerRepo.create({
      title: dto.title,
      imageUrl: dto.imageUrl,
      position: dto.position ?? 'home',
      linkType: dto.linkType ?? 0,
      linkValue: dto.linkValue ?? null,
      sort: dto.sort ?? 0,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      status: dto.status ?? 1,
    });
    return this.bannerRepo.save(banner);
  }

  async updateBanner(id: number, dto: CreateBannerDto): Promise<Banner> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner 不存在');
    Object.assign(banner, {
      title: dto.title,
      imageUrl: dto.imageUrl,
      position: dto.position ?? banner.position,
      linkType: dto.linkType ?? banner.linkType,
      linkValue: dto.linkValue ?? banner.linkValue,
      sort: dto.sort ?? banner.sort,
      startAt: dto.startAt ? new Date(dto.startAt) : banner.startAt,
      endAt: dto.endAt ? new Date(dto.endAt) : banner.endAt,
      status: dto.status ?? banner.status,
    });
    return this.bannerRepo.save(banner);
  }

  async updateBannerStatus(id: number, status: number): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner 不存在');
    await this.bannerRepo.update(id, { status });
  }

  async deleteBanner(id: number): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner 不存在');
    await this.bannerRepo.delete(id);
  }

  /* ============================ Feedback - C 端 ============================ */

  async createFeedback(userId: number | null, dto: CreateFeedbackDto): Promise<Feedback> {
    const fb = this.feedbackRepo.create({
      userId,
      type: dto.type,
      content: dto.content,
      images: dto.images ?? null,
      contact: dto.contact ?? null,
      status: 0,
    });
    return this.feedbackRepo.save(fb);
  }

  /* ============================ Feedback - 后台 ============================ */

  async findFeedbacks(query: QueryFeedbackDto): Promise<PaginatedResult<Feedback>> {
    const { page, pageSize, keyword, status, type } = query;
    const qb = this.feedbackRepo.createQueryBuilder('f');
    if (status !== undefined) qb.andWhere('f.status = :status', { status });
    if (type) qb.andWhere('f.type = :type', { type });
    if (keyword) qb.andWhere('f.content LIKE :kw', { kw: `%${keyword}%` });
    qb.orderBy('f.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async replyFeedback(id: number, adminId: number, dto: ReplyFeedbackDto): Promise<void> {
    const fb = await this.feedbackRepo.findOne({ where: { id } });
    if (!fb) throw new NotFoundException('反馈不存在');
    await this.feedbackRepo.update(id, {
      reply: dto.reply,
      status: 1,
      replyBy: adminId,
      repliedAt: new Date(),
    });
  }

  async closeFeedback(id: number): Promise<void> {
    const fb = await this.feedbackRepo.findOne({ where: { id } });
    if (!fb) throw new NotFoundException('反馈不存在');
    await this.feedbackRepo.update(id, { status: 2 });
  }

  /* ============================ SysConfig - C 端 ============================ */

  /** C 端按 key 查询单条配置，仅 configGroup=public 可见 */
  async findPublicConfig(key: string): Promise<SysConfig> {
    const config = await this.configRepo.findOne({ where: { configKey: key } });
    if (!config) throw new NotFoundException('配置不存在');
    if (config.configGroup !== 'public') {
      throw new ForbiddenException('该配置不可见');
    }
    return config;
  }

  /* ============================ SysConfig - 后台 ============================ */

  async findConfigs(query: QueryConfigDto): Promise<PaginatedResult<SysConfig>> {
    const { page, pageSize, keyword, configGroup } = query;
    const qb = this.configRepo.createQueryBuilder('c');
    if (configGroup) qb.andWhere('c.config_group = :configGroup', { configGroup });
    if (keyword) {
      qb.andWhere('(c.config_key LIKE :kw OR c.remark LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('c.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async createConfig(dto: CreateConfigDto): Promise<SysConfig> {
    const exist = await this.configRepo.findOne({
      where: { configKey: dto.configKey },
    });
    if (exist) throw new BadRequestException('配置 key 已存在');
    const config = this.configRepo.create({
      configGroup: dto.configGroup,
      configKey: dto.configKey,
      configValue: dto.configValue ?? null,
      valueType: dto.valueType ?? 'string',
      remark: dto.remark ?? null,
    });
    return this.configRepo.save(config);
  }

  async updateConfig(id: number, dto: CreateConfigDto): Promise<SysConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('配置不存在');
    Object.assign(config, {
      configGroup: dto.configGroup,
      configKey: dto.configKey,
      configValue: dto.configValue ?? config.configValue,
      valueType: dto.valueType ?? config.valueType,
      remark: dto.remark ?? config.remark,
    });
    return this.configRepo.save(config);
  }

  async deleteConfig(id: number): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('配置不存在');
    await this.configRepo.delete(id);
  }

  /* ============================ OperationLog ============================ */

  async findOperationLogs(query: QueryOperationLogDto): Promise<PaginatedResult<OperationLog>> {
    const { page, pageSize, keyword, adminId, module, action, status, startDate, endDate } = query;
    const qb = this.logRepo.createQueryBuilder('l');
    if (adminId) qb.andWhere('l.admin_id = :adminId', { adminId });
    if (module) qb.andWhere('l.module = :module', { module });
    if (action) qb.andWhere('l.action = :action', { action });
    if (status !== undefined) qb.andWhere('l.status = :status', { status });
    if (startDate && endDate) {
      qb.andWhere('l.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    } else if (startDate) {
      qb.andWhere('l.createdAt >= :start', { start: new Date(startDate) });
    } else if (endDate) {
      qb.andWhere('l.createdAt <= :end', { end: new Date(endDate) });
    }
    if (keyword) {
      qb.andWhere('(l.username LIKE :kw OR l.error_msg LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('l.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /* ============================ C 端访问量统计 ============================ */

  /**
   * 记录一次 C 端访问（fire-and-forget，失败不影响主请求）。
   * 使用 INSERT ... ON DUPLICATE KEY UPDATE 原子累加。
   */
  async recordAccess(module: string): Promise<void> {
    if (!module) return;
    try {
      const today = todayShanghai();
      await this.accessRepo.query(
        'INSERT INTO access_stats (module, stat_date, count) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE count = count + 1',
        [module, today],
      );
    } catch (e) {
      // 写入失败仅记录日志，不影响主请求
      this.logger.warn(`recordAccess failed: ${(e as Error).message}`);
    }
  }

  /**
   * 汇总 C 端访问量：
   * - summary：各模块的 今日访问 / 7 日访问 / 累计总访问
   * - trend：最近 N 天每日各模块访问量（供前端趋势图）
   * - grandTotal：全站累计总访问
   */
  async findAccessStats(query: QueryAccessStatDto) {
    const days = Math.min(Math.max(query.days ?? 7, 1), 90);
    const today = todayShanghai();

    // 计算起始日期（today - (days-1)）
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = startDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

    // 1) 今日访问（按模块）
    const todayRows: any[] = await this.accessRepo.query(
      'SELECT module, count FROM access_stats WHERE stat_date = ?',
      [today],
    );
    const todayMap: Record<string, number> = {};
    for (const r of todayRows) todayMap[r.module] = Number(r.count);

    // 2) 近 7 日访问（按模块聚合）
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStr = weekStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    const weekRows: any[] = await this.accessRepo.query(
      'SELECT module, IFNULL(SUM(count), 0) AS total FROM access_stats WHERE stat_date >= ? GROUP BY module',
      [weekStr],
    );
    const weekMap: Record<string, number> = {};
    for (const r of weekRows) weekMap[r.module] = Number(r.total);

    // 3) 累计访问（按模块聚合）
    const totalRows: any[] = await this.accessRepo.query(
      'SELECT module, IFNULL(SUM(count), 0) AS total FROM access_stats GROUP BY module',
    );
    const totalMap: Record<string, number> = {};
    for (const r of totalRows) totalMap[r.module] = Number(r.total);

    // 4) 趋势：最近 N 天每日各模块计数
    const trendRows: any[] = await this.accessRepo.query(
      'SELECT stat_date AS statDate, module, count FROM access_stats WHERE stat_date >= ? ORDER BY stat_date ASC',
      [startStr],
    );
    // 组装：日期 → { module: count }
    const trendMap: Record<string, Record<string, number>> = {};
    for (const r of trendRows) {
      const d = toISODate(r.statDate); // 规范为 YYYY-MM-DD
      if (!trendMap[d]) trendMap[d] = {};
      trendMap[d][r.module] = Number(r.count);
    }
    // 补全缺失日期，保证趋势连续
    const trend: { date: string; total: number; items: Record<string, number> }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ds = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
      const items = trendMap[ds] ?? {};
      let dayTotal = 0;
      for (const m of ACCESS_MODULES) dayTotal += items[m.key] ?? 0;
      trend.push({ date: ds, total: dayTotal, items });
    }

    // 5) 汇总卡片
    const summary = ACCESS_MODULES.map((m) => ({
      module: m.key,
      label: m.label,
      today: todayMap[m.key] ?? 0,
      week: weekMap[m.key] ?? 0,
      total: totalMap[m.key] ?? 0,
    }));
    const grandTotal = summary.reduce((s, x) => s + x.total, 0);
    const todayTotal = summary.reduce((s, x) => s + x.today, 0);
    const weekTotal = summary.reduce((s, x) => s + x.week, 0);

    return {
      summary,
      trend,
      grandTotal,
      todayTotal,
      weekTotal,
      days,
      startDate: startStr,
      endDate: today,
    };
  }

  /**
   * 访问量明细：支持 模块 / 日期范围 多维度筛选 + 分页
   * 返回：
   * - rangeTotal：筛选区间内总访问量
   * - byModule：区间内按模块聚合（含 label / total / percent）
   * - byDay：区间内按日聚合（日期 + 合计 + 各模块 items）
   * - list：分页明细（statDate / module / label / count）
   */
  async findAccessStatDetail(query: QueryAccessStatDetailDto) {
    const today = todayShanghai();

    // 1) 解析日期范围（默认近 30 天）
    let startStr: string;
    let endStr: string;
    if (query.startDate && query.endDate) {
      startStr = query.startDate;
      endStr = query.endDate;
    } else {
      const days = 30;
      const start = new Date();
      start.setDate(start.getDate() - (days - 1));
      startStr = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
      endStr = today;
    }
    const moduleFilter = query.module || '';

    // 2) 区间总访问量
    let rangeTotalSql =
      'SELECT IFNULL(SUM(count), 0) AS total FROM access_stats WHERE stat_date BETWEEN ? AND ?';
    const rangeParams: any[] = [startStr, endStr];
    if (moduleFilter) {
      rangeTotalSql += ' AND module = ?';
      rangeParams.push(moduleFilter);
    }
    const rangeTotalRows: any[] = await this.accessRepo.query(rangeTotalSql, rangeParams);
    const rangeTotal = Number(rangeTotalRows[0]?.total ?? 0);

    // 3) 区间内按模块聚合
    let byModuleSql =
      'SELECT module, IFNULL(SUM(count), 0) AS total FROM access_stats WHERE stat_date BETWEEN ? AND ?';
    const byModuleParams: any[] = [startStr, endStr];
    if (moduleFilter) {
      byModuleSql += ' AND module = ?';
      byModuleParams.push(moduleFilter);
    }
    byModuleSql += ' GROUP BY module ORDER BY total DESC';
    const byModuleRows: any[] = await this.accessRepo.query(byModuleSql, byModuleParams);
    const labelOf = (key: string) =>
      ACCESS_MODULES.find((m) => m.key === key)?.label ?? key;
    const byModule = byModuleRows.map((r) => ({
      module: r.module,
      label: labelOf(r.module),
      total: Number(r.total),
      percent:
        rangeTotal > 0 ? Number(((Number(r.total) / rangeTotal) * 100).toFixed(2)) : 0,
    }));

    // 4) 区间内按日聚合（含各模块 items，供堆叠趋势图）
    let byDaySql =
      'SELECT stat_date AS statDate, module, count FROM access_stats WHERE stat_date BETWEEN ? AND ?';
    const byDayParams: any[] = [startStr, endStr];
    if (moduleFilter) {
      byDaySql += ' AND module = ?';
      byDayParams.push(moduleFilter);
    }
    byDaySql += ' ORDER BY stat_date ASC';
    const byDayRows: any[] = await this.accessRepo.query(byDaySql, byDayParams);
    // 组装：日期 → { module: count }
    const byDayMap: Record<string, Record<string, number>> = {};
    for (const r of byDayRows) {
      const d = toISODate(r.statDate);
      if (!byDayMap[d]) byDayMap[d] = {};
      byDayMap[d][r.module] = Number(r.count);
    }
    // 补全缺失日期，保证趋势连续
    const byDay: { date: string; total: number; items: Record<string, number> }[] = [];
    const startParts = startStr.split('-').map(Number);
    const endParts = endStr.split('-').map(Number);
    const startD = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const endD = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    for (let t = new Date(startD); t <= endD; t.setDate(t.getDate() + 1)) {
      const ds = t.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
      const items = byDayMap[ds] ?? {};
      let dayTotal = 0;
      for (const k of Object.keys(items)) dayTotal += items[k];
      byDay.push({ date: ds, total: dayTotal, items });
    }

    // 5) 分页明细列表（按 stat_date DESC + module ASC）
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
    const allowedSort = ['stat_date', 'count', 'module'];
    const sortField = allowedSort.includes(query.sortField ?? '')
      ? query.sortField
      : 'stat_date';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 计算总数
    let countSql =
      'SELECT COUNT(*) AS total FROM access_stats WHERE stat_date BETWEEN ? AND ?';
    const countParams: any[] = [startStr, endStr];
    if (moduleFilter) {
      countSql += ' AND module = ?';
      countParams.push(moduleFilter);
    }
    const countRows: any[] = await this.accessRepo.query(countSql, countParams);
    const total = Number(countRows[0]?.total ?? 0);

    // 分页数据
    let listSql =
      'SELECT stat_date AS statDate, module, count FROM access_stats WHERE stat_date BETWEEN ? AND ?';
    const listParams: any[] = [startStr, endStr];
    if (moduleFilter) {
      listSql += ' AND module = ?';
      listParams.push(moduleFilter);
    }
    listSql += ` ORDER BY ${sortField} ${sortOrder}, module ASC LIMIT ? OFFSET ?`;
    listParams.push(pageSize, (page - 1) * pageSize);
    const listRows: any[] = await this.accessRepo.query(listSql, listParams);
    const list = listRows.map((r) => ({
      statDate: toISODate(r.statDate),
      module: r.module,
      label: labelOf(r.module),
      count: Number(r.count),
    }));

    // 统计区间内单日最大值与命中模块数
    const maxDayTotal = byDay.reduce((mx, d) => Math.max(mx, d.total), 0);
    const moduleCount = byModule.length;

    return {
      rangeTotal,
      rangeAvg: byDay.length ? Number((rangeTotal / byDay.length).toFixed(1)) : 0,
      moduleCount,
      maxDayTotal,
      startDate: startStr,
      endDate: endStr,
      module: moduleFilter || null,
      byModule,
      byDay,
      list: paginate(list, total, page, pageSize),
    };
  }
}
