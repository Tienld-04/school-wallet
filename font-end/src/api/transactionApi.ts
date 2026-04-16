import axiosClient from './axiosClient';
import type { RecentTransactionResponse } from '../types';

const transactionApi = {
  getRecent: (): Promise<RecentTransactionResponse[]> =>
    axiosClient.get<RecentTransactionResponse[]>('/transactions/recent'),
};

export default transactionApi;
