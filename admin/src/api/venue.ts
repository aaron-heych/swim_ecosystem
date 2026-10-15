import { get, post, put, del } from './request';

/* 场馆 */
export function getVenueList(params: any) {
  return get('/admin/venue/list', params);
}
export function createVenue(data: any) {
  return post('/admin/venue', data);
}
export function updateVenue(id: number, data: any) {
  return put(`/admin/venue/${id}`, data);
}
export function auditVenue(id: number, data: any) {
  return put(`/admin/venue/${id}/audit`, data);
}
export function updateVenueStatus(id: number, status: number) {
  return put(`/admin/venue/${id}/status`, { status });
}
export function deleteVenue(id: number) {
  return del(`/admin/venue/${id}`);
}

/* 教练 */
export function getCoachList(params: any) {
  return get('/admin/coach/list', params);
}
export function createCoach(data: any) {
  return post('/admin/coach', data);
}
export function updateCoach(id: number, data: any) {
  return put(`/admin/coach/${id}`, data);
}
export function auditCoach(id: number, data: any) {
  return put(`/admin/coach/${id}/audit`, data);
}
export function updateCoachStatus(id: number, status: number) {
  return put(`/admin/coach/${id}/status`, { status });
}
export function deleteCoach(id: number) {
  return del(`/admin/coach/${id}`);
}

/* 课程 */
export function createCourse(data: any) {
  return post('/admin/coach/0/course', data);
}
export function updateCourse(courseId: number, data: any) {
  return put(`/admin/coach/course/${courseId}`, data);
}
export function updateCourseStatus(courseId: number, status: number) {
  return put(`/admin/coach/course/${courseId}/status`, { status });
}
export function deleteCourse(courseId: number) {
  return del(`/admin/coach/course/${courseId}`);
}

/* 排班 */
export function createSchedules(data: any) {
  return post('/admin/coach/schedule', data);
}
export function deleteSchedule(id: number) {
  return del(`/admin/coach/schedule/${id}`);
}

/* 预约 */
export function getAppointmentList(params: any) {
  return get('/admin/coach/appointments', params);
}
export function updateAppointmentStatus(id: number, status: number) {
  return put(`/admin/coach/appointment/${id}/status`, { status });
}
export function updateAppointmentPayStatus(id: number, data: any) {
  return put(`/admin/coach/appointment/${id}/pay-status`, data);
}

/* 评价 */
export function replyReview(id: number, reply: string) {
  return put(`/admin/coach/review/${id}/reply`, { reply });
}
