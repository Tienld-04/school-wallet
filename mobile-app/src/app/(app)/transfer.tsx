import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import userApi from '@/api/userApi';
import transactionApi from '@/api/transactionApi';
import walletApi from '@/api/walletApi';
import AmountInput from '@/components/common/AmountInput';
import BottomSheet, { SHEET_CLOSE_DELAY_MS } from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Icon from '@/components/common/Icon';
import type { IconName } from '@/components/common/Icon';
import Input from '@/components/common/Input';
import KycGuard from '@/components/common/KycGuard';
import ScreenScroll from '@/components/layout/ScreenScroll';
import PinConfirm from '@/components/transaction/PinConfirm';
import type { SummaryRow } from '@/components/transaction/PinConfirm';
import { colors } from '@/constants/theme';
import { formatDigits } from '@/utils/format';
import { getErrorMessage } from '@/utils/errorMessage';
import { consumePendingQr } from '@/utils/qrResult';
import type { QrVerifyResponse, RecipientResponse } from '@/types';

type Step = 'method' | 'phone' | 'details';

const QR_DISMISS_DELAY_MS = 500;

const BackLink: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable onPress={onPress} hitSlop={8} style={styles.backLink}>
    <Icon name="chevron-back" size={16} color={colors.slate[500]} />
    <Text style={styles.backText}>Quay lại</Text>
  </Pressable>
);

const MethodOption: React.FC<{ icon: IconName; title: string; subtitle: string; onPress: () => void }> = ({
  icon, title, subtitle, onPress,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.method, pressed && styles.pressed]}>
    <View style={styles.methodIcon}>
      <Icon name={icon} size={26} color={colors.primary[700]} />
    </View>
    <Text style={styles.methodTitle}>{title}</Text>
    <Text style={styles.methodSubtitle}>{subtitle}</Text>
  </Pressable>
);

export default function TransferScreen() {
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState<RecipientResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(() => {
    walletApi.getMyBalance()
      .then((data) => setBalance(data.balance))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const reset = () => {
    setStep('method');
    setPhone('');
    setRecipient(null);
    setAmount('');
    setDescription('');
    setPin('');
    setPinVisible(false);
  };

  const handleQrVerified = useCallback((data: QrVerifyResponse) => {
    setPhone(data.phone);
    setRecipient({ fullName: data.name, phone: data.phone });
    setPin('');
    setStep('details');
    if (data.amount != null) {
      setAmount(String(data.amount));
      setDescription(data.description ?? '');
      const insufficient = balance != null && data.amount > balance;
      setTimeout(() => {
        if (insufficient) Toast.show({ type: 'error', text1: 'Số dư không đủ' });
        else setPinVisible(true);
      }, QR_DISMISS_DELAY_MS);
    } else {
      setAmount('');
      setDescription('');
    }
  }, [balance]);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingQr();
      if (pending) handleQrVerified(pending);
    }, [handleQrVerified]),
  );

  const handleSearchRecipient = async () => {
    if (!/^\d{10}$/.test(phone)) {
      Toast.show({ type: 'error', text1: 'Số điện thoại phải có đúng 10 chữ số' });
      return;
    }
    setSearching(true);
    try {
      const data = await userApi.getRecipientByPhone(phone);
      setRecipient(data);
      setStep('details');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không tìm thấy tài khoản') });
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1000) {
      Toast.show({ type: 'error', text1: 'Số tiền tối thiểu là 1.000đ' });
      return;
    }
    if (balance != null && amt > balance) {
      Toast.show({ type: 'error', text1: 'Số dư không đủ' });
      return;
    }
    setPin('');
    setPinVisible(true);
  };

  const closePin = () => {
    if (submitting) return;
    setPinVisible(false);
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length < 6) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập đủ 6 số OTP' });
      return;
    }
    setSubmitting(true);
    try {
      await transactionApi.transfer({
        requestId: Crypto.randomUUID(),
        toPhoneNumber: phone,
        amount: parseInt(amount, 10),
        description: description.trim() || 'Chuyển tiền',
        pin,
      });
      reset();
      fetchBalance();
      setTimeout(() => Toast.show({ type: 'success', text1: 'Chuyển tiền thành công!' }), SHEET_CLOSE_DELAY_MS);
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Chuyển tiền thất bại') });
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRows: SummaryRow[] = [
    { label: 'Người nhận', value: recipient?.fullName ?? '' },
    { label: 'Số tiền', value: `${formatDigits(amount)} VND`, highlight: true },
    ...(description ? [{ label: 'Nội dung', value: description }] : []),
  ];

  const amountValid = !!amount && parseInt(amount, 10) >= 1000;

  return (
    <ScreenScroll>
      <KycGuard>
        {step === 'method' && (
          <Card style={styles.gap}>
            <Text style={styles.sectionLabel}>Chọn phương thức chuyển tiền</Text>
            <View style={styles.methods}>
              <MethodOption
                icon="qr-code-outline"
                title="Quét mã QR"
                subtitle="Quét hoặc tải ảnh QR"
                onPress={() => router.push({ pathname: '/qr', params: { source: 'transfer' } })}
              />
              <MethodOption
                icon="phone-portrait-outline"
                title="Nhập số tài khoản"
                subtitle="Nhập số điện thoại"
                onPress={() => setStep('phone')}
              />
            </View>
          </Card>
        )}

        {step === 'phone' && (
          <Card style={styles.gap}>
            <BackLink onPress={() => setStep('method')} />
            <View>
              <Text style={styles.title}>Nhập số điện thoại người nhận</Text>
              <Text style={styles.subtitle}>Số điện thoại là số tài khoản trong hệ thống</Text>
            </View>
            <Input
              label="Số điện thoại"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, ''))}
              placeholder="Nhập số điện thoại (10 số)"
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearchRecipient}
            />
            <Button
              title="Tìm tài khoản"
              loading={searching}
              disabled={phone.length !== 10}
              onPress={handleSearchRecipient}
            />
          </Card>
        )}

        {step === 'details' && recipient && (
          <Card style={styles.gap}>
            <BackLink onPress={() => { setStep('phone'); setRecipient(null); }} />

            <View style={styles.recipient}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>{recipient.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.recipientName}>{recipient.fullName}</Text>
                <Text style={styles.recipientPhone}>{recipient.phone}</Text>
              </View>
            </View>

            <AmountInput
              label="Số tiền chuyển"
              value={amount}
              onChange={setAmount}
              hint={amountValid ? `= ${formatDigits(amount)} đồng` : undefined}
            />
            <Input
              label="Nội dung chuyển tiền"
              value={description}
              onChangeText={setDescription}
              placeholder="Chuyển tiền (không bắt buộc)"
              maxLength={255}
            />
            <Button title="Tiếp tục" disabled={!amountValid} onPress={handleConfirm} />
          </Card>
        )}

        <BottomSheet visible={pinVisible} onClose={closePin}>
          <PinConfirm
            title="Xác nhận giao dịch"
            rows={summaryRows}
            pin={pin}
            onChangePin={setPin}
            submitting={submitting}
            cancelLabel="Hủy"
            onCancel={closePin}
            onSubmit={handleSubmit}
          />
        </BottomSheet>
      </KycGuard>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    gap: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[600],
  },
  methods: {
    flexDirection: 'row',
    gap: 12,
  },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    textAlign: 'center',
  },
  methodSubtitle: {
    fontSize: 12,
    color: colors.primary[500],
    textAlign: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: colors.slate[500],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[800],
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[400],
    marginTop: 2,
  },
  recipient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.slate[50],
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[700],
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[800],
  },
  recipientPhone: {
    fontSize: 14,
    color: colors.slate[500],
    marginTop: 2,
  },
});
