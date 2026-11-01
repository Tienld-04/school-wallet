import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getToken } from '../utils/storage';

// Override return types to match response interceptor (which unwraps response.data)
declare module 'axios' {
  interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  }
}

const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 15000,
});

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/check-phone', '/otp/'];

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !PUBLIC_PATHS.some((path) => url.startsWith(path))) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
