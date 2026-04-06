import axiosClient from './axiosClient';

const otpApi = {
  send(phone) {
    return axiosClient.post('/otp/send', { phone });
  },

  verify(phone, otp) {
    return axiosClient.post('/otp/verify', { phone, otp });
  },
};

export default otpApi;
