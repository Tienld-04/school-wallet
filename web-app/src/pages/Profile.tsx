import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import authApi from '../api/authApi';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input/Input';
import type { KycResponse } from '../types';

const kycStatusConfig: Record<string, { label: string; className: string }> = {
  UNVERIFIED: { label: 'Chưa xác minh', className: 'bg-slate-100 text-slate-500' },
  PENDING:    { label: 'Chờ duyệt',     className: 'bg-amber-50 text-amber-600' },
  VERIFIED:   { label: 'Đã xác minh',   className: 'bg-emerald-50 text-emerald-600' },
  REJECTED:   { label: 'Bị từ chối',    className: 'bg-red-50 text-red-500' },
};

const emptyKycForm = {
  fullName: '',
  dateOfBirth: '',
  idNumber: '',
  idIssueDate: '',
  idIssuePlace: '',
  placeOfOrigin: '',
  permanentAddress: '',
};

const MAX_IMAGE_BYTES = 1_500_000; // ~1.5MB raw — base64 ~2MB → tổng 2 ảnh ~ 4MB, an toàn dưới 5MB

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get('tab');
    if (t === 'kyc' || t === 'pin' || t === 'password') return t;
    return 'info';
  })();
  const [tab, setTab] = useState<'info' | 'password' | 'pin' | 'kyc'>(initialTab);
  const loading = !user;

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // PIN (OTP) form
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});
  const [submittingPin, setSubmittingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  // KYC form
  const [kycData, setKycData] = useState<KycResponse | null>(null);
  const [kycForm, setKycForm] = useState(emptyKycForm);
  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  // KYC images (base64 string với prefix data URL)
  const [idFrontImage, setIdFrontImage] = useState<string>('');
  const [idBackImage, setIdBackImage] = useState<string>('');

  // Load KYC data khi vào tab kyc
  useEffect(() => {
    if (tab !== 'kyc' || !user) return;
    if (user.kycStatus === 'UNVERIFIED') return;

    const fetchKyc = async () => {
      setKycLoading(true);
      try {
        const data = await userApi.getMyKyc();
        setKycData(data);
        // Pre-fill form nếu bị REJECTED để user dễ sửa lại
        if (data.status === 'REJECTED') {
          setKycForm({
            fullName: data.fullName ?? '',
            dateOfBirth: data.dateOfBirth ?? '',
            idNumber: data.idNumber ?? '',
            idIssueDate: data.idIssueDate ?? '',
            idIssuePlace: data.idIssuePlace ?? '',
            placeOfOrigin: data.placeOfOrigin ?? '',
            permanentAddress: data.permanentAddress ?? '',
          });
        }
      } catch {
        // Chưa có hồ sơ → bỏ qua
      } finally {
        setKycLoading(false);
      }
    };
    fetchKyc();
  }, [tab, user]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    if (passwordSuccess) setPasswordSuccess(false);
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwordForm.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordForm.newPassword.length < 6) errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSubmittingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
      } else {
        toast.error('Đổi mật khẩu thất bại');
      }
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Chỉ nhận số
    setPinForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 6) }));
    if (pinErrors[name]) setPinErrors((prev) => ({ ...prev, [name]: '' }));
    if (pinSuccess) setPinSuccess(false);
  };

  const validatePin = (): boolean => {
    const errors: Record<string, string> = {};
    if (!pinForm.currentPin) errors.currentPin = 'Vui lòng nhập mã OTP hiện tại';
    else if (pinForm.currentPin.length !== 6) errors.currentPin = 'Mã OTP phải đúng 6 số';
    if (!pinForm.newPin) errors.newPin = 'Vui lòng nhập mã OTP mới';
    else if (pinForm.newPin.length !== 6) errors.newPin = 'Mã OTP phải đúng 6 số';
    if (!pinForm.confirmPin) errors.confirmPin = 'Vui lòng xác nhận mã OTP mới';
    else if (pinForm.newPin !== pinForm.confirmPin) errors.confirmPin = 'Mã OTP xác nhận không khớp';
    setPinErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validatePin()) return;
    setSubmittingPin(true);
    try {
      await authApi.changePin({
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
        confirmPin: pinForm.confirmPin,
      });
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setPinSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Đổi OTP thất bại');
      } else {
        toast.error('Đổi OTP thất bại');
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKycForm((prev) => ({ ...prev, [name]: value }));
    if (kycErrors[name]) setKycErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Ảnh tối đa ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    const base64 = await fileToBase64(file);
    if (side === 'front') {
      setIdFrontImage(base64);
      if (kycErrors.idFrontImage) setKycErrors((prev) => ({ ...prev, idFrontImage: '' }));
    } else {
      setIdBackImage(base64);
      if (kycErrors.idBackImage) setKycErrors((prev) => ({ ...prev, idBackImage: '' }));
    }
  };

  const validateKyc = (): boolean => {
    const errors: Record<string, string> = {};
    if (!kycForm.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
    if (!kycForm.dateOfBirth) errors.dateOfBirth = 'Vui lòng nhập ngày sinh';
    if (!kycForm.idNumber.trim()) errors.idNumber = 'Vui lòng nhập số CCCD';
    if (!kycForm.idIssueDate) errors.idIssueDate = 'Vui lòng nhập ngày cấp';
    if (!kycForm.idIssuePlace.trim()) errors.idIssuePlace = 'Vui lòng nhập nơi cấp';
    if (!kycForm.placeOfOrigin.trim()) errors.placeOfOrigin = 'Vui lòng nhập quê quán';
    if (!kycForm.permanentAddress.trim()) errors.permanentAddress = 'Vui lòng nhập địa chỉ thường trú';
    if (!idFrontImage) errors.idFrontImage = 'Vui lòng tải ảnh mặt trước CCCD';
    if (!idBackImage) errors.idBackImage = 'Vui lòng tải ảnh mặt sau CCCD';
    setKycErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitKyc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateKyc()) return;
    setSubmittingKyc(true);
    try {
      const result = await userApi.submitKyc({
        ...kycForm,
        idFrontImage,
        idBackImage,
      });
      setKycData(result);
      setIdFrontImage('');
      setIdBackImage('');
      await refreshUser();
      toast.success('Nộp hồ sơ KYC thành công, vui lòng chờ admin duyệt');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Nộp hồ sơ thất bại');
      } else {
        toast.error('Nộp hồ sơ thất bại');
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const infoRows = user
    ? [
        { label: 'Họ và tên', value: user.fullName },
        { label: 'Số điện thoại', value: user.phone },
        { label: 'Số tài khoản', value: user.phone },
        { label: 'Email', value: user.email },
        { label: 'Ngày tạo', value: formatDate(user.createdAt) },
      ]
    : [];

  const canSubmitKyc = user?.kycStatus === 'UNVERIFIED' || user?.kycStatus === 'REJECTED';

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Thông tin cá nhân</h1>
      <p className="text-sm text-slate-500 mb-6 sm:mb-8">Quản lý thông tin tài khoản của bạn</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 sm:mb-6 w-fit flex-wrap">
        {(['info', 'password', 'pin', 'kyc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'info' ? 'Thông tin' : t === 'password' ? 'Đổi mật khẩu' : t === 'pin' ? 'Đổi OTP' : 'Xác minh KYC'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && user && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-6 sm:py-8 flex items-center gap-4 sm:gap-5 border-b border-slate-50">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-primary-500/20 shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">{user.email}</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
                <span className="text-sm text-slate-500 shrink-0">{row.label}</span>
                <span className="text-sm font-medium text-slate-800 text-right truncate">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
              <span className="text-sm text-slate-500 shrink-0">Trạng thái KYC</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycStatusConfig[user.kycStatus]?.className ?? 'bg-slate-100 text-slate-500'}`}>
                {kycStatusConfig[user.kycStatus]?.label ?? user.kycStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
          {passwordSuccess && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-700">Đã đổi mật khẩu thành công</p>
            </div>
          )}
          <form className="space-y-5 max-w-sm" onSubmit={handleSubmitPassword}>
            <Input label="Mật khẩu hiện tại" type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Nhập mật khẩu hiện tại" error={passwordErrors.currentPassword} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <Input label="Mật khẩu mới" type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Tối thiểu 6 ký tự" error={passwordErrors.newPassword} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <Input label="Xác nhận mật khẩu mới" type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Nhập lại mật khẩu mới" error={passwordErrors.confirmPassword} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <button type="submit" disabled={submittingPassword} className="inline-flex items-center justify-center font-semibold rounded-[10px] cursor-pointer transition-all duration-200 bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 px-7 py-3 text-[0.9375rem] disabled:opacity-55 disabled:cursor-not-allowed">
              {submittingPassword ? <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      )}

      {/* PIN (OTP) tab */}
      {tab === 'pin' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
          {pinSuccess && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-700">Đã đổi mã OTP thành công</p>
            </div>
          )}
          <div className="mb-5 flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs max-w-sm">
            <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Mã OTP gồm 6 chữ số, dùng để xác nhận giao dịch chuyển/thanh toán.</p>
          </div>
          <form className="space-y-5 max-w-sm" onSubmit={handleSubmitPin}>
            <Input label="Mã OTP hiện tại" type="password" name="currentPin" value={pinForm.currentPin} onChange={handlePinChange} placeholder="Nhập 6 số OTP hiện tại" error={pinErrors.currentPin} inputMode="numeric" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <Input label="Mã OTP mới" type="password" name="newPin" value={pinForm.newPin} onChange={handlePinChange} placeholder="Đúng 6 số" error={pinErrors.newPin} inputMode="numeric" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <Input label="Xác nhận mã OTP mới" type="password" name="confirmPin" value={pinForm.confirmPin} onChange={handlePinChange} placeholder="Nhập lại 6 số OTP mới" error={pinErrors.confirmPin} inputMode="numeric" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <button type="submit" disabled={submittingPin} className="inline-flex items-center justify-center font-semibold rounded-[10px] cursor-pointer transition-all duration-200 bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 px-7 py-3 text-[0.9375rem] disabled:opacity-55 disabled:cursor-not-allowed">
              {submittingPin ? <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Cập nhật OTP'}
            </button>
          </form>
        </div>
      )}

      {/* KYC tab */}
      {tab === 'kyc' && user && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">

          {/* VERIFIED */}
          {user.kycStatus === 'VERIFIED' && (
            kycLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Badge xác minh */}
                <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Đã xác minh danh tính</p>
                    {kycData?.verifiedAt && (
                      <p className="text-xs text-emerald-600 mt-0.5">Ngày duyệt: {formatDate(kycData.verifiedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Thông tin KYC */}
                {kycData && (
                  <>
                    <div className="divide-y divide-slate-50">
                      {[
                        { label: 'Họ và tên', value: kycData.fullName },
                        { label: 'Ngày sinh', value: formatDate(kycData.dateOfBirth) },
                        { label: 'Số CCCD', value: kycData.idNumber },
                        { label: 'Ngày cấp', value: formatDate(kycData.idIssueDate) },
                        { label: 'Nơi cấp', value: kycData.idIssuePlace },
                        { label: 'Quê quán', value: kycData.placeOfOrigin ?? '—' },
                        { label: 'Địa chỉ thường trú', value: kycData.permanentAddress ?? '—' },
                        { label: 'Ngày nộp hồ sơ', value: formatDate(kycData.submittedAt) },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                          <span className="text-sm text-slate-500 shrink-0">{row.label}</span>
                          <span className="text-sm font-medium text-slate-800 text-right truncate">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    {(kycData.idFrontImage || kycData.idBackImage) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {kycData.idFrontImage && (
                          <KycImagePreview label="Mặt trước CCCD" base64={kycData.idFrontImage} />
                        )}
                        {kycData.idBackImage && (
                          <KycImagePreview label="Mặt sau CCCD" base64={kycData.idBackImage} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )
          )}

          {/* PENDING */}
          {user.kycStatus === 'PENDING' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-amber-700">Hồ sơ đang chờ admin duyệt</p>
              {kycData?.submittedAt && (
                <p className="text-sm text-slate-400">Ngày nộp: {formatDate(kycData.submittedAt)}</p>
              )}
            </div>
          )}

          {/* UNVERIFIED hoặc REJECTED → hiện form */}
          {canSubmitKyc && (
            <>
              {/* Banner bị từ chối */}
              {user.kycStatus === 'REJECTED' && kycData?.rejectionReason && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-600">Hồ sơ bị từ chối</p>
                    <p className="text-sm text-red-500 mt-0.5">{kycData.rejectionReason}</p>
                  </div>
                </div>
              )}

              {kycLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              ) : (
                <form className="space-y-4 max-w-sm" onSubmit={handleSubmitKyc}>
                  <Input label="Họ và tên theo CCCD" type="text" name="fullName" value={kycForm.fullName} onChange={handleKycChange} placeholder="Nguyễn Văn A" error={kycErrors.fullName} />
                  <Input label="Ngày sinh" type="date" name="dateOfBirth" value={kycForm.dateOfBirth} onChange={handleKycChange} placeholder="" error={kycErrors.dateOfBirth} />
                  <Input label="Số CCCD" type="text" name="idNumber" value={kycForm.idNumber} onChange={handleKycChange} placeholder="0xxxxxxxxx" error={kycErrors.idNumber} />
                  <Input label="Ngày cấp CCCD" type="date" name="idIssueDate" value={kycForm.idIssueDate} onChange={handleKycChange} placeholder="" error={kycErrors.idIssueDate} />
                  <Input label="Nơi cấp CCCD" type="text" name="idIssuePlace" value={kycForm.idIssuePlace} onChange={handleKycChange} placeholder="Cục Cảnh sát QLHC về TTXH" error={kycErrors.idIssuePlace} />
                  <Input label="Quê quán" type="text" name="placeOfOrigin" value={kycForm.placeOfOrigin} onChange={handleKycChange} placeholder="Xã/phường, Huyện/quận, Tỉnh/thành" error={kycErrors.placeOfOrigin} />
                  <Input label="Địa chỉ thường trú" type="text" name="permanentAddress" value={kycForm.permanentAddress} onChange={handleKycChange} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" error={kycErrors.permanentAddress} />

                  {/* Upload 2 mặt CCCD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUploadField
                      label="Mặt trước CCCD"
                      preview={idFrontImage}
                      error={kycErrors.idFrontImage}
                      onSelect={(e) => handleImageSelect(e, 'front')}
                    />
                    <ImageUploadField
                      label="Mặt sau CCCD"
                      preview={idBackImage}
                      error={kycErrors.idBackImage}
                      onSelect={(e) => handleImageSelect(e, 'back')}
                    />
                  </div>

                  <button type="submit" disabled={submittingKyc} className="inline-flex items-center justify-center font-semibold rounded-[10px] cursor-pointer transition-all duration-200 bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 px-7 py-3 text-[0.9375rem] disabled:opacity-55 disabled:cursor-not-allowed">
                    {submittingKyc ? <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Nộp hồ sơ xác minh'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Hiển thị ảnh KYC từ base64. Tự thêm prefix `data:image/jpeg;base64,` nếu BE chỉ trả raw base64 (không có prefix).
 */
const KycImagePreview: React.FC<{ label: string; base64: string }> = ({ label, base64 }) => {
  const src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
      <img src={src} alt={label} className="w-full aspect-[1.6/1] object-cover rounded-xl border border-slate-200" />
    </div>
  );
};

interface ImageUploadFieldProps {
  label: string;
  preview: string;
  error?: string;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, preview, error, onSelect }) => (
  <label className="block">
    <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
    <div
      className={`relative aspect-[1.6/1] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
        error ? 'border-red-300 bg-red-50' : preview ? 'border-primary-300' : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/30'
      }`}
    >
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="text-center text-slate-400 px-3">
          <svg className="mx-auto mb-1.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs">Bấm để chọn ảnh</p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={onSelect}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </label>
);

export default Profile;
