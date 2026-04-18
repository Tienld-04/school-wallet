import axiosClient from './axiosClient';
import type { BalanceResponse } from '../types';

const walletApi = {
  getMyBalance: (): Promise<BalanceResponse> =>
    axiosClient.get<BalanceResponse>('/wallets/my-balance'),
};

export default walletApi;
