import { get, post, put, del } from './request';

export function getActivityList(params: any) {
  return get('/admin/activity/list', params);
}
export function createActivity(data: any) {
  return post('/admin/activity', data);
}
export function updateActivity(id: number, data: any) {
  return put(`/admin/activity/${id}`, data);
}
export function updateActivityStatus(id: number, status: number) {
  return put(`/admin/activity/${id}/status`, { status });
}
export function deleteActivity(id: number) {
  return del(`/admin/activity/${id}`);
}
