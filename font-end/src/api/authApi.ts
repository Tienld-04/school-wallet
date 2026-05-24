import axiosClient from './axiosClient';
import type { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest, ChangePinRequest } from '../types';

const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    axiosClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest): Promise<void> =>
    axiosClient.post<void>('/auth/register', data),

  logout: (token: string): Promise<void> =>
    axiosClient.post<void>('/auth/logout', { token }),

  forgotPassword: (email: string): Promise<void> =>
    axiosClient.post<void>('/auth/forgot-password', { email }),

  changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>('/auth/change-password', data),

  changePin: (data: ChangePinRequest): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>('/auth/change-pin', data),

  checkPhone: (phone: string): Promise<{ exists: boolean }> =>
    axiosClient.get<{ exists: boolean }>(`/auth/check-phone?phone=${phone}`),
};

export default authApi;
