import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import merchantApi from '@/api/merchantApi';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import Icon from '@/components/common/Icon';
import Loading from '@/components/common/Loading';
import ScreenScroll from '@/components/layout/ScreenScroll';
import { MERCHANT_TYPE_LABELS, merchantTypeStyle } from '@/constants/merchant';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import type { MerchantResponse } from '@/types';

export default function MyMerchantsScreen() {
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMerchants = useCallback(async () => {
    try {
      const data = await merchantApi.getMyMerchants();
      setMerchants(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách dịch vụ' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMerchants();
    setRefreshing(false);
  };

  if (loading) return <Loading />;

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      {merchants.length === 0 ? (
        <Card>
          <EmptyState
            icon="storefront-outline"
            title="Bạn chưa sở hữu dịch vụ nào"
            subtitle="Liên hệ quản trị viên để được cấp quyền"
          />
        </Card>
      ) : (
        <>
          {merchants.map((m) => {
            const s = merchantTypeStyle(m.type);
            return (
              <Card key={m.merchantId} style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={[styles.icon, { backgroundColor: s.bg }]}>
                    <Icon name={s.icon} size={22} color={s.text} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{m.name}</Text>
                    <View style={[styles.tag, { backgroundColor: s.bg }]}>
                      <Text style={[styles.tagText, { color: s.text }]}>{MERCHANT_TYPE_LABELS[m.type] ?? m.type}</Text>
                    </View>
                  </View>
                  <View style={[styles.status, m.active ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, m.active ? styles.statusTextActive : styles.statusTextInactive]}>
                      {m.active ? 'Hoạt động' : 'Ngừng'}
                    </Text>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Ngày tạo</Text>
                  <Text style={styles.footerText}>{formatDate(m.createdAt)}</Text>
                </View>
              </Card>
            );
          })}
          <Text style={styles.count}>{merchants.length} dịch vụ đang sở hữu</Text>
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: colors.emerald[50],
  },
  statusInactive: {
    backgroundColor: colors.red[50],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: colors.emerald[700],
  },
  statusTextInactive: {
    color: colors.red[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  footerText: {
    fontSize: 12,
    color: colors.slate[400],
  },
  count: {
    fontSize: 12,
    color: colors.slate[400],
    textAlign: 'center',
  },
});
