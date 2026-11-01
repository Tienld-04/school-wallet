import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

export const copyTransactionId = async (transactionId: string): Promise<void> => {
  await Clipboard.setStringAsync(transactionId);
  Toast.show({ type: 'success', text1: 'Đã sao chép mã giao dịch' });
};
