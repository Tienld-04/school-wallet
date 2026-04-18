import axiosClient from './axiosClient';
import type { UsersResponse, PageResponse, MerchantResponse, MerchantRequest } from '../types';

const adminApi = {
  // Users
  getUsers: (page: number, size: number, status?: string, search?: string): Promise<PageResponse<UsersResponse>> =>
    axiosClient.get<PageResponse<UsersResponse>>('/admin/users', {
      params: { page, size, ...(status && { status }), ...(search && { search }) },
    }),

  toggleUserStatus: (userId: string): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>(`/admin/users/${userId}/toggle-status`),

  // Merchants
  getMerchants: (page: number, size: number, type?: string, search?: string): Promise<PageResponse<MerchantResponse>> =>
    axiosClient.get<PageResponse<MerchantResponse>>('/merchants/list/my-admin', {
      params: { page, size, ...(type && { type }), ...(search && { search }) },
    }),

  createMerchant: (data: MerchantRequest): Promise<MerchantResponse> =>
    axiosClient.post<MerchantResponse>('/merchants/create', data),

  updateMerchant: (merchantId: string, data: MerchantRequest): Promise<MerchantResponse> =>
    axiosClient.put<MerchantResponse>(`/merchants/${merchantId}`, data),

  deleteMerchant: (merchantId: string): Promise<{ message: string }> =>
    axiosClient.delete<{ message: string }>(`/merchants/${merchantId}`),
};

export default adminApi;
