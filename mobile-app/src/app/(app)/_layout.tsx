import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary[600],
        headerTitleStyle: { color: colors.slate[900] },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.slate[50] },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.slate[50] },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transfer" options={{ title: 'Chuyển khoản' }} />
      <Stack.Screen name="payment" options={{ title: 'Thanh toán dịch vụ' }} />
      <Stack.Screen name="qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="my-merchants" options={{ title: 'Dịch vụ của tôi' }} />
      <Stack.Screen name="merchant-revenue" options={{ title: 'Doanh thu' }} />
      <Stack.Screen name="platform-revenue" options={{ title: 'Doanh thu nền tảng' }} />
      <Stack.Screen name="transaction/[id]" options={{ title: 'Chi tiết giao dịch' }} />
      <Stack.Screen name="lookup" options={{ title: 'Tra cứu giao dịch' }} />
      <Stack.Screen name="kyc" options={{ title: 'Xác minh KYC' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="change-pin" options={{ title: 'Đổi mã OTP' }} />
    </Stack>
  );
}
