import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { validatePhone, validatePassword } from '../../utils/validators';

interface LoginForm {
  phone: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginForm>({ phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      await login(form.phone, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setApiError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-7">
        <h2 className="text-[1.375rem] font-bold text-slate-900 mb-1.5">Chào mừng trở lại</h2>
        <p className="text-sm text-slate-500">Đăng nhập vào tài khoản của bạn</p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 rounded-md text-[0.8625rem] font-medium bg-red-50 text-red-500 border border-red-500/15">
          {apiError}
        </div>
      )}

      <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
        <Input
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Nhập số điện thoại"
          error={errors.phone}
          maxLength={10}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Nhập mật khẩu"
          error={errors.password}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        />

        <div className="text-right -mt-2">
          <Link
            to="/forgot-password"
            className="text-[0.8125rem] text-slate-500 font-medium hover:text-primary-600 transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="mt-1.5">
          <Button type="submit" fullWidth loading={loading} size="lg">
            Đăng nhập
          </Button>
        </div>
      </form>

      <p className="text-center mt-5 text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-500 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
