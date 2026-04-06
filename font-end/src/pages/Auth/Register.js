import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import otpApi from '../../api/otpApi';
import authApi from '../../api/authApi';
import {
  validatePhone, validateEmail, validatePassword,
  validateFullName, validatePin, validateOtp,
} from '../../utils/validators';

const STEPS = { PHONE: 1, OTP: 2, INFO: 3 };
const RESEND_COOLDOWN = 60;

const StepIndicator = ({ step }) => {
  const stepClass = (s) =>
    `w-8 h-8 rounded-full flex items-center justify-center text-[0.8125rem] font-bold border-2 transition-all duration-200 ${
      step > s ? 'border-secondary-500 bg-secondary-500 text-white'
      : step === s ? 'border-primary-500 bg-primary-50 text-primary-600'
      : 'border-slate-200 bg-white text-slate-400'
    }`;
  const lineClass = (s) =>
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

const STEP_DESC = {
  [STEPS.PHONE]: 'Nhập số điện thoại để bắt đầu',
  [STEPS.OTP]: 'Nhập mã OTP đã gửi đến điện thoại',
  [STEPS.INFO]: 'Hoàn tất thông tin đăng ký',
};

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.PHONE);
  const [form, setForm] = useState({
    phone: '', otp: '', fullName: '', email: '',
    password: '', confirmPassword: '', transactionPin: '',
  });
  const [verificationToken, setVerificationToken] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }, [errors, apiError]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) return setErrors({ phone: phoneErr });

    setLoading(true); setApiError('');
    try {
      await otpApi.send(form.phone);
      toast.success('Mã OTP đã được gửi!');
      setStep(STEPS.OTP);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Gửi OTP thất bại.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpErr = validateOtp(form.otp);
    if (otpErr) return setErrors({ otp: otpErr });

    setLoading(true); setApiError('');
    try {
      const res = await otpApi.verify(form.phone, form.otp);
      setVerificationToken(res.verificationToken);
      toast.success('Xác thực OTP thành công!');
      setStep(STEPS.INFO);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Mã OTP không đúng.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await otpApi.send(form.phone);
      toast.success('Đã gửi lại mã OTP!');
      setCooldown(RESEND_COOLDOWN);
    } catch { toast.error('Gửi lại OTP thất bại.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const checks = [
      ['fullName', validateFullName(form.fullName)],
      ['email', validateEmail(form.email)],
      ['password', validatePassword(form.password)],
      ['transactionPin', validatePin(form.transactionPin)],
    ];
    checks.forEach(([k, v]) => { if (v) newErrors[k] = v; });
    if (!form.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true); setApiError('');
    try {
      await authApi.register({
        fullName: form.fullName, phone: form.phone, email: form.email,
        password: form.password, transactionPin: form.transactionPin, verificationToken,
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại.');
    } finally { setLoading(false); }
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
          <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="Nhập số điện thoại 10 chữ số" error={errors.phone} maxLength={10} icon="📱" />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Gửi mã OTP</Button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === STEPS.OTP && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleVerifyOtp}>
          <Input label="Mã OTP" name="otp" value={form.otp} onChange={handleChange} placeholder="Nhập mã 6 chữ số" error={errors.otp} maxLength={6} icon="🔑" />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Xác nhận OTP</Button>
          </div>
          <div className="text-center text-sm">
            {cooldown > 0 ? (
              <span className="text-slate-400">Gửi lại sau {cooldown}s</span>
            ) : (
              <button type="button" onClick={handleResendOtp} className="bg-transparent border-none text-primary-600 font-semibold cursor-pointer text-sm hover:underline">
                Gửi lại mã OTP
              </button>
            )}
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === STEPS.INFO && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleRegister}>
          <Input label="Họ và tên" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nhập họ và tên" error={errors.fullName} icon="👤" />
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Nhập địa chỉ email" error={errors.email} icon="✉️" />
          <Input label="Mật khẩu" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" error={errors.password} icon="🔒" />
          <Input label="Xác nhận mật khẩu" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu" error={errors.confirmPassword} icon="🔒" />
          <Input label="Mã PIN giao dịch" name="transactionPin" value={form.transactionPin} onChange={handleChange} placeholder="Nhập 6 chữ số PIN" error={errors.transactionPin} maxLength={6} icon="🔐" />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Đăng ký</Button>
          </div>
        </form>
      )}

      <p className="text-center mt-5 text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
