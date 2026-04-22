import axiosClient from './axiosClient';
import type { UserResponse, RecipientResponse } from '../types';

const userApi = {
  getInfo: (): Promise<UserResponse> =>
    axiosClient.get<UserResponse>('/users/info'),

  getRecipientByPhone: (phone: string): Promise<RecipientResponse> =>
    axiosClient.get<RecipientResponse>(`/users/by-phone/${phone}`),
};

export default userApi;
