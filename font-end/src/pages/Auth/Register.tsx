import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import otpApi from '../../api/otpApi';
import authApi from '../../api/authApi';
import {
  validatePhone, validateEmail, validatePassword,
  validateFullName, validatePin, validateOtp,
} from '../../utils/validators';

const STEPS = { PHONE: 1, OTP: 2, INFO: 3 } as const;
type StepValue = typeof STEPS[keyof typeof STEPS];
const RESEND_COOLDOWN = 60;

const STEP_DESC: Record<StepValue, string> = {
  [STEPS.PHONE]: 'Nhập số điện thoại để bắt đầu',
  [STEPS.OTP]: 'Nhập mã OTP đã gửi đến điện thoại',
  [STEPS.INFO]: 'Hoàn tất thông tin đăng ký',
};

interface StepIndicatorProps {
  step: StepValue;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step }) => {
  const stepClass = (s: number): string =>
    `w-8 h-8 rounded-full flex items-center justify-center text-[0.8125rem] font-bold border-2 transition-all duration-200 ${
      step > s
        ? 'border-secondary-500 bg-secondary-500 text-white'
        : step === s
        ? 'border-primary-500 bg-primary-50 text-primary-600'
        : 'border-slate-200 bg-white text-slate-400'
    }`;
  const lineClass = (s: number): string =>
    `w-10 h-0.5 transition-all duration-200 ${step > s ? 'bg-secondary-400' : 'bg-slate-200'}`;

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={stepClass(1)}>{step > 1 ? '✓' : '1'}</div>
      <div className={lineClass(1)} />
      <div className={stepClass(2)}>{step > 2 ? '✓' : '2'}</div>
      <div className={lineClass(2)} />
      <div className={stepClass(3)}>3</div>
    </div>
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

const Register: React.FC = () => {
  const navigate = useNavigate();
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }, [errors, apiError]);

  const handleError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      setApiError(err.response?.data?.message || fallback);
    } else {
      setApiError(fallback);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) return setErrors({ phone: phoneErr });

    setLoading(true);
    setApiError('');
    try {
      await otpApi.send(form.phone);
      toast.success('Mã OTP đã được gửi!');
      setStep(STEPS.OTP);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      handleError(err, 'Gửi OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpErr = validateOtp(form.otp);
    if (otpErr) return setErrors({ otp: otpErr });

    setLoading(true);
    setApiError('');
    try {
      const res = await otpApi.verify(form.phone, form.otp);
      setVerificationToken(res.verificationToken);
      toast.success('Xác thực OTP thành công!');
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
      toast.success('Đã gửi lại mã OTP!');
      setCooldown(RESEND_COOLDOWN);
    } catch {
      toast.error('Gửi lại OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      handleError(err, 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-7">
        <h2 className="text-[1.375rem] font-bold text-slate-900 mb-1.5">Tạo tài khoản</h2>
        <p className="text-sm text-slate-500">{STEP_DESC[step]}</p>
      </div>

      <StepIndicator step={step} />

      {apiError && (
        <div className="mb-4 p-3 rounded-md text-[0.8625rem] font-medium bg-red-50 text-red-500 border border-red-500/15">
          {apiError}
        </div>
      )}

      {/* Step 1 */}
      {step === STEPS.PHONE && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleSendOtp}>
          <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="Nhập số điện thoại 10 chữ số" error={errors.phone} maxLength={10} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Gửi mã OTP</Button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === STEPS.OTP && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleVerifyOtp}>
          <Input label="Mã OTP" name="otp" value={form.otp} onChange={handleChange} placeholder="Nhập mã 6 chữ số" error={errors.otp} maxLength={6} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>} />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Xác nhận OTP</Button>
          </div>
          <div className="text-center text-sm">
            {cooldown > 0 ? (
              <span className="text-slate-400">Gửi lại sau {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="bg-transparent border-none text-primary-600 font-semibold cursor-pointer text-sm hover:underline"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === STEPS.INFO && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleRegister}>
          <Input label="Họ và tên" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nhập họ và tên" error={errors.fullName} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Nhập địa chỉ email" error={errors.email} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
          <Input label="Mật khẩu" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" error={errors.password} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
          <Input label="Xác nhận mật khẩu" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu" error={errors.confirmPassword} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
          <Input label="Mã PIN giao dịch" name="transactionPin" value={form.transactionPin} onChange={handleChange} placeholder="Nhập 6 chữ số PIN" error={errors.transactionPin} maxLength={6} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>} />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Đăng ký</Button>
          </div>
        </form>
      )}

      <p className="text-center mt-5 text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
