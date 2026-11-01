import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import userApi from '@/api/userApi';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import type { IconName } from '@/components/common/Icon';
import MyQrCard from '@/components/qr/MyQrCard';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errorMessage';
import { setPendingQr } from '@/utils/qrResult';
import type { QrVerifyResponse } from '@/types';

type Tab = 'scan' | 'my';

const RESCAN_DELAY_MS = 2000;

export default function QrScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('scan');
  const [processing, setProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const finish = (data: QrVerifyResponse) => {
    setPendingQr(data);
    if (source === 'transfer') router.back();
    else router.replace('/transfer');
  };

  const handleVerify = async (qrContent: string) => {
    setProcessing(true);
    try {
      const data = await userApi.verifyQr(qrContent);
      finish(data);
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Mã QR không hợp lệ') });
      setProcessing(false);
      setTimeout(() => {
        scannedRef.current = false;
      }, RESCAN_DELAY_MS);
    }
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    handleVerify(data);
  };

  const handlePickImage = async () => {
    if (processing) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets?.length) return;

    scannedRef.current = true;
    setProcessing(true);
    try {
      const codes = await scanFromURLAsync(result.assets[0].uri, ['qr']);
      if (!codes.length) throw new Error('not found');
      await handleVerify(codes[0].data);
    } catch {
      Toast.show({ type: 'error', text1: 'Không tìm thấy mã QR trong ảnh' });
      setProcessing(false);
      scannedRef.current = false;
    }
  };

  const renderScanner = () => {
    if (!permission) {
      return <ActivityIndicator color={colors.white} />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.permissionBox}>
          <Icon name="camera-reverse-outline" size={32} color={colors.white} />
          <Text style={styles.permissionText}>Vui lòng cấp quyền truy cập camera để quét mã QR</Text>
          {permission.canAskAgain ? (
            <Button title="Cấp quyền camera" onPress={requestPermission} />
          ) : (
            <Button title="Mở Cài đặt" onPress={() => Linking.openSettings()} />
          )}
        </View>
      );
    }
    return (
      <>
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={processing ? undefined : handleBarcodeScanned}
          />
          <View pointerEvents="none" style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        <Text style={styles.scanHint}>Đưa mã QR vào khung hình để quét</Text>
        {processing && (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color={colors.primary[300]} />
            <Text style={styles.processingText}>Đang xác thực mã QR…</Text>
          </View>
        )}
      </>
    );
  };

  const bottomItems: { key: string; label: string; icon: IconName; active: boolean; onPress: () => void }[] = [
    { key: 'scan', label: 'Quét QR', icon: 'qr-code-outline', active: tab === 'scan', onPress: () => setTab('scan') },
    { key: 'upload', label: 'Tải ảnh', icon: 'image-outline', active: false, onPress: handlePickImage },
    { key: 'my', label: 'QR của bạn', icon: 'grid-outline', active: tab === 'my', onPress: () => setTab('my') },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
          <Icon name="close" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{tab === 'scan' ? 'Quét mã QR' : 'QR của bạn'}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {tab === 'scan' ? renderScanner() : <MyQrCard />}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {bottomItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            disabled={item.key === 'upload' && processing}
            style={styles.bottomItem}
          >
            <Icon name={item.icon} size={22} color={item.active ? colors.primary[300] : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.bottomLabel, item.active && styles.bottomLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Toast />
    </View>
  );
}

const CORNER = 28;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.slate[900],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cameraBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  viewfinder: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  processingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: colors.primary[300],
  },
  permissionBox: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.slate[800],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  bottomLabelActive: {
    color: colors.primary[300],
  },
});
