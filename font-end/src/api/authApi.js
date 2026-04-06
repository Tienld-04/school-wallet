import axiosClient from './axiosClient';

const authApi = {
  login(data) {
    return axiosClient.post('/auth/login', data);
  },

  register(data) {
    return axiosClient.post('/auth/register', data);
  },

  logout(token) {
    return axiosClient.post('/auth/logout', { token });
  },

  forgotPassword(email) {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  changePassword(data) {
    return axiosClient.put('/auth/change-password', data);
  },
};

export default authApi;
