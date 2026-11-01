import type { IconName } from '../components/common/Icon';
import { colors } from './theme';

export interface MerchantTypeStyle {
  icon: IconName;
  bg: string;
  text: string;
}

const MERCHANT_TYPE_STYLES: Record<string, MerchantTypeStyle> = {
  CANTEEN: { icon: 'cafe-outline', bg: colors.orange[50], text: colors.orange[600] },
  PARKING: { icon: 'car-outline', bg: colors.blue[50], text: colors.blue[600] },
  PRINTING: { icon: 'print-outline', bg: colors.violet[50], text: colors.violet[600] },
  LIBRARY: { icon: 'library-outline', bg: colors.emerald[50], text: colors.emerald[600] },
  BOOKSTORE: { icon: 'book-outline', bg: colors.pink[50], text: colors.pink[600] },
  CLUB: { icon: 'people-outline', bg: colors.cyan[50], text: colors.cyan[600] },
  EVENT: { icon: 'calendar-outline', bg: colors.amber[50], text: colors.amber[600] },
  OTHER: { icon: 'grid-outline', bg: colors.slate[50], text: colors.slate[600] },
};

export const MERCHANT_TYPE_LABELS: Record<string, string> = {
  CANTEEN: 'Căng tin',
  PARKING: 'Bãi gửi xe',
  PRINTING: 'Dịch vụ in ấn',
  LIBRARY: 'Thư viện',
  BOOKSTORE: 'Nhà sách',
  CLUB: 'Câu lạc bộ',
  EVENT: 'Sự kiện',
  OTHER: 'Khác',
};

export const merchantTypeStyle = (type: string): MerchantTypeStyle =>
  MERCHANT_TYPE_STYLES[type] || MERCHANT_TYPE_STYLES.OTHER;
