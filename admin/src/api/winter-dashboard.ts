import request from './request';

/** 冬泳管理仪表盘（按角色返回不同数据范围） */
export function getWinterDashboard() {
  return request.get('/admin/winter-dashboard');
}
