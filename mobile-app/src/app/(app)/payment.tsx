import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import merchantApi from '@/api/merchantApi';
import transactionApi from '@/api/transactionApi';
import walletApi from '@/api/walletApi';
import AmountInput from '@/components/common/AmountInput';
import BottomSheet, { SHEET_CLOSE_DELAY_MS } from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import KycGuard from '@/components/common/KycGuard';
import Loading from '@/components/common/Loading';
import ScreenScroll from '@/components/layout/ScreenScroll';
import PinConfirm from '@/components/transaction/PinConfirm';
import type { SummaryRow } from '@/components/transaction/PinConfirm';
import { merchantTypeStyle as typeStyle } from '@/constants/merchant';
import { colors } from '@/constants/theme';
import { formatDigits } from '@/utils/format';
import { getErrorMessage } from '@/utils/errorMessage';
import type { MerchantListResponse, MerchantType } from '@/types';

type PaymentStep = 'details' | 'pin';

interface ParkingBracket {
  fee: number;
  label: string;
}

const computeParkingFee = (date: Date = new Date()): ParkingBracket => {
  const h = date.getHours();
  if (h >= 6 && h < 18) return { fee: 3000, label: 'Ban ngày (06:00 – 18:00)' };
  if (h >= 18 && h < 22) return { fee: 5000, label: 'Buổi tối (18:00 – 22:00)' };
  return { fee: 10000, label: 'Đêm khuya (22:00 – 06:00)' };
};

export default function PaymentScreen() {
  const [types, setTypes] = useState<MerchantType[]>([]);
  const [merchants, setMerchants] = useState<MerchantListResponse[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeMerchant, setActiveMerchant] = useState<MerchantListResponse | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('details');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [parkingBracket, setParkingBracket] = useState<ParkingBracket | null>(null);

  const fetchMerchants = useCallback(async (type?: string) => {
    try {
      const data = await merchantApi.getList(type || undefined);
      setMerchants(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách dịch vụ' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(() => {
    walletApi.getMyBalance()
      .then((data) => setBalance(data.balance))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const typesData = await merchantApi.getTypes();
        setTypes(typesData);
      } catch {
        Toast.show({ type: 'error', text1: 'Không thể tải danh mục dịch vụ' });
      }
      fetchMerchants();
    };
    init();
    fetchBalance();
  }, [fetchMerchants, fetchBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    fetchBalance();
    await fetchMerchants(selectedType);
    setRefreshing(false);
  };

  const handleFilterType = (code: string) => {
    const newType = selectedType === code ? '' : code;
    setSelectedType(newType);
    setLoading(true);
    fetchMerchants(newType);
  };

  const closeModal = () => {
    if (submitting) return;
    setActiveMerchant(null);
    setPaymentStep('details');
    setAmount('');
    setDescription('');
    setPin('');
    setParkingBracket(null);
  };

  const handleMerchantPress = (m: MerchantListResponse) => {
    setActiveMerchant(m);
    setPaymentStep('details');
    setPin('');
    if (m.type === 'PARKING') {
      const bracket = computeParkingFee();
      setParkingBracket(bracket);
      setAmount(String(bracket.fee));
      setDescription(`Phí gửi xe ${bracket.label}`);
    } else {
      setParkingBracket(null);
      setAmount('');
      setDescription('');
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
    setPaymentStep('pin');
  };

  const handleSubmit = async () => {
    if (!activeMerchant) return;
    if (pin.length < 6) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập đủ 6 số OTP' });
      return;
    }
    setSubmitting(true);
    try {
      await transactionApi.merchantPayment({
        requestId: Crypto.randomUUID(),
        merchantId: activeMerchant.merchantId,
        merchantName: activeMerchant.name,
        merchantPhone: activeMerchant.userPhone,
        amount: parseInt(amount, 10),
        description: description.trim() || undefined,
        pin,
      });
      setSubmitting(false);
      setActiveMerchant(null);
      setPaymentStep('details');
      setAmount('');
      setDescription('');
      setPin('');
      setParkingBracket(null);
      fetchBalance();
      setTimeout(() => Toast.show({ type: 'success', text1: 'Thanh toán thành công!' }), SHEET_CLOSE_DELAY_MS);
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Thanh toán thất bại') });
      setPin('');
      setSubmitting(false);
    }
  };

  const getTypeDesc = (code: string) => types.find((t) => t.code === code)?.description || code;

  const summaryRows: SummaryRow[] = [
    { label: 'Dịch vụ', value: activeMerchant?.name ?? '' },
    { label: 'Số tiền', value: `${formatDigits(amount)} VND`, highlight: true },
    ...(description ? [{ label: 'Nội dung', value: description }] : []),
  ];

  const amountValid = !!amount && parseInt(amount, 10) >= 1000;
  const activeStyle = activeMerchant ? typeStyle(activeMerchant.type) : null;

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      <KycGuard>
        <View style={styles.gapSmall}>
          <Text style={styles.sectionLabel}>Danh mục dịch vụ</Text>
          <View style={styles.chips}>
            <Pressable
              onPress={() => { setSelectedType(''); setLoading(true); fetchMerchants(); }}
              style={[styles.chip, selectedType === '' && styles.chipAllActive]}
            >
              <Text style={[styles.chipText, selectedType === '' && styles.chipTextAllActive]}>Tất cả</Text>
            </Pressable>
            {types.map((t) => {
              const s = typeStyle(t.code);
              const isActive = selectedType === t.code;
              return (
                <Pressable
                  key={t.code}
                  onPress={() => handleFilterType(t.code)}
                  style={[styles.chip, isActive && { backgroundColor: s.bg, borderColor: s.text }]}
                >
                  <Text style={[styles.chipText, isActive && { color: s.text }]}>{t.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {loading ? (
          <Loading />
        ) : merchants.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="search"
              title="Không tìm thấy dịch vụ nào"
              subtitle="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
            />
          </View>
        ) : (
          <View style={styles.gapSmall}>
            {merchants.map((m) => {
              const s = typeStyle(m.type);
              return (
                <Pressable
                  key={m.merchantId}
                  onPress={() => handleMerchantPress(m)}
                  style={({ pressed }) => [styles.merchant, pressed && styles.pressed]}
                >
                  <View style={[styles.merchantIcon, { backgroundColor: s.bg }]}>
                    <Icon name={s.icon} size={22} color={s.text} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.merchantName} numberOfLines={1}>{m.name}</Text>
                    <View style={[styles.typeTag, { backgroundColor: s.bg }]}>
                      <Text style={[styles.typeTagText, { color: s.text }]}>{getTypeDesc(m.type)}</Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.slate[300]} />
                </Pressable>
              );
            })}
            <Text style={styles.count}>
              Hiển thị {merchants.length} dịch vụ{selectedType ? ` trong "${getTypeDesc(selectedType)}"` : ''}
            </Text>
          </View>
        )}
      </KycGuard>

      <BottomSheet visible={!!activeMerchant} onClose={closeModal}>
        {activeMerchant && activeStyle && paymentStep === 'details' && (
          <View style={styles.sheetBody}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Thanh toán dịch vụ</Text>
              <Pressable onPress={closeModal} hitSlop={10}>
                <Icon name="close" size={22} color={colors.slate[500]} />
              </Pressable>
            </View>

            <View style={styles.merchantInfo}>
              <View style={[styles.merchantIcon, { backgroundColor: activeStyle.bg }]}>
                <Icon name={activeStyle.icon} size={22} color={activeStyle.text} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.merchantName} numberOfLines={1}>{activeMerchant.name}</Text>
                <Text style={styles.merchantType}>{getTypeDesc(activeMerchant.type)}</Text>
              </View>
            </View>

            {activeMerchant.type === 'PARKING' && parkingBracket ? (
              <View style={styles.gapTiny}>
                <Text style={styles.fieldLabel}>Phí gửi xe</Text>
                <View style={styles.parkingBox}>
                  <Text style={styles.parkingFee}>
                    {formatDigits(String(parkingBracket.fee))}
                    <Text style={styles.parkingCurrency}> VND</Text>
                  </Text>
                  <View style={styles.parkingLabelRow}>
                    <Icon name="time-outline" size={13} color={colors.primary[600]} />
                    <Text style={styles.parkingLabel}>{parkingBracket.label}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <AmountInput
                label="Số tiền thanh toán"
                value={amount}
                onChange={setAmount}
                hint="Số tiền tối thiểu là 1.000đ"
                autoFocus
              />
            )}

            <Input
              label="Nội dung"
              value={description}
              onChangeText={setDescription}
              placeholder="Ghi chú (không bắt buộc)"
              maxLength={255}
            />

            <View style={styles.buttons}>
              <Button title="Hủy" variant="secondary" onPress={closeModal} style={styles.flex} />
              <Button title="Tiếp tục" disabled={!amountValid} onPress={handleConfirm} style={styles.flex} />
            </View>
          </View>
        )}

        {activeMerchant && paymentStep === 'pin' && (
          <PinConfirm
            title="Xác nhận thanh toán"
            rows={summaryRows}
            pin={pin}
            onChangePin={setPin}
            submitting={submitting}
            cancelLabel="Quay lại"
            onCancel={() => { setPaymentStep('details'); setPin(''); }}
            onSubmit={handleSubmit}
          />
        )}
      </BottomSheet>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  gapSmall: {
    gap: 10,
  },
  gapTiny: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[700],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
  },
  chipAllActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[600],
  },
  chipTextAllActive: {
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  merchant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
    backgroundColor: colors.white,
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
  },
  merchantType: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  typeTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  count: {
    fontSize: 12,
    color: colors.slate[400],
    textAlign: 'center',
    marginTop: 4,
  },
  sheetBody: {
    padding: 20,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[900],
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.slate[50],
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[700],
  },
  parkingBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  parkingFee: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[700],
  },
  parkingCurrency: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[500],
  },
  parkingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  parkingLabel: {
    fontSize: 12,
    color: colors.primary[600],
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
});
