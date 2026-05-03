import axiosClient from './axiosClient';
import type {
  InitiateTopupRequest,
  InitiateTopupResponse,
  MerchantPaymentRequest,
  RecentTransactionResponse,
  TopupStatusResponse,
  TransactionHistoryPage,
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

  getHistory: (page: number, size: number): Promise<TransactionHistoryPage> =>
    axiosClient.post<TransactionHistoryPage>('/transactions/history', { page, size }),

  initiateTopup: (request: InitiateTopupRequest): Promise<InitiateTopupResponse> =>
    axiosClient.post<InitiateTopupResponse>('/transactions/topup/initiate', request),

  getTopupStatus: (requestId: string): Promise<TopupStatusResponse> =>
    axiosClient.get<TopupStatusResponse>(`/transactions/topup/status?requestId=${requestId}`),
};

export default transactionApi;
