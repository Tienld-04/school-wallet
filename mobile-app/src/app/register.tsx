import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import FormMessage from '@/components/common/FormMessage';
import otpApi from '@/api/otpApi';
import authApi from '@/api/authApi';
import {
  validatePhone, validateEmail, validatePassword,
  validateFullName, validatePin, validateOtp,
} from '@/utils/validators';
import { colors } from '@/constants/theme';

const STEPS = { PHONE: 1, OTP: 2, INFO: 3 } as const;
type StepValue = typeof STEPS[keyof typeof STEPS];
const RESEND_COOLDOWN = 60;

const STEP_DESC: Record<StepValue, string> = {
  [STEPS.PHONE]: 'Nhập số điện thoại để bắt đầu',
  [STEPS.OTP]: 'Nhập mã OTP đã gửi đến điện thoại',
  [STEPS.INFO]: 'Hoàn tất thông tin đăng ký',
};

const StepIndicator: React.FC<{ step: StepValue }> = ({ step }) => {
  const circleStyle = (s: number) => [
    styles.stepCircle,
    step > s ? styles.stepDone : step === s ? styles.stepActive : styles.stepIdle,
  ];
  const circleTextStyle = (s: number) => [
    styles.stepText,
    step > s ? styles.stepTextDone : step === s ? styles.stepTextActive : styles.stepTextIdle,
  ];
  const lineStyle = (s: number) => [styles.stepLine, step > s && styles.stepLineDone];

  return (
    <View style={styles.stepRow}>
      <View style={circleStyle(1)}><Text style={circleTextStyle(1)}>{step > 1 ? '✓' : '1'}</Text></View>
      <View style={lineStyle(1)} />
      <View style={circleStyle(2)}><Text style={circleTextStyle(2)}>{step > 2 ? '✓' : '2'}</Text></View>
      <View style={lineStyle(2)} />
      <View style={circleStyle(3)}><Text style={circleTextStyle(3)}>3</Text></View>
    </View>
  );
};

interface RegisterForm {
  phone: string;
  otp: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  transactionPin: string;
}

export default function RegisterScreen() {
  const [step, setStep] = useState<StepValue>(STEPS.PHONE);
  const [form, setForm] = useState<RegisterForm>({
    phone: '', otp: '', fullName: '', email: '',
    password: '', confirmPassword: '', transactionPin: '',
  });
  const [verificationToken, setVerificationToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (name: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      setApiError(err.response?.data?.message || fallback);
    } else {
      setApiError(fallback);
    }
  };

  const handleSendOtp = async () => {
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) return setErrors({ phone: phoneErr });

    setLoading(true);
    setApiError('');
    try {
      const { exists } = await authApi.checkPhone(form.phone);
      if (exists) {
        setErrors({ phone: 'Số điện thoại này đã được đăng ký.' });
        return;
      }
      await otpApi.send(form.phone);
      Toast.show({ type: 'success', text1: 'Mã OTP đã được gửi!' });
      setStep(STEPS.OTP);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      handleError(err, 'Gửi OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpErr = validateOtp(form.otp);
    if (otpErr) return setErrors({ otp: otpErr });

    setLoading(true);
    setApiError('');
    try {
      const res = await otpApi.verify(form.phone, form.otp);
      setVerificationToken(res.verificationToken);
      Toast.show({ type: 'success', text1: 'Xác thực OTP thành công!' });
      setStep(STEPS.INFO);
    } catch (err) {
      handleError(err, 'Mã OTP không đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await otpApi.send(form.phone);
      Toast.show({ type: 'success', text1: 'Đã gửi lại mã OTP!' });
      setCooldown(RESEND_COOLDOWN);
    } catch {
      Toast.show({ type: 'error', text1: 'Gửi lại OTP thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    const checks: [string, string][] = [
      ['fullName', validateFullName(form.fullName)],
      ['email', validateEmail(form.email)],
      ['password', validatePassword(form.password)],
      ['transactionPin', validatePin(form.transactionPin)],
    ];
    checks.forEach(([k, v]) => { if (v) newErrors[k] = v; });
    if (!form.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    setApiError('');
    try {
      await authApi.register({
        fullName: form.fullName, phone: form.phone, email: form.email,
        password: form.password, transactionPin: form.transactionPin, verificationToken,
      });
      Toast.show({ type: 'success', text1: 'Đăng ký thành công! Vui lòng đăng nhập.' });
      router.dismissTo('/login');
    } catch (err) {
      handleError(err, 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Tạo tài khoản" subtitle={STEP_DESC[step]}>
      <StepIndicator step={step} />

      <FormMessage message={apiError} />

      {step === STEPS.PHONE && (
        <>
          <Input
            label="Số điện thoại"
            value={form.phone}
            onChangeText={(v) => handleChange('phone', v)}
            placeholder="Nhập số điện thoại 10 chữ số"
            error={errors.phone}
            maxLength={10}
            keyboardType="number-pad"
            autoComplete="tel"
          />
          <Button title="Gửi mã OTP" size="lg" loading={loading} onPress={handleSendOtp} />
        </>
      )}

      {step === STEPS.OTP && (
        <>
          <Input
            label="Mã OTP"
            value={form.otp}
            onChangeText={(v) => handleChange('otp', v)}
            placeholder="Nhập mã 6 chữ số"
            error={errors.otp}
            maxLength={6}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
          />
          <Button title="Xác nhận OTP" size="lg" loading={loading} onPress={handleVerifyOtp} />
          <View style={styles.resendRow}>
            {cooldown > 0 ? (
              <Text style={styles.resendWait}>Gửi lại sau {cooldown}s</Text>
            ) : (
              <Pressable onPress={handleResendOtp} disabled={loading} hitSlop={8}>
                <Text style={styles.resendLink}>Gửi lại mã OTP</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {step === STEPS.INFO && (
        <>
          <Input
            label="Họ và tên"
            value={form.fullName}
            onChangeText={(v) => handleChange('fullName', v)}
            placeholder="Nhập họ và tên"
            error={errors.fullName}
            autoComplete="name"
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={(v) => handleChange('email', v)}
            placeholder="Nhập địa chỉ email"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Mật khẩu"
            password
            value={form.password}
            onChangeText={(v) => handleChange('password', v)}
            placeholder="Tối thiểu 6 ký tự"
            error={errors.password}
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Input
            label="Xác nhận mật khẩu"
            password
            value={form.confirmPassword}
            onChangeText={(v) => handleChange('confirmPassword', v)}
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Input
            label="Mã OTP giao dịch"
            password
            value={form.transactionPin}
            onChangeText={(v) => handleChange('transactionPin', v)}
            placeholder="Nhập 6 chữ số OTP"
            error={errors.transactionPin}
            maxLength={6}
            keyboardType="number-pad"
          />
          <Button title="Đăng ký" size="lg" loading={loading} onPress={handleRegister} />
        </>
      )}

      <Text style={styles.footer}>
        Đã có tài khoản?{' '}
        <Link href="/login" dismissTo style={styles.footerLink}>
          Đăng nhập
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    borderColor: colors.secondary[500],
    backgroundColor: colors.secondary[500],
  },
  stepActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  stepIdle: {
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTextDone: {
    color: colors.white,
  },
  stepTextActive: {
    color: colors.primary[600],
  },
  stepTextIdle: {
    color: colors.slate[400],
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.slate[200],
  },
  stepLineDone: {
    backgroundColor: colors.secondary[400],
  },
  resendRow: {
    alignItems: 'center',
  },
  resendWait: {
    fontSize: 14,
    color: colors.slate[400],
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
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
