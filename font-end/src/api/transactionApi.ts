import axiosClient from './axiosClient';
import type {
  MerchantPaymentRequest,
  RecentTransactionResponse,
  TransferRequest,
  TransferResponse,
} from '../types';

const transactionApi = {
  getRecent: (): Promise<RecentTransactionResponse[]> =>
    axiosClient.get<RecentTransactionResponse[]>('/transactions/recent'),

  transfer: (request: TransferRequest): Promise<TransferResponse> =>
    axiosClient.post<TransferResponse>('/transactions/transfer', request),

  merchantPayment: (request: MerchantPaymentRequest): Promise<TransferResponse> =>
    axiosClient.post<TransferResponse>('/transactions/merchant/payment', request),
};

export default transactionApi;
