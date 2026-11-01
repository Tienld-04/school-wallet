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

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}

export interface UserResponse {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  kycStatus: string;
  createdAt: string;
  hasMerchants: boolean;
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

export interface MerchantResponse {
  merchantId: string;
  name: string;
  type: string;
  active: boolean;
  userId: string;
  userPhone: string;
  userName?: string;
  createdAt: string;
}

export interface RecipientResponse {
  fullName: string;
  phone: string;
}

export interface QrTransferResponse {
  qrContent: string;
}

export interface DynamicQrRequest {
  amount: number;
  description?: string;
}

export interface QrVerifyResponse {
  phone: string;
  name: string;
  amount?: number;
  description?: string;
}

export interface TransferRequest {
  requestId: string;
  toPhoneNumber: string;
  amount: number;
  description: string;
  pin: string;
}

export interface MerchantPaymentRequest {
  requestId: string;
  merchantId: string;
  merchantName: string;
  merchantPhone: string;
  amount: number;
  description?: string;
  pin: string;
}

/** TransactionHistoryResponse */
export interface TransactionHistoryItem {
  transactionId: string;
  fromFullName?: string;
  fromPhone?: string;
  toFullName?: string;
  toPhone?: string;
  amount: number;
  fee: number;
  displayAmount: number; // dương = nhận, âm = gửi
  description?: string;
  transactionType: string;
  status: string;
  merchantId?: string;
  createdAt: string;
}

/** PageResponse<T> ở transaction-service . */
export interface TransactionHistoryPage {
  content: TransactionHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Trùng schema với LedgerEntryResponse ở wallet-service. */
export interface LedgerEntry {
  entryId: string;
  transactionId?: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  signedAmount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  reasonLabel: string;
  note?: string;
  createdAt: string;
}

/** PageResponse<LedgerEntryResponse> ở wallet-service. */
export interface LedgerPage {
  content: LedgerEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type StatsGranularity = 'day' | 'week' | 'month';

export interface PageResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export interface RevenueOverview {
  totalRevenue: number;
  transactionCount: number;
  averageRevenuePerTx: number;
  topMerchantId: string | null;
  topMerchantRevenue: number;
}

export interface RevenueTimeSeriesPoint {
  period: string;
  count: number;
  revenue: number;
}

export interface MerchantRevenue {
  merchantId: string;
  transactionCount: number;
  totalRevenue: number;
}

/** KPI doanh thu cho user là chủ merchant (filter to_user_id = current user). */
export interface MerchantEarningsOverview {
  grossRevenue: number;
  netRevenue: number;
  totalFee: number;
  transactionCount: number;
  averageNetPerTx: number;
  topMerchantId: string | null;
  topMerchantNetRevenue: number;
}

/** Điểm biểu đồ doanh thu merchant theo period. */
export interface MerchantEarningsTimeSeriesPoint {
  period: string;
  count: number;
  grossRevenue: number;
  netRevenue: number;
}

/** Breakdown doanh thu theo từng merchant của user. */
export interface MerchantBreakdown {
  merchantId: string;
  transactionCount: number;
  grossRevenue: number;
  netRevenue: number;
}

/** Trùng schema với TransactionStatusHistoryResponse ở transaction-service. */
export interface TransactionStatusHistoryItem {
  historyId: string;
  transactionId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedAt: string;
}

/** Trùng schema với TransactionDetailResponse ở transaction-service. */
export interface TransactionDetail {
  transactionId: string;
  fromFullName?: string;
  fromPhone?: string;
  toFullName?: string;
  toPhone?: string;
  amount: number;
  fee: number;
  displayAmount?: number;
  description?: string;
  transactionType: string;
  status: string;
  merchantId?: string;
  createdAt: string;
  statusHistory: TransactionStatusHistoryItem[];
}

export interface TransferResponse {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  status: string;
  transactionType: string;
}

export interface KycRequest {
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  placeOfOrigin: string;
  permanentAddress: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  // Base64 string (bao gồm prefix "data:image/...;base64,")
  idFrontImage: string;
  idBackImage: string;
}

export interface KycResponse {
  kycId: string;
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  placeOfOrigin?: string;
  permanentAddress?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  idFrontImage?: string;
  idBackImage?: string;
  status: string;
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface InitiateTopupRequest {
  requestId: string;
  amount: number;
  bankCode?: string;
  language?: string;
}

export interface InitiateTopupResponse {
  paymentUrl: string;
  requestId: string;
}

export interface TopupStatusResponse {
  requestId: string;
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  description?: string;
  message: string;
  createdAt: string;
}

export interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  user: UserResponse | null;
  refreshUser: () => Promise<void>;
  login: (phone: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}
