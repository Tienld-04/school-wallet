import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import useAuth from '@/hooks/useAuth';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import FormMessage from '@/components/common/FormMessage';
import { validatePhone, validatePassword } from '@/utils/validators';
import { colors } from '@/constants/theme';

interface LoginForm {
  phone: string;
  password: string;
}

export default function LoginScreen() {
  const { login } = useAuth();

  const [form, setForm] = useState<LoginForm>({ phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (name: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const phoneErr = validatePhone(form.phone);
    const passErr = validatePassword(form.password);
    if (phoneErr) newErrors.phone = phoneErr;
    if (passErr) newErrors.password = passErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      await login(form.phone, form.password);
      Toast.show({ type: 'success', text1: 'Đăng nhập thành công!' });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setApiError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Chào mừng trở lại" subtitle="Đăng nhập vào tài khoản của bạn">
      <FormMessage message={apiError} />

      <Input
        label="Số điện thoại"
        value={form.phone}
        onChangeText={(v) => handleChange('phone', v)}
        placeholder="Nhập số điện thoại"
        error={errors.phone}
        maxLength={10}
        keyboardType="number-pad"
        autoComplete="tel"
      />
      <Input
        label="Mật khẩu"
        password
        value={form.password}
        onChangeText={(v) => handleChange('password', v)}
        placeholder="Nhập mật khẩu"
        error={errors.password}
        autoCapitalize="none"
        autoComplete="password"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <View style={styles.forgotRow}>
        <Link href="/forgot-password" style={styles.forgotLink}>
          Quên mật khẩu?
        </Link>
      </View>

      <Button title="Đăng nhập" size="lg" loading={loading} onPress={handleSubmit} />

      <Text style={styles.footer}>
        Chưa có tài khoản?{' '}
        <Link href="/register" style={styles.footerLink}>
          Đăng ký ngay
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate[500],
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.slate[500],
  },
  footerLink: {
    fontWeight: '600',
    color: colors.primary[600],
  },
});
