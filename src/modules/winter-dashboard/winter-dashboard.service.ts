import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Event, EventSource } from '../event/event.entity';
import { Association, AssociationMember } from '../association/association.entity';

/** 年龄分层桶 */
const AGE_BUCKETS = ['18岁以下', '18-29岁', '30-39岁', '40-49岁', '50-59岁', '60岁以上'];

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

@Injectable()
export class WinterDashboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * 冬泳管理仪表盘数据
   * - super_admin / swimming_admin：全量指标（协会/会员/年龄分层/会员趋势 + 赛事）
   * - swimming_sub_admin：仅近三个月赛事信息
   */
  async build(user: any) {
    const roleCodes: string[] = user?.roleCodes ?? [];
    const full =
      roleCodes.includes('super_admin') || roleCodes.includes('swimming_admin');

    const events = await this.findRecentEvents();
    if (!full) {
      return { full: false, events };
    }

    const assocRepo = this.dataSource.getRepository(Association);
    const memberRepo = this.dataSource.getRepository(AssociationMember);
    const monthStart = fmtDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    const [associationsTotal, membersTotal, monthNewMembers, ageDistribution, memberTrend] =
      await Promise.all([
        assocRepo.count(),
        memberRepo.count({ where: { status: 1 } }),
        memberRepo
          .createQueryBuilder('m')
          .where('m.status = 1')
          .andWhere('m.created_at >= :monthStart', { monthStart })
          .getCount(),
        this.findAgeDistribution(),
        this.findMemberTrend(),
      ]);

    return {
      full: true,
      events,
      stats: {
        associationsTotal,
        membersTotal,
        monthNewMembers,
        recentEventCount: events.length,
      },
      ageDistribution,
      memberTrend,
    };
  }

  /** 近三个月（前后各 3 个月窗口）从各官方网站爬取/发布的赛事 */
  private async findRecentEvents() {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 3);
    const to = new Date(now);
    to.setMonth(to.getMonth() + 3);

    const rows = await this.dataSource
      .getRepository(Event)
      .createQueryBuilder('e')
      .leftJoin(EventSource, 's', 's.id = e.source_id')
      .select('e.id', 'id')
      .addSelect('e.title', 'title')
      .addSelect('e.organizer', 'organizer')
      .addSelect('s.name', 'sourceName')
      .addSelect('e.source_url', 'sourceUrl')
      .addSelect('e.province', 'province')
      .addSelect('e.city', 'city')
      .addSelect('e.venue_name', 'venueName')
      .addSelect("DATE_FORMAT(e.start_date, '%Y-%m-%d')", 'startDate')
      .addSelect("DATE_FORMAT(e.end_date, '%Y-%m-%d')", 'endDate')
      .addSelect('e.status', 'status')
      .where('e.audit_status = 1')
      .andWhere('e.status <> 4')
      .andWhere('e.source_id IS NOT NULL')
      .andWhere('e.start_date IS NOT NULL')
      .andWhere('e.start_date BETWEEN :from AND :to', {
        from: fmtDate(from),
        to: fmtDate(to),
      })
      .orderBy('e.start_date', 'DESC')
      .limit(30)
      .getRawMany();

    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      status: Number(r.status),
    }));
  }

  /** 会员年龄层级分布（按会员关联用户的生日计算） */
  private async findAgeDistribution() {
    const rows: { label: string; count: string }[] = await this.dataSource.query(
      `SELECT CASE
          WHEN t.age IS NULL THEN '未知'
          WHEN t.age < 18 THEN '18岁以下'
          WHEN t.age < 30 THEN '18-29岁'
          WHEN t.age < 40 THEN '30-39岁'
          WHEN t.age < 50 THEN '40-49岁'
          WHEN t.age < 60 THEN '50-59岁'
          ELSE '60岁以上'
        END AS label,
        COUNT(*) AS count
      FROM (
        SELECT TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age
        FROM association_members m
        LEFT JOIN users u ON u.id = m.user_id
        WHERE m.status = 1 AND m.deleted_at IS NULL
      ) t
      GROUP BY label
      ORDER BY MIN(COALESCE(t.age, -1))`,
    );
    return rows.map((r) => ({ label: r.label, count: Number(r.count) }));
  }

  /** 近 12 个月会员新增趋势（缺月补 0） */
  private async findMemberTrend() {
    const rows: { ym: string; count: string }[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(m.created_at, '%Y-%m') AS ym, COUNT(*) AS count
      FROM association_members m
      WHERE m.status = 1
        AND m.deleted_at IS NULL
        AND m.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
      GROUP BY ym
      ORDER BY ym`,
    );
    const map = new Map(rows.map((r) => [r.ym, Number(r.count)]));
    const result: { month: string; count: number }[] = [];
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 11);
    for (let i = 0; i < 12; i++) {
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: ym, count: map.get(ym) ?? 0 });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }
}
