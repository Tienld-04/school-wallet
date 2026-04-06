import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import authApi from '../../api/authApi';
import { validateEmail } from '../../utils/validators';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    setLoading(true); setApiError('');
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-7">
        <h2 className="text-[1.375rem] font-bold text-slate-900 mb-1.5">Quên mật khẩu</h2>
        <p className="text-sm text-slate-500">Nhập email để nhận mật khẩu mới</p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 rounded-md text-[0.8625rem] font-medium bg-red-50 text-red-500 border border-red-500/15">
          {apiError}
        </div>
      )}

      {success ? (
        <div className="p-3 rounded-md text-[0.8625rem] font-medium bg-emerald-50 text-emerald-700 border border-emerald-500/15">
          Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
        </div>
      ) : (
        <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
          <Input
            label="Email" type="email" name="email" value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); if (apiError) setApiError(''); }}
            placeholder="Nhập địa chỉ email" error={error} icon="✉️"
          />
          <div className="mt-1.5">
            <Button type="submit" fullWidth loading={loading} size="lg">Gửi mật khẩu mới</Button>
          </div>
        </form>
      )}

      <p className="text-center mt-5 text-sm">
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-500 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
