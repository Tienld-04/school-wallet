import axiosClient from './axiosClient';
import type { MerchantType, MerchantListResponse, MerchantResponse } from '../types';

const merchantApi = {
  getTypes: (): Promise<MerchantType[]> =>
    axiosClient.get<MerchantType[]>('/merchants/types'),

  getList: (type?: string): Promise<MerchantListResponse[]> =>
    axiosClient.get<MerchantListResponse[]>('/merchants/list', {
      params: type ? { type } : undefined,
    }),

  // Danh sách merchant của user đang đăng nhập (dùng để map merchantId → name trong revenue dashboard).
  getMyMerchants: (): Promise<MerchantResponse[]> =>
    axiosClient.get<MerchantResponse[]>('/merchants/my-user'),
};

export default merchantApi;
