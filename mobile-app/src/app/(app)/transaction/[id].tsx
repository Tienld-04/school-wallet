import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import transactionApi from '@/api/transactionApi';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ScreenScroll from '@/components/layout/ScreenScroll';
import TransactionDetailView from '@/components/transaction/TransactionDetailView';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errorMessage';
import type { TransactionDetail } from '@/types';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const result = await transactionApi.getTransactionDetail(id);
      setData(result);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Không tìm thấy giao dịch'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDetail();
    setRefreshing(false);
  };

  if (loading) return <Loading />;

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      {data ? (
        <TransactionDetailView data={data} />
      ) : (
        <EmptyState icon="search" title={error || 'Không tìm thấy giao dịch'} />
      )}
    </ScreenScroll>
  );
}
