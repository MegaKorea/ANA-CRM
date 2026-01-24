import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSupabaseClient } from '@/lib/supabase/client';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add auth token from Supabase if available
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - token expired
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

    // Handle other errors
    const errorMessage = getErrorMessage(error);

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    });
  }
);

// Helper function to extract error message
function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string; error?: string };
    return data.message || data.error || 'An error occurred';
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export default axiosInstance;

// Export typed request methods
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
