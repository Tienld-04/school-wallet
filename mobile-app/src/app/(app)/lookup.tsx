import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import transactionApi from '@/api/transactionApi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ScreenScroll from '@/components/layout/ScreenScroll';
import TransactionDetailView from '@/components/transaction/TransactionDetailView';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errorMessage';
import type { TransactionDetail } from '@/types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function TransactionLookupScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionDetail | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const id = input.trim();
    if (!UUID_REGEX.test(id)) {
      Toast.show({ type: 'error', text1: 'Mã giao dịch không hợp lệ (UUID)' });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await transactionApi.getTransactionDetail(id);
      setResult(data);
    } catch (err: unknown) {
      setResult(null);
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không tìm thấy giao dịch') });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setSearched(false);
  };

  return (
    <ScreenScroll>
      <Card style={styles.searchCard}>
        <Text style={styles.hint}>Nhập mã giao dịch (UUID) để xem chi tiết và lịch sử trạng thái</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="VD: 94ffa169-1c9e-45b9-b4eb-561245ee177e"
          placeholderTextColor={colors.slate[400]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        <View style={styles.buttons}>
          <Button
            title="Tra cứu"
            loading={loading}
            disabled={!input.trim()}
            onPress={handleSearch}
            style={styles.flex}
          />
          {(!!input || !!result) && (
            <Button title="Xóa" variant="secondary" onPress={handleClear} />
          )}
        </View>
      </Card>

      {loading && <Loading />}

      {!loading && !result && searched && (
        <Card>
          <EmptyState
            icon="search"
            title="Không tìm thấy giao dịch"
            subtitle="Kiểm tra lại mã giao dịch và thử tra cứu lại"
          />
        </Card>
      )}

      {!loading && !result && !searched && (
        <Card>
          <EmptyState
            icon="document-text-outline"
            title="Sẵn sàng tra cứu"
            subtitle="Nhập mã giao dịch ở ô tìm kiếm phía trên"
          />
        </Card>
      )}

      {!loading && result && <TransactionDetailView data={result} />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchCard: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: colors.slate[500],
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.slate[800],
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
});
