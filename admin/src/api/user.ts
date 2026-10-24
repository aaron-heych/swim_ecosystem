import { get, post, put, del } from './request';

/* ============== 登录 ============== */

export interface LoginParams {
  username: string;
  password: string;
}
export interface LoginResult {
  token: string;
  adminUser: any;
}
export function login(data: LoginParams) {
  return post<LoginResult>('/admin/user/login', data);
}
export function changeAdminPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return put('/admin/user/change-password', data);
}

/* ============== C 端用户 ============== */

export function getUserList(params: any) {
  return get('/admin/user/list', params);
}
export function updateUserStatus(id: number, status: number) {
  return put(`/admin/user/${id}/status`, { status });
}
export function deleteUser(id: number) {
  return del(`/admin/user/${id}`);
}

/* ============== 权限 ============== */

export function getPermissionTree() {
  return get('/admin/rbac/permissions');
}
export function createPermission(data: any) {
  return post('/admin/rbac/permission', data);
}
export function updatePermission(id: number, data: any) {
  return put(`/admin/rbac/permission/${id}`, data);
}
export function deletePermission(id: number) {
  return del(`/admin/rbac/permission/${id}`);
}

/* ============== 角色 ============== */

export function getRoleList(params: any) {
  return get('/admin/rbac/roles', params);
}
export function createRole(data: any) {
  return post('/admin/rbac/role', data);
}
export function updateRole(id: number, data: any) {
  return put(`/admin/rbac/role/${id}`, data);
}
export function updateRolePermissions(id: number, permissionIds: number[]) {
  return put(`/admin/rbac/role/${id}/permissions`, { permissionIds });
}
export function deleteRole(id: number) {
  return del(`/admin/rbac/role/${id}`);
}

/* ============== 管理员 ============== */

export function getAdminList(params: any) {
  return get('/admin/rbac/admins', params);
}
export function createAdmin(data: any) {
  return post('/admin/rbac/admin', data);
}
export function updateAdmin(id: number, data: any) {
  return put(`/admin/rbac/admin/${id}`, data);
}
export function resetAdminPassword(id: number, password: string) {
  return put(`/admin/rbac/admin/${id}/password`, { password });
}
export function updateAdminRoles(id: number, roleIds: number[]) {
  return put(`/admin/rbac/admin/${id}/roles`, { roleIds });
}
export function updateAdminStatus(id: number, status: number) {
  return put(`/admin/rbac/admin/${id}/status`, { status });
}
export function deleteAdmin(id: number) {
  return del(`/admin/rbac/admin/${id}`);
}
