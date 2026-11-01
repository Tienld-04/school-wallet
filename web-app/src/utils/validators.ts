export const validatePhone = (phone: string): string => {
  if (!phone) return 'Vui lòng nhập số điện thoại';
  if (!/^\d{10}$/.test(phone)) return 'Số điện thoại phải gồm 10 chữ số';
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email) return 'Vui lòng nhập email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) return 'Vui lòng nhập mật khẩu';
  if (password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
  return '';
};

export const validateFullName = (name: string): string => {
  if (!name || !name.trim()) return 'Vui lòng nhập họ tên';
  return '';
};

export const validatePin = (pin: string): string => {
  if (!pin) return 'Vui lòng nhập mã PIN giao dịch';
  if (!/^\d{6}$/.test(pin)) return 'Mã PIN phải gồm 6 chữ số';
  return '';
};

export const validateOtp = (otp: string): string => {
  if (!otp) return 'Vui lòng nhập mã OTP';
  if (!/^\d{6}$/.test(otp)) return 'Mã OTP phải gồm 6 chữ số';
  return '';
};
