import axiosClient from './axiosClient';
import type { OtpVerifyResponse } from '../types';

const otpApi = {
  send: (phone: string): Promise<void> =>
    axiosClient.post<void>('/otp/send', { phone }),

  verify: (phone: string, otp: string): Promise<OtpVerifyResponse> =>
    axiosClient.post<OtpVerifyResponse>('/otp/verify', { phone, otp }),
};

export default otpApi;
