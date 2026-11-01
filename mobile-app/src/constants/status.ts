import { colors } from './theme';

export interface StatusStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

export const TRANSACTION_STATUS: Record<string, StatusStyle> = {
  SUCCESS: { label: 'Thành công', bg: colors.secondary[50], text: colors.secondary[700], dot: colors.secondary[500] },
  PENDING: { label: 'Đang xử lý', bg: colors.amber[50], text: colors.amber[700], dot: colors.amber[500] },
  FAILED: { label: 'Thất bại', bg: colors.red[50], text: colors.red[700], dot: colors.red[500] },
  CANCELLED: { label: 'Đã hủy', bg: colors.slate[100], text: colors.slate[600], dot: colors.slate[400] },
};

export const KYC_STATUS: Record<string, StatusStyle> = {
  UNVERIFIED: { label: 'Chưa xác minh', bg: colors.slate[100], text: colors.slate[500], dot: colors.slate[400] },
  PENDING: { label: 'Chờ duyệt', bg: colors.amber[50], text: colors.amber[600], dot: colors.amber[500] },
  VERIFIED: { label: 'Đã xác minh', bg: colors.emerald[50], text: colors.emerald[600], dot: colors.emerald[500] },
  REJECTED: { label: 'Bị từ chối', bg: colors.red[50], text: colors.red[500], dot: colors.red[500] },
};
