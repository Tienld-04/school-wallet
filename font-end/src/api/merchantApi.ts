import axiosClient from './axiosClient';
import type { MerchantType, MerchantListResponse } from '../types';

const merchantApi = {
  getTypes: (): Promise<MerchantType[]> =>
    axiosClient.get<MerchantType[]>('/merchants/types'),

  getList: (type?: string): Promise<MerchantListResponse[]> =>
    axiosClient.get<MerchantListResponse[]>('/merchants/list', {
      params: type ? { type } : undefined,
    }),
};

export default merchantApi;
