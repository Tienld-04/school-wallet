import axiosClient from './axiosClient';
import type { UserResponse, RecipientResponse, KycRequest, KycResponse } from '../types';

const userApi = {
  getInfo: (): Promise<UserResponse> =>
    axiosClient.get<UserResponse>('/users/info'),

  getRecipientByPhone: (phone: string): Promise<RecipientResponse> =>
    axiosClient.get<RecipientResponse>(`/users/by-phone/${phone}`),

  submitKyc: (data: KycRequest): Promise<KycResponse> =>
    axiosClient.post<KycResponse>('/users/kyc', data),

  getMyKyc: (): Promise<KycResponse> =>
    axiosClient.get<KycResponse>('/users/kyc'),
};

export default userApi;
