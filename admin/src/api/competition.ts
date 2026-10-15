import { get, post, put, del } from './request';

export function getCompetitionList(params: any) {
  return get('/admin/competition/list', params);
}
export function createCompetition(data: any) {
  return post('/admin/competition', data);
}
export function updateCompetition(id: number, data: any) {
  return put(`/admin/competition/${id}`, data);
}
export function updateCompetitionStatus(id: number, status: number) {
  return put(`/admin/competition/${id}/status`, { status });
}
export function deleteCompetition(id: number) {
  return del(`/admin/competition/${id}`);
}

/* ============ 项目 / 组别 ============ */
export function getCompetitionGroups(id: number) {
  return get(`/admin/competition/${id}/groups`);
}
export function createCompetitionGroup(id: number, data: any) {
  return post(`/admin/competition/${id}/groups`, data);
}
export function updateCompetitionGroup(gid: number, data: any) {
  return put(`/admin/competition/group/${gid}`, data);
}
export function deleteCompetitionGroup(gid: number) {
  return del(`/admin/competition/group/${gid}`);
}

/* ============ 个人成绩 ============ */
export function getCompetitionResults(id: number, params?: any) {
  return get(`/admin/competition/${id}/results`, params);
}
export function createCompetitionResult(id: number, data: any) {
  return post(`/admin/competition/${id}/results`, data);
}
export function updateCompetitionResult(rid: number, data: any) {
  return put(`/admin/competition/result/${rid}`, data);
}
export function deleteCompetitionResult(rid: number) {
  return del(`/admin/competition/result/${rid}`);
}
export function downloadCompetitionResultsTemplate(id: number) {
  return get(`/admin/competition/${id}/results/template`, undefined, {
    responseType: 'blob',
  });
}
export function importCompetitionResults(id: number, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return post(`/admin/competition/${id}/results/import`, fd);
}
export function getTeamRanking(id: number) {
  return get(`/admin/competition/${id}/team-ranking`);
}

/* ============ 积分规则 ============ */
export function getCompetitionScoreRules(id: number) {
  return get(`/admin/competition/${id}/score-rules`);
}
/** 整体保存积分规则；传空数组恢复默认 9/7/6/5/4/3/2/1 */
export function saveCompetitionScoreRules(id: number, rules: any[]) {
  return put(`/admin/competition/${id}/score-rules`, { rules });
}

/* ============ 成绩原始记录上传 ============ */
/** 上传图片/zip 原始记录，返回 { name, url, size } */
export function uploadResultAttachment(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return post('/admin/competition/upload', fd);
}

/* ============ 比赛结果附件（赛事级） ============ */
export function getResultAttachments(id: number) {
  return get(`/admin/competition/${id}/result-attachments`);
}

/** 整体保存（前端拼好列表整体提交） */
export function saveResultAttachments(id: number, attachments: any[]) {
  return put(`/admin/competition/${id}/result-attachments`, { attachments });
}

/* ============ 赛事花絮照片（赛事级，仅图片） ============ */
export function getGalleryAttachments(id: number) {
  return get(`/admin/competition/${id}/gallery-attachments`);
}

export function saveGalleryAttachments(id: number, attachments: any[]) {
  return put(`/admin/competition/${id}/gallery-attachments`, { attachments });
}

/* ============ 赞助商 ============ */
export function getCompetitionSponsors(id: number) {
  return get(`/admin/competition/${id}/sponsors`);
}
export function createCompetitionSponsor(id: number, data: any) {
  return post(`/admin/competition/${id}/sponsors`, data);
}
export function updateCompetitionSponsor(sid: number, data: any) {
  return put(`/admin/competition/sponsor/${sid}`, data);
}
export function deleteCompetitionSponsor(sid: number) {
  return del(`/admin/competition/sponsor/${sid}`);
}
