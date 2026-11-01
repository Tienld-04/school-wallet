import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import userApi from '../../api/userApi';
import AmountInput from '../common/AmountInput';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Input from '../common/Input';
import { colors } from '../../constants/theme';
import { formatVND } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

type Mode = 'static' | 'dynamic';

interface ParsedQr {
  type: 'SCHOOL_WALLET_STATIC' | 'SCHOOL_WALLET_DYNAMIC';
  phone: string;
  name: string;
  amount?: string;
  description?: string;
  expiredAt?: number;
}

const parseQr = (content: string): ParsedQr | null => {
  try {
    return JSON.parse(content) as ParsedQr;
  } catch {
    return null;
  }
};

const MyQrCard: React.FC = () => {
  const [mode, setMode] = useState<Mode>('static');

  const [staticContent, setStaticContent] = useState<string | null>(null);
  const [loadingStatic, setLoadingStatic] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dynamicContent, setDynamicContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (mode !== 'static' || staticContent || loadingStatic) return;
    setLoadingStatic(true);
    userApi
      .getMyQr()
      .then((data) => setStaticContent(data.qrContent))
      .catch((err: unknown) => {
        Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tạo mã QR') });
      })
      .finally(() => setLoadingStatic(false));
  }, [mode, staticContent, loadingStatic]);

  useEffect(() => {
    if (mode !== 'dynamic' || !dynamicContent) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode, dynamicContent]);

  const handleGenerateDynamic = async () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1000) {
      Toast.show({ type: 'error', text1: 'Số tiền tối thiểu là 1.000đ' });
      return;
    }
    setGenerating(true);
    try {
      const data = await userApi.getDynamicQr({
        amount: amt,
        description: description.trim() || undefined,
      });
      setDynamicContent(data.qrContent);
      setNow(Date.now());
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tạo mã QR động') });
    } finally {
      setGenerating(false);
    }
  };

  const handleResetDynamic = () => {
    setDynamicContent(null);
    setAmount('');
    setDescription('');
  };

  const parsedStatic = useMemo(() => (staticContent ? parseQr(staticContent) : null), [staticContent]);
  const parsedDynamic = useMemo(() => (dynamicContent ? parseQr(dynamicContent) : null), [dynamicContent]);

  const remainingMs = parsedDynamic?.expiredAt ? parsedDynamic.expiredAt - now : 0;
  const expired = parsedDynamic ? remainingMs <= 0 : false;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const countdownColor = expired ? colors.red[500] : remainingMs < 60000 ? colors.amber[600] : colors.slate[500];

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        {(['static', 'dynamic'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleItem, mode === m && styles.toggleItemActive]}>
            <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
              {m === 'static' ? 'QR cá nhân' : 'Yêu cầu số tiền'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'static' && (
        <View style={[styles.card, styles.center]}>
          {loadingStatic && !staticContent && (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          )}
          {!!staticContent && (
            <>
              <View style={styles.qrFrame}>
                <QRCode value={staticContent} size={224} ecl="M" />
              </View>
              <Text style={styles.name}>{parsedStatic?.name ?? '—'}</Text>
              <Text style={styles.phone}>{parsedStatic?.phone ?? ''}</Text>
              <Text style={styles.note}>Người gửi quét QR và tự nhập số tiền chuyển</Text>
            </>
          )}
        </View>
      )}

      {mode === 'dynamic' && !dynamicContent && (
        <View style={[styles.card, styles.form]}>
          <AmountInput label="Số tiền" value={amount} onChange={setAmount} />
          <Input
            label="Nội dung"
            value={description}
            onChangeText={setDescription}
            placeholder="Nội dung hiển thị cho người gửi"
            maxLength={255}
          />
          <Button
            title="Tạo mã QR"
            loading={generating}
            disabled={!amount || parseInt(amount, 10) < 1000}
            onPress={handleGenerateDynamic}
          />
          <Text style={styles.note}>Yêu cầu sẽ hết hạn sau 5 phút</Text>
        </View>
      )}

      {mode === 'dynamic' && !!dynamicContent && !!parsedDynamic && (
        <View style={[styles.card, styles.center]}>
          <View style={[styles.qrFrame, expired && styles.qrExpired]}>
            <QRCode value={dynamicContent} size={208} ecl="M" />
          </View>
          <Text style={styles.name}>{parsedDynamic.name}</Text>
          <Text style={styles.phone}>{parsedDynamic.phone}</Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountText}>
              {formatVND(Number(parsedDynamic.amount ?? 0))}
              <Text style={styles.amountCurrency}> VND</Text>
            </Text>
          </View>

          {!!parsedDynamic.description && (
            <Text style={styles.description} numberOfLines={1}>"{parsedDynamic.description}"</Text>
          )}

          <View style={styles.countdown}>
            <Icon name="time-outline" size={14} color={countdownColor} />
            <Text style={[styles.countdownText, { color: countdownColor }]}>
              {expired ? 'Đã hết hạn' : `Còn lại ${minutes}:${String(seconds).padStart(2, '0')}`}
            </Text>
          </View>

          <Button title="Tạo mã mới" variant="secondary" onPress={handleResetDynamic} style={styles.resetButton} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  toggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleItem: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: colors.white,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleTextActive: {
    color: colors.primary[700],
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
  },
  center: {
    alignItems: 'center',
  },
  form: {
    gap: 16,
  },
  qrPlaceholder: {
    width: 248,
    height: 248,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate[100],
    backgroundColor: colors.white,
  },
  qrExpired: {
    borderColor: colors.red[200],
    opacity: 0.5,
  },
  name: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[900],
  },
  phone: {
    fontSize: 14,
    color: colors.slate[500],
  },
  note: {
    marginTop: 4,
    fontSize: 12,
    color: colors.slate[400],
    textAlign: 'center',
  },
  amountBox: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
  },
  amountText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[700],
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.slate[500],
  },
  countdown: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});

export default MyQrCard;
