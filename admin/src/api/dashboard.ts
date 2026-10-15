import { get } from './request';

/**
 * C 端访问量明细查询参数
 */
export interface AccessStatDetailQuery {
  module?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortField?: 'stat_date' | 'count' | 'module';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 仪表盘统计数据
 * 注：后端未单独提供 dashboard 接口，使用各模块 list pageSize=1 获取 total
 * 这里直接导出一些便捷方法，供 Dashboard 页面并行调用
 */
export function getUserTotal() {
  return get('/admin/user/list', { page: 1, pageSize: 1 });
}
export function getVenueTotal() {
  return get('/admin/venue/list', { page: 1, pageSize: 1 });
}
export function getCoachTotal() {
  return get('/admin/coach/list', { page: 1, pageSize: 1 });
}
export function getEventTotal() {
  return get('/admin/event/list', { page: 1, pageSize: 1 });
}
export function getAssociationTotal() {
  return get('/admin/association/list', { page: 1, pageSize: 1 });
}
export function getPostTotal() {
  return get('/admin/circle/posts', { page: 1, pageSize: 1 });
}

/**
 * C 端访问量统计
 * 返回各功能模块（冬泳协会/参赛报名/游泳场馆/教练/圈子/...）的
 * 今日/7日/累计访问量 + 最近 N 天趋势
 */
export function getAccessStats(days = 7) {
  return get('/admin/system/access-stats', { days });
}

export interface AccessStatModule {
  module: string;
  label: string;
  today: number;
  week: number;
  total: number;
}
export interface AccessStatTrendItem {
  date: string;
  total: number;
  items: Record<string, number>;
}
export interface AccessStatResult {
  summary: AccessStatModule[];
  trend: AccessStatTrendItem[];
  grandTotal: number;
  todayTotal: number;
  weekTotal: number;
  days: number;
  startDate: string;
  endDate: string;
}

/**
 * C 端访问量明细（多维度检索页）
 */
export interface AccessStatDetailByModule {
  module: string;
  label: string;
  total: number;
  percent: number;
}
export interface AccessStatDetailByDay {
  date: string;
  total: number;
  items: Record<string, number>;
}
export interface AccessStatDetailListItem {
  statDate: string;
  module: string;
  label: string;
  count: number;
}
export interface AccessStatDetailResult {
  rangeTotal: number;
  rangeAvg: number;
  moduleCount: number;
  maxDayTotal: number;
  startDate: string;
  endDate: string;
  module: string | null;
  byModule: AccessStatDetailByModule[];
  byDay: AccessStatDetailByDay[];
  list: {
    list: AccessStatDetailListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function getAccessStatDetail(params: AccessStatDetailQuery) {
  return get('/admin/system/access-stats/detail', params);
}

