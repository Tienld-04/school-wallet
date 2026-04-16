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
  role: string;
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

export interface BalanceResponse {
  userId: string;
  walletId: string;
  balance: number;
}

export interface RecentTransactionResponse {
  transactionId: string;
  description: string;
  amount: string;
  createdAt: string;
}

export interface UsersResponse {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
}

export interface MerchantResponse {
  merchantId: string;
  name: string;
  type: string;
  active: boolean;
  userId: string;
  createdAt: string;
}

export interface MerchantRequest {
  name: string;
  type: string;
  userId: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  login: (phone: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}
