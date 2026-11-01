import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import userApi from '@/api/userApi';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Icon from '@/components/common/Icon';
import InfoRow from '@/components/common/InfoRow';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import ScreenScroll from '@/components/layout/ScreenScroll';
import { colors } from '@/constants/theme';
import { displayToIsoDate, formatDate, isoToDisplayDate, maskDateInput } from '@/utils/format';
import type { KycResponse } from '@/types';

const emptyKycForm = {
  fullName: '',
  dateOfBirth: '',
  idNumber: '',
  idIssueDate: '',
  idIssuePlace: '',
  placeOfOrigin: '',
  permanentAddress: '',
};
type KycField = keyof typeof emptyKycForm;
type Side = 'front' | 'back';

const MAX_IMAGE_BYTES = 1_500_000;
const MAX_IMAGE_WIDTH = 1280;
const DATA_URI_PREFIX = 'data:image/jpeg;base64,';

const toJpegDataUri = async (uri: string, width: number): Promise<string> => {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_IMAGE_WIDTH) context.resize({ width: MAX_IMAGE_WIDTH });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  return `${DATA_URI_PREFIX}${saved.base64}`;
};

const estimateBytes = (dataUri: string) => Math.ceil(((dataUri.length - DATA_URI_PREFIX.length) * 3) / 4);

const KycImagePreview: React.FC<{ label: string; base64: string }> = ({ label, base64 }) => {
  const uri = base64.startsWith('data:') ? base64 : `${DATA_URI_PREFIX}${base64}`;
  return (
    <View style={styles.imageField}>
      <Text style={styles.imageLabel}>{label}</Text>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  );
};

interface ImageUploadFieldProps {
  label: string;
  preview: string;
  error?: string;
  processing: boolean;
  onPress: () => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, preview, error, processing, onPress }) => (
  <View style={styles.imageField}>
    <Text style={styles.uploadLabel}>{label}</Text>
    <Pressable
      onPress={onPress}
      disabled={processing}
      style={[styles.uploadBox, error ? styles.uploadBoxError : preview ? styles.uploadBoxFilled : null]}
    >
      {processing ? (
        <ActivityIndicator color={colors.primary[600]} />
      ) : preview ? (
        <Image source={{ uri: preview }} style={styles.uploadImage} resizeMode="cover" />
      ) : (
        <View style={styles.uploadPlaceholder}>
          <Icon name="camera-outline" size={26} color={colors.slate[400]} />
          <Text style={styles.uploadHint}>Bấm để chụp hoặc chọn ảnh</Text>
        </View>
      )}
    </Pressable>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function KycScreen() {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<KycResponse | null>(null);
  const [kycForm, setKycForm] = useState(emptyKycForm);
  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [idFrontImage, setIdFrontImage] = useState('');
  const [idBackImage, setIdBackImage] = useState('');
  const [processingSide, setProcessingSide] = useState<Side | null>(null);

  const kycStatus = user?.kycStatus;

  useEffect(() => {
    if (!kycStatus || kycStatus === 'UNVERIFIED') return;

    const fetchKyc = async () => {
      setKycLoading(true);
      try {
        const data = await userApi.getMyKyc();
        setKycData(data);
        if (data.status === 'REJECTED') {
          setKycForm({
            fullName: data.fullName ?? '',
            dateOfBirth: isoToDisplayDate(data.dateOfBirth),
            idNumber: data.idNumber ?? '',
            idIssueDate: isoToDisplayDate(data.idIssueDate),
            idIssuePlace: data.idIssuePlace ?? '',
            placeOfOrigin: data.placeOfOrigin ?? '',
            permanentAddress: data.permanentAddress ?? '',
          });
        }
      } catch {
        setKycData(null);
      } finally {
        setKycLoading(false);
      }
    };
    fetchKyc();
  }, [kycStatus]);

  const handleChange = (name: KycField, value: string) => {
    const next = name === 'dateOfBirth' || name === 'idIssueDate' ? maskDateInput(value) : value;
    setKycForm((prev) => ({ ...prev, [name]: next }));
    if (kycErrors[name]) setKycErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const pickImage = async (side: Side, source: 'camera' | 'library') => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'Vui lòng cấp quyền camera trong Cài đặt' });
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setProcessingSide(side);
    try {
      const dataUri = await toJpegDataUri(asset.uri, asset.width);
      if (estimateBytes(dataUri) > MAX_IMAGE_BYTES) {
        Toast.show({ type: 'error', text1: `Ảnh tối đa ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB` });
        return;
      }
      const errorKey = side === 'front' ? 'idFrontImage' : 'idBackImage';
      if (side === 'front') setIdFrontImage(dataUri);
      else setIdBackImage(dataUri);
      if (kycErrors[errorKey]) setKycErrors((prev) => ({ ...prev, [errorKey]: '' }));
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể xử lý ảnh, vui lòng thử lại' });
    } finally {
      setProcessingSide(null);
    }
  };

  const chooseImageSource = (side: Side) => {
    Alert.alert(side === 'front' ? 'Mặt trước CCCD' : 'Mặt sau CCCD', undefined, [
      { text: 'Chụp ảnh', onPress: () => pickImage(side, 'camera') },
      { text: 'Chọn từ thư viện', onPress: () => pickImage(side, 'library') },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!kycForm.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
    if (!kycForm.dateOfBirth) errors.dateOfBirth = 'Vui lòng nhập ngày sinh';
    else if (!displayToIsoDate(kycForm.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh không hợp lệ (dd/mm/yyyy)';
    if (!kycForm.idNumber.trim()) errors.idNumber = 'Vui lòng nhập số CCCD';
    if (!kycForm.idIssueDate) errors.idIssueDate = 'Vui lòng nhập ngày cấp';
    else if (!displayToIsoDate(kycForm.idIssueDate)) errors.idIssueDate = 'Ngày cấp không hợp lệ (dd/mm/yyyy)';
    if (!kycForm.idIssuePlace.trim()) errors.idIssuePlace = 'Vui lòng nhập nơi cấp';
    if (!kycForm.placeOfOrigin.trim()) errors.placeOfOrigin = 'Vui lòng nhập quê quán';
    if (!kycForm.permanentAddress.trim()) errors.permanentAddress = 'Vui lòng nhập địa chỉ thường trú';
    if (!idFrontImage) errors.idFrontImage = 'Vui lòng tải ảnh mặt trước CCCD';
    if (!idBackImage) errors.idBackImage = 'Vui lòng tải ảnh mặt sau CCCD';
    setKycErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await userApi.submitKyc({
        ...kycForm,
        dateOfBirth: displayToIsoDate(kycForm.dateOfBirth),
        idIssueDate: displayToIsoDate(kycForm.idIssueDate),
        idFrontImage,
        idBackImage,
      });
      setKycData(result);
      setIdFrontImage('');
      setIdBackImage('');
      await refreshUser();
      Toast.show({ type: 'success', text1: 'Nộp hồ sơ KYC thành công, vui lòng chờ admin duyệt' });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        Toast.show({ type: 'error', text1: err.response?.data?.message || 'Nộp hồ sơ thất bại' });
      } else {
        Toast.show({ type: 'error', text1: 'Nộp hồ sơ thất bại' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <Loading />;

  const canSubmitKyc = kycStatus === 'UNVERIFIED' || kycStatus === 'REJECTED';

  return (
    <ScreenScroll>
      {kycStatus === 'VERIFIED' && (
        kycLoading ? (
          <Loading />
        ) : (
          <>
            <View style={styles.verifiedBox}>
              <View style={styles.verifiedIcon}>
                <Icon name="checkmark" size={18} color={colors.white} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.verifiedTitle}>Đã xác minh danh tính</Text>
                {!!kycData?.verifiedAt && (
                  <Text style={styles.verifiedSub}>Ngày duyệt: {formatDate(kycData.verifiedAt)}</Text>
                )}
              </View>
            </View>

            {kycData && (
              <>
                <Card style={styles.listCard}>
                  <InfoRow label="Họ và tên" value={kycData.fullName} />
                  <InfoRow label="Ngày sinh" value={formatDate(kycData.dateOfBirth)} />
                  <InfoRow label="Số CCCD" value={kycData.idNumber} />
                  <InfoRow label="Ngày cấp" value={formatDate(kycData.idIssueDate)} />
                  <InfoRow label="Nơi cấp" value={kycData.idIssuePlace} />
                  <InfoRow label="Quê quán" value={kycData.placeOfOrigin ?? '—'} />
                  <InfoRow label="Địa chỉ thường trú" value={kycData.permanentAddress ?? '—'} />
                  <InfoRow label="Ngày nộp hồ sơ" value={formatDate(kycData.submittedAt)} last />
                </Card>
                {!!kycData.idFrontImage && <KycImagePreview label="Mặt trước CCCD" base64={kycData.idFrontImage} />}
                {!!kycData.idBackImage && <KycImagePreview label="Mặt sau CCCD" base64={kycData.idBackImage} />}
              </>
            )}
          </>
        )
      )}

      {kycStatus === 'PENDING' && (
        <Card style={styles.pendingCard}>
          <View style={styles.pendingIcon}>
            <Icon name="alert-circle-outline" size={28} color={colors.amber[600]} />
          </View>
          <Text style={styles.pendingTitle}>Hồ sơ đang chờ admin duyệt</Text>
          {!!kycData?.submittedAt && (
            <Text style={styles.pendingSub}>Ngày nộp: {formatDate(kycData.submittedAt)}</Text>
          )}
        </Card>
      )}

      {canSubmitKyc && (
        <>
          {kycStatus === 'REJECTED' && !!kycData?.rejectionReason && (
            <View style={styles.rejectedBox}>
              <Icon name="close-circle" size={20} color={colors.red[500]} />
              <View style={styles.flex}>
                <Text style={styles.rejectedTitle}>Hồ sơ bị từ chối</Text>
                <Text style={styles.rejectedReason}>{kycData.rejectionReason}</Text>
              </View>
            </View>
          )}

          {kycLoading ? (
            <Loading />
          ) : (
            <Card style={styles.formCard}>
              <Input
                label="Họ và tên theo CCCD"
                value={kycForm.fullName}
                onChangeText={(v) => handleChange('fullName', v)}
                placeholder="Nguyễn Văn A"
                error={kycErrors.fullName}
              />
              <Input
                label="Ngày sinh"
                value={kycForm.dateOfBirth}
                onChangeText={(v) => handleChange('dateOfBirth', v)}
                placeholder="dd/mm/yyyy"
                error={kycErrors.dateOfBirth}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Input
                label="Số CCCD"
                value={kycForm.idNumber}
                onChangeText={(v) => handleChange('idNumber', v)}
                placeholder="0xxxxxxxxx"
                error={kycErrors.idNumber}
                keyboardType="number-pad"
              />
              <Input
                label="Ngày cấp CCCD"
                value={kycForm.idIssueDate}
                onChangeText={(v) => handleChange('idIssueDate', v)}
                placeholder="dd/mm/yyyy"
                error={kycErrors.idIssueDate}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Input
                label="Nơi cấp CCCD"
                value={kycForm.idIssuePlace}
                onChangeText={(v) => handleChange('idIssuePlace', v)}
                placeholder="Cục Cảnh sát QLHC về TTXH"
                error={kycErrors.idIssuePlace}
              />
              <Input
                label="Quê quán"
                value={kycForm.placeOfOrigin}
                onChangeText={(v) => handleChange('placeOfOrigin', v)}
                placeholder="Xã/phường, Huyện/quận, Tỉnh/thành"
                error={kycErrors.placeOfOrigin}
              />
              <Input
                label="Địa chỉ thường trú"
                value={kycForm.permanentAddress}
                onChangeText={(v) => handleChange('permanentAddress', v)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                error={kycErrors.permanentAddress}
              />

              <ImageUploadField
                label="Mặt trước CCCD"
                preview={idFrontImage}
                error={kycErrors.idFrontImage}
                processing={processingSide === 'front'}
                onPress={() => chooseImageSource('front')}
              />
              <ImageUploadField
                label="Mặt sau CCCD"
                preview={idBackImage}
                error={kycErrors.idBackImage}
                processing={processingSide === 'back'}
                onPress={() => chooseImageSource('back')}
              />

              <Button title="Nộp hồ sơ xác minh" size="lg" loading={submitting} onPress={handleSubmit} />
            </Card>
          )}
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listCard: {
    paddingVertical: 4,
  },
  formCard: {
    gap: 16,
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.emerald[200],
    backgroundColor: colors.emerald[50],
  },
  verifiedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.emerald[700],
  },
  verifiedSub: {
    fontSize: 12,
    color: colors.emerald[600],
    marginTop: 2,
  },
  pendingCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  pendingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amber[700],
    textAlign: 'center',
  },
  pendingSub: {
    fontSize: 14,
    color: colors.slate[400],
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.red[200],
    backgroundColor: colors.red[50],
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red[700],
  },
  rejectedReason: {
    fontSize: 14,
    color: colors.red[500],
    marginTop: 2,
  },
  imageField: {
    gap: 6,
  },
  imageLabel: {
    fontSize: 12,
    color: colors.slate[500],
  },
  image: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[700],
  },
  uploadBox: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadBoxFilled: {
    borderColor: colors.primary[300],
  },
  uploadBoxError: {
    borderColor: colors.red[200],
    backgroundColor: colors.red[50],
  },
  uploadImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.slate[400],
  },
  errorText: {
    fontSize: 12,
    color: colors.red[500],
  },
});
