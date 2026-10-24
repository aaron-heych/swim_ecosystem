import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import router from '@/router';

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：注入 token
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一处理 code 和 401
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 后端统一格式：{ code, message, data }
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0 || res.code === 200) {
        return res.data;
      }
      // 401 未登录
      if (res.code === 401) {
        if (!isLoginRequest(response.config.url)) {
          handleUnauthorized();
        } else {
          ElMessage.error(res.message || '用户名或密码错误');
        }
        return Promise.reject(new Error(res.message || '未登录'));
      }
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 && !isLoginRequest(error.config?.url)) {
      handleUnauthorized();
    } else if (status === 403) {
      const responseMessage = (error.response?.data as any)?.message;
      ElMessage.error(
        (Array.isArray(responseMessage) ? responseMessage[0] : responseMessage) ||
          '没有权限执行此操作',
      );
    } else if (status === 404) {
      ElMessage.error('接口不存在');
    } else {
      let msg =
        (error.response?.data as any)?.message || error.message || '网络错误';
      const responseData = error.response?.data;
      if (typeof Blob !== 'undefined' && responseData instanceof Blob) {
        try {
          const payload = JSON.parse(await responseData.text());
          msg = (Array.isArray(payload.message) ? payload.message[0] : payload.message)
            || msg;
        } catch {
          // Non-JSON blob responses retain the Axios error message.
        }
      }
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  },
);

function handleUnauthorized() {
  const userStore = useUserStore();
  userStore.logout();
  ElMessage.warning('登录已过期，请重新登录');
  router.replace(`/login?redirect=${router.currentRoute.value.fullPath}`);
}

function isLoginRequest(url?: string): boolean {
  return url?.split('?')[0].replace(/\/+$/, '').endsWith('/admin/user/login') ?? false;
}

// 封装便捷方法
export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig) {
  return service.get<any, T>(url, { ...config, params });
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return service.post<any, T>(url, data, config);
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return service.put<any, T>(url, data, config);
}

export function del<T = any>(url: string, config?: AxiosRequestConfig) {
  return service.delete<any, T>(url, config);
}

export default service;
