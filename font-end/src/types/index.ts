export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  transactionPin: string;
  verificationToken: string;
}

export interface OtpVerifyResponse {
  verificationToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponse {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  message: string;
}

export interface MerchantType {
  code: string;
  description: string;
}

export interface MerchantListResponse {
  merchantId: string;
  name: string;
  type: string;
  userId: string;
  userPhone: string;
}

export interface RecentTransactionResponse {
  transactionId: string;
  description: string;
  amount: string;
  createdAt: string;
}

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}
