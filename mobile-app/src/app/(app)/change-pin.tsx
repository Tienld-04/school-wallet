import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import authApi from '@/api/authApi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import FormMessage from '@/components/common/FormMessage';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import ScreenScroll from '@/components/layout/ScreenScroll';
import { colors } from '@/constants/theme';

const emptyForm = { currentPin: '', newPin: '', confirmPin: '' };
type PinField = keyof typeof emptyForm;

export default function ChangePinScreen() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (name: PinField, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 6) }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (success) setSuccess(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.currentPin) newErrors.currentPin = 'Vui lòng nhập mã OTP hiện tại';
    else if (form.currentPin.length !== 6) newErrors.currentPin = 'Mã OTP phải đúng 6 số';
    if (!form.newPin) newErrors.newPin = 'Vui lòng nhập mã OTP mới';
    else if (form.newPin.length !== 6) newErrors.newPin = 'Mã OTP phải đúng 6 số';
    if (!form.confirmPin) newErrors.confirmPin = 'Vui lòng xác nhận mã OTP mới';
    else if (form.newPin !== form.confirmPin) newErrors.confirmPin = 'Mã OTP xác nhận không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authApi.changePin(form);
      setForm(emptyForm);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        Toast.show({ type: 'error', text1: err.response?.data?.message || 'Đổi OTP thất bại' });
      } else {
        Toast.show({ type: 'error', text1: 'Đổi OTP thất bại' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll>
      {success && <FormMessage type="success" message="Đã đổi mã OTP thành công" />}
      <View style={styles.note}>
        <Icon name="alert-circle-outline" size={16} color={colors.amber[700]} />
        <Text style={styles.noteText}>Mã OTP gồm 6 chữ số, dùng để xác nhận giao dịch chuyển/thanh toán.</Text>
      </View>
      <Card style={styles.card}>
        <Input
          label="Mã OTP hiện tại"
          password
          value={form.currentPin}
          onChangeText={(v) => handleChange('currentPin', v)}
          placeholder="Nhập 6 số OTP hiện tại"
          error={errors.currentPin}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          label="Mã OTP mới"
          password
          value={form.newPin}
          onChangeText={(v) => handleChange('newPin', v)}
          placeholder="Đúng 6 số"
          error={errors.newPin}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          label="Xác nhận mã OTP mới"
          password
          value={form.confirmPin}
          onChangeText={(v) => handleChange('confirmPin', v)}
          placeholder="Nhập lại 6 số OTP mới"
          error={errors.confirmPin}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button title="Cập nhật OTP" size="lg" loading={submitting} onPress={handleSubmit} />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amber[200],
    backgroundColor: colors.amber[50],
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.amber[700],
  },
  card: {
    gap: 16,
  },
});
