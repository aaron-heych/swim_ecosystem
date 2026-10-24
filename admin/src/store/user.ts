import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AdminUser {
  id: number;
  username: string;
  realName?: string;
  avatar?: string;
  roles?: ({ id: number; name: string; code: string } | string)[];
  roleCodes?: string[];
  permissions?: string[];
  associationId?: number | null;
  needChangePassword?: boolean;
}

const TOKEN_KEY = 'swim_admin_token';
const USER_KEY = 'swim_admin_user';

function loadUser(): AdminUser {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return { id: 0, username: '' };
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { id: 0, username: '' };
  } catch {
    // 脏数据降级，避免整个 app 崩溃
    localStorage.removeItem(USER_KEY);
    return { id: 0, username: '' };
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const userInfo = ref<AdminUser>(loadUser());

  function setAuth(t: string, user: AdminUser) {
    token.value = t;
    userInfo.value = user;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    token.value = '';
    userInfo.value = { id: 0, username: '' };
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function hasPermission(code: string): boolean {
    if (!userInfo.value.permissions) return false;
    if (userInfo.value.permissions.includes('*')) return true;
    return userInfo.value.permissions.includes(code);
  }

  /** 当前用户角色码列表 */
  function roleCodes(): string[] {
    const roleCodes = userInfo.value.roles?.map((role) =>
      typeof role === 'string' ? role : role.code,
    );
    return [...new Set([...(roleCodes ?? []), ...(userInfo.value.roleCodes ?? [])])];
  }

  /** 是否为协会会长（受数据隔离限制，仅能管理所属协会） */
  function isSubAdmin(): boolean {
    return roleCodes().includes('swimming_sub_admin');
  }

  return {
    token,
    userInfo,
    setAuth,
    logout,
    hasPermission,
    roleCodes,
    isSubAdmin,
  };
});
