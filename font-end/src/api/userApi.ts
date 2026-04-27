import axiosClient from './axiosClient';
import type {
  UserResponse,
  RecipientResponse,
  KycRequest,
  KycResponse,
  QrTransferResponse,
  DynamicQrRequest,
  QrVerifyResponse,
} from '../types';

const userApi = {
  getInfo: (): Promise<UserResponse> =>
    axiosClient.get<UserResponse>('/users/info'),

  getRecipientByPhone: (phone: string): Promise<RecipientResponse> =>
    axiosClient.get<RecipientResponse>(`/users/by-phone/${phone}`),

  submitKyc: (data: KycRequest): Promise<KycResponse> =>
    axiosClient.post<KycResponse>('/users/kyc', data),

  getMyKyc: (): Promise<KycResponse> =>
    axiosClient.get<KycResponse>('/users/kyc'),

  getMyQr: (): Promise<QrTransferResponse> =>
    axiosClient.get<QrTransferResponse>('/users/my-qr'),

  getDynamicQr: (data: DynamicQrRequest): Promise<QrTransferResponse> =>
    axiosClient.post<QrTransferResponse>('/users/qr/dynamic', data),

  verifyQr: (qrContent: string): Promise<QrVerifyResponse> =>
    axiosClient.post<QrVerifyResponse>('/users/qr/verify', { qrContent }),
};

export default userApi;
