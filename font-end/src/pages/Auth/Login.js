import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { validatePhone, validatePassword } from '../../utils/validators';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    const phoneErr = validatePhone(form.phone);
    const passErr = validatePassword(form.password);
    if (phoneErr) newErrors.phone = phoneErr;
    if (passErr) newErrors.password = passErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      await login(form.phone, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setApiError(message);
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
        <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="Nhập số điện thoại" error={errors.phone} maxLength={10} icon="📱" />
        <Input label="Mật khẩu" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" error={errors.password} icon="🔒" />

        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-[0.8125rem] text-slate-500 font-medium hover:text-primary-600 transition-colors">
            Quên mật khẩu?
          </Link>
        </div>

        <div className="mt-1.5">
          <Button type="submit" fullWidth loading={loading} size="lg">Đăng nhập</Button>
        </div>
      </form>

      <p className="text-center mt-5 text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline">Đăng ký ngay</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
