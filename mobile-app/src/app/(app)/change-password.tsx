import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import authApi from '@/api/authApi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import FormMessage from '@/components/common/FormMessage';
import Input from '@/components/common/Input';
import ScreenScroll from '@/components/layout/ScreenScroll';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
type PasswordField = keyof typeof emptyForm;

export default function ChangePasswordScreen() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (name: PasswordField, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (success) setSuccess(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.currentPassword) newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!form.newPassword) newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (form.newPassword.length < 6) newErrors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authApi.changePassword(form);
      setForm(emptyForm);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        Toast.show({ type: 'error', text1: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
      } else {
        Toast.show({ type: 'error', text1: 'Đổi mật khẩu thất bại' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll>
      {success && <FormMessage type="success" message="Đã đổi mật khẩu thành công" />}
      <Card style={styles.card}>
        <Input
          label="Mật khẩu hiện tại"
          password
          value={form.currentPassword}
          onChangeText={(v) => handleChange('currentPassword', v)}
          placeholder="Nhập mật khẩu hiện tại"
          error={errors.currentPassword}
          autoCapitalize="none"
        />
        <Input
          label="Mật khẩu mới"
          password
          value={form.newPassword}
          onChangeText={(v) => handleChange('newPassword', v)}
          placeholder="Tối thiểu 6 ký tự"
          error={errors.newPassword}
          autoCapitalize="none"
        />
        <Input
          label="Xác nhận mật khẩu mới"
          password
          value={form.confirmPassword}
          onChangeText={(v) => handleChange('confirmPassword', v)}
          placeholder="Nhập lại mật khẩu mới"
          error={errors.confirmPassword}
          autoCapitalize="none"
        />
        <Button title="Cập nhật mật khẩu" size="lg" loading={submitting} onPress={handleSubmit} />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
});
