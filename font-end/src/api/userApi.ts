import axiosClient from './axiosClient';
import type { UserResponse } from '../types';

const userApi = {
  getInfo: (): Promise<UserResponse> =>
    axiosClient.get<UserResponse>('/users/info'),
};

export default userApi;
