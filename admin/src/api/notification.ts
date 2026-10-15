import { get, post, put, del } from './request';

/* 模板 */
export function getTemplateList(params: any) {
  return get('/admin/notification/templates', params);
}
export function createTemplate(data: any) {
  return post('/admin/notification/template', data);
}
export function updateTemplate(id: number, data: any) {
  return put(`/admin/notification/template/${id}`, data);
}
export function deleteTemplate(id: number) {
  return del(`/admin/notification/template/${id}`);
}

/* 发送通知 */
export function sendNotification(data: any) {
  return post('/admin/notification/send', data);
}

/* 发送日志 */
export function getLogList(params: any) {
  return get('/admin/notification/logs', params);
}

/* 通知公告 */
export function getAnnouncementList(params: any) {
  return get('/admin/notification/announcements', params);
}
export function getAnnouncement(id: number) {
  return get(`/admin/notification/announcement/${id}`);
}
export function createAnnouncement(data: any) {
  return post('/admin/notification/announcement', data);
}
export function updateAnnouncement(id: number, data: any) {
  return put(`/admin/notification/announcement/${id}`, data);
}
export function publishAnnouncement(id: number) {
  return post(`/admin/notification/announcement/${id}/publish`);
}
export function withdrawAnnouncement(id: number) {
  return post(`/admin/notification/announcement/${id}/withdraw`);
}
export function deleteAnnouncement(id: number) {
  return del(`/admin/notification/announcement/${id}`);
}
export function getAnnouncementMembers(params: any) {
  return get('/admin/notification/announcement/members', params);
}
export function uploadAnnouncementAttachment(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return post('/admin/notification/announcement/attachment', fd);
}
export function getAnnouncementRecipients(id: number, params: any) {
  return get(`/admin/notification/announcement/${id}/recipients`, params);
}
export function exportAnnouncementAttendance(id: number) {
  return get(`/admin/notification/announcement/${id}/attendance.csv`, undefined, {
    responseType: 'blob',
  });
}
