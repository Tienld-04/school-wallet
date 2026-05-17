import axiosClient from './axiosClient';
import type { BalanceResponse, LedgerPage } from '../types';

const walletApi = {
  getMyBalance: (): Promise<BalanceResponse> =>
    axiosClient.get<BalanceResponse>('/wallets/my-balance'),

  getMyLedger: (page = 0, size = 20): Promise<LedgerPage> =>
    axiosClient.get<LedgerPage>(`/wallets/my-ledger?page=${page}&size=${size}`),
};

export default walletApi;
