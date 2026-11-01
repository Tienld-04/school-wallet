import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import FormMessage from '@/components/common/FormMessage';
import authApi from '@/api/authApi';
import { validateEmail } from '@/utils/validators';
import { colors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    setLoading(true);
    setApiError('');
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
      } else {
        setApiError('Gửi yêu cầu thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để nhận mật khẩu mới">
      <FormMessage message={apiError} />

      {success ? (
        <FormMessage
          type="success"
          message="Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
        />
      ) : (
        <>
          <Input
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
              if (apiError) setApiError('');
            }}
            placeholder="Nhập địa chỉ email"
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <Button title="Gửi mật khẩu mới" size="lg" loading={loading} onPress={handleSubmit} />
        </>
      )}

      <Text style={styles.footer}>
        <Link href="/login" dismissTo style={styles.footerLink}>
          ← Quay lại đăng nhập
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footer: {
    textAlign: 'center',
    fontSize: 14,
  },
  footerLink: {
    fontWeight: '500',
    color: colors.primary[600],
  },
});
