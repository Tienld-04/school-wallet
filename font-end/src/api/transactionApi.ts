import axiosClient from './axiosClient';
import type { RecentTransactionResponse, TransferRequest, TransferResponse } from '../types';

const transactionApi = {
  getRecent: (): Promise<RecentTransactionResponse[]> =>
    axiosClient.get<RecentTransactionResponse[]>('/transactions/recent'),

  transfer: (request: TransferRequest): Promise<TransferResponse> =>
    axiosClient.post<TransferResponse>('/transactions/transfer', request),
};

export default transactionApi;
