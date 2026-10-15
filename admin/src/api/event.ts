import { get, post, put, del } from './request';

/* 赛事 */
export function getEventList(params: any) {
  return get('/admin/event/list', params);
}
export function createEvent(data: any) {
  return post('/admin/event', data);
}
export function updateEvent(id: number, data: any) {
  return put(`/admin/event/${id}`, data);
}
export function updateEventStatus(id: number, status: number) {
  return put(`/admin/event/${id}/status`, { status });
}
export function auditEvent(id: number, data: any) {
  return put(`/admin/event/${id}/audit`, data);
}
export function updateEventHot(id: number, isHot: number) {
  return put(`/admin/event/${id}/hot`, { isHot });
}
export function deleteEvent(id: number) {
  return del(`/admin/event/${id}`);
}

/* 赛事组别 */
export function getGroupList(eventId: number) {
  return get(`/admin/event/${eventId}/groups`);
}
export function createGroup(eventId: number, data: any) {
  return post(`/admin/event/${eventId}/group`, data);
}
export function updateGroup(eventId: number, groupId: number, data: any) {
  return put(`/admin/event/${eventId}/group/${groupId}`, data);
}
export function deleteGroup(eventId: number, groupId: number) {
  return del(`/admin/event/${eventId}/group/${groupId}`);
}

/* 报名 */
export function getRegistrationList(params: any) {
  return get('/admin/event/registrations', params);
}
export function updateRegistrationPayStatus(id: number, data: any) {
  return put(`/admin/event/registration/${id}/pay-status`, data);
}

/* 抓取源 */
export function getSourceList(params: any) {
  return get('/admin/event-source/list', params);
}
export function createSource(data: any) {
  return post('/admin/event-source', data);
}
export function updateSource(id: number, data: any) {
  return put(`/admin/event-source/${id}`, data);
}
export function deleteSource(id: number) {
  return del(`/admin/event-source/${id}`);
}
export function triggerCrawl(id: number) {
  return post(`/admin/event-source/${id}/crawl`);
}

/* 抓取日志 */
export function getCrawlLogList(params: any) {
  return get('/admin/event-source/crawl-logs', params);
}
