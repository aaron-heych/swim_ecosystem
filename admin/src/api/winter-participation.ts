import { get, post, put, del } from './request';

/* ============ 参与协会（赛事 / 活动共用） ============ */
export function getParticipationList(params: any) {
  return get('/admin/winter-participation/list', params);
}
export function createParticipation(data: any) {
  return post('/admin/winter-participation', data);
}
export function updateParticipation(id: number, data: any) {
  return put(`/admin/winter-participation/${id}`, data);
}
export function deleteParticipation(id: number) {
  return del(`/admin/winter-participation/${id}`);
}

/* ============ 参与人员 ============ */
export function getParticipationMembers(id: number) {
  return get(`/admin/winter-participation/${id}/participants`);
}
export function getMemberOptions(id: number) {
  return get(`/admin/winter-participation/${id}/member-options`);
}
export function importMembers(id: number, memberIds: number[]) {
  return post(`/admin/winter-participation/${id}/import-members`, { memberIds });
}
export function getParticipantOptions(targetType: number, targetId: number) {
  return get('/admin/winter-participation/participant-options', {
    targetType,
    targetId,
  });
}
export function updateParticipant(id: number, data: any) {
  return put(`/admin/winter-participant/${id}`, data);
}
export function deleteParticipant(id: number) {
  return del(`/admin/winter-participant/${id}`);
}
