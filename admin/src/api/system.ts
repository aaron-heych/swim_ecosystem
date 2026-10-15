import { get, post, put, del } from './request';

/* Banner */
export function getBannerList(params: any) {
  return get('/admin/system/banners', params);
}
export function createBanner(data: any) {
  return post('/admin/system/banner', data);
}
export function updateBanner(id: number, data: any) {
  return put(`/admin/system/banner/${id}`, data);
}
export function deleteBanner(id: number) {
  return del(`/admin/system/banner/${id}`);
}

/* 反馈 */
export function getFeedbackList(params: any) {
  return get('/admin/system/feedbacks', params);
}
export function replyFeedback(id: number, reply: string) {
  return put(`/admin/system/feedback/${id}/reply`, { reply });
}

/* 系统配置 */
export function getConfigList(params: any) {
  return get('/admin/system/configs', params);
}
export function createConfig(data: any) {
  return post('/admin/system/config', data);
}
export function updateConfig(id: number, data: any) {
  return put(`/admin/system/config/${id}`, data);
}
export function deleteConfig(id: number) {
  return del(`/admin/system/config/${id}`);
}

/* 操作日志 */
export function getOperationLogList(params: any) {
  return get('/admin/system/operation-logs', params);
}
