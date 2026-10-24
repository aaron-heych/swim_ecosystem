import { get, post, put, del } from './request';

export function getAssociationList(params: any) {
  return get('/admin/association/list', params);
}
export function downloadAssociationImportTemplate() {
  return get('/admin/association/import/template', undefined, {
    responseType: 'blob',
  });
}
export function importAssociations(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return post('/admin/association/import', fd, { responseType: 'blob' });
}
export function getAssociationDetail(id: number) {
  return get(`/admin/association/${id}`);
}
export function createAssociation(data: any) {
  return post('/admin/association', data);
}
export function updateAssociation(id: number, data: any) {
  return put(`/admin/association/${id}`, data);
}
export function auditAssociation(id: number, data: any) {
  return put(`/admin/association/${id}/audit`, data);
}
export function updateAssociationStatus(id: number, status: number) {
  return put(`/admin/association/${id}/status`, { status });
}
export function deleteAssociation(id: number) {
  return del(`/admin/association/${id}`);
}

export function getMemberList(associationId: number, params: any) {
  return get(`/admin/association/${associationId}/members`, params);
}
export function getMemberDetail(memberId: number) {
  return get(`/admin/association/member/${memberId}`);
}
export function updateMember(memberId: number, data: any) {
  return put(`/admin/association/member/${memberId}`, data);
}
export function auditMember(memberId: number, data: any) {
  return put(`/admin/association/member/${memberId}/audit`, data);
}
export function updateMemberRole(memberId: number, role: number) {
  return put(`/admin/association/member/${memberId}/role`, { role });
}
export function updateMemberStatus(memberId: number, status: number) {
  return put(`/admin/association/member/${memberId}/status`, { status });
}
export function deleteMember(memberId: number) {
  return del(`/admin/association/member/${memberId}`);
}

/** 上传会员头像，返回 { name, url, size } */
export function uploadMemberAvatar(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return post('/admin/association/member/upload-avatar', fd);
}
