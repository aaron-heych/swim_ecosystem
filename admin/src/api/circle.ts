import { get, put, del } from './request';

/* 帖子 */
export function getPostList(params: any) {
  return get('/admin/circle/posts', params);
}
export function auditPost(id: number, data: any) {
  return put(`/admin/circle/post/${id}/audit`, data);
}
export function togglePostTop(id: number, isTop: number) {
  return put(`/admin/circle/post/${id}/top`, { isTop });
}
export function deletePost(id: number) {
  return del(`/admin/circle/post/${id}`);
}

/* 评论 */
export function getCommentList(params: any) {
  return get('/admin/circle/comments', params);
}
export function deleteComment(id: number) {
  return del(`/admin/circle/comment/${id}`);
}

/* 举报 */
export function getReportList(params: any) {
  return get('/admin/circle/reports', params);
}
export function handleReport(id: number, data: any) {
  return put(`/admin/circle/report/${id}/handle`, data);
}
