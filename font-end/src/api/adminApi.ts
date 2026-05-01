import axiosClient from './axiosClient';
import type { UsersResponse, PageResponse, MerchantResponse, MerchantRequest, KycAdminListResponse, TransactionDetail } from '../types';

const adminApi = {
  // Users
  getUsers: (page: number, size: number, status?: string, search?: string): Promise<PageResponse<UsersResponse>> =>
    axiosClient.get<PageResponse<UsersResponse>>('/admin/users', {
      params: { page, size, ...(status && { status }), ...(search && { search }) },
    }),

  toggleUserStatus: (userId: string): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>(`/admin/users/${userId}/toggle-status`),

  // KYC
  getKycList: (page: number, size: number, status?: string): Promise<PageResponse<KycAdminListResponse>> =>
    axiosClient.get<PageResponse<KycAdminListResponse>>('/admin/kyc', {
      params: { page, size, ...(status && { status }) },
    }),

  approveKyc: (kycId: string): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>(`/admin/kyc/${kycId}/approve`),

  rejectKyc: (kycId: string, rejectionReason: string): Promise<{ message: string }> =>
    axiosClient.put<{ message: string }>(`/admin/kyc/${kycId}/reject`, { rejectionReason }),

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

  // Tra cứu chi tiết giao dịch 
  getTransactionDetail: (transactionId: string): Promise<TransactionDetail> =>
    axiosClient.get<TransactionDetail>(`/transactions/detail/${transactionId}`),
};

export default adminApi;
