import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getOptionalEnv, EnvKey } from '@/config/env.config';
import { HttpClientTimeout } from '@/constants/enums';
import { ApiBasePath } from '@/constants/routes';
import { HttpClientErrorMessage } from '@/constants/enums';

const axiosInstance = axios.create({
  baseURL: getOptionalEnv(EnvKey.API_BASE_URL) ?? ApiBasePath.DEFAULT,
  timeout: HttpClientTimeout.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const supabase = getSupabaseClient();
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (!refreshError && session) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return axiosInstance(originalRequest);
        }
      }
    }

    const errorMessage = getErrorMessage(error);

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    });
  }
);

function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string; error?: string };
    return data.message || data.error || HttpClientErrorMessage.DEFAULT;
  }

  if (error.message) {
    return error.message;
  }

  return HttpClientErrorMessage.UNEXPECTED;
}

export default axiosInstance;

export const api = {
  get: <T>(url: string, config?: Parameters<typeof axiosInstance.get>[1]) =>
    axiosInstance.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: Parameters<typeof axiosInstance.post>[2]) =>
    axiosInstance.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: Parameters<typeof axiosInstance.put>[2]) =>
    axiosInstance.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: Parameters<typeof axiosInstance.patch>[2]) =>
    axiosInstance.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: Parameters<typeof axiosInstance.delete>[1]) =>
    axiosInstance.delete<T>(url, config).then((res) => res.data),
};
