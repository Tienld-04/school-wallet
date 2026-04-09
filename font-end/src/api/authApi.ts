import axiosClient from './axiosClient';
import type { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest } from '../types';

const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    axiosClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest): Promise<void> =>
    axiosClient.post<void>('/auth/register', data),

  logout: (token: string): Promise<void> =>
    axiosClient.post<void>('/auth/logout', { token }),

  forgotPassword: (email: string): Promise<void> =>
    axiosClient.post<void>('/auth/forgot-password', { email }),

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    axiosClient.put<void>('/auth/change-password', data),
};

export default authApi;
