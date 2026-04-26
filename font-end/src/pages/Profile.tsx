import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import authApi from '../api/authApi';
import Input from '../components/common/Input/Input';
import type { UserResponse, KycResponse } from '../types';

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
  studentCode: '',
};

const Profile: React.FC = () => {
  const [tab, setTab] = useState<'info' | 'password' | 'kyc'>('info');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // KYC form
  const [kycData, setKycData] = useState<KycResponse | null>(null);
  const [kycForm, setKycForm] = useState(emptyKycForm);
  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userApi.getInfo();
        setUser(data);
      } catch {
        toast.error('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
            studentCode: data.studentCode ?? '',
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

  const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKycForm((prev) => ({ ...prev, [name]: value }));
    if (kycErrors[name]) setKycErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateKyc = (): boolean => {
    const errors: Record<string, string> = {};
    if (!kycForm.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
    if (!kycForm.dateOfBirth) errors.dateOfBirth = 'Vui lòng nhập ngày sinh';
    if (!kycForm.idNumber.trim()) errors.idNumber = 'Vui lòng nhập số CCCD';
    if (!kycForm.idIssueDate) errors.idIssueDate = 'Vui lòng nhập ngày cấp';
    if (!kycForm.idIssuePlace.trim()) errors.idIssuePlace = 'Vui lòng nhập nơi cấp';
    if (!kycForm.studentCode.trim()) errors.studentCode = 'Vui lòng nhập mã sinh viên';
    setKycErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitKyc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateKyc()) return;
    setSubmittingKyc(true);
    try {
      const result = await userApi.submitKyc(kycForm);
      setKycData(result);
      setUser((prev) => prev ? { ...prev, kycStatus: 'PENDING' } : prev);
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
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 sm:mb-6 w-fit">
        {(['info', 'password', 'kyc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'info' ? 'Thông tin' : t === 'password' ? 'Đổi mật khẩu' : 'Xác minh KYC'}
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

      {/* KYC tab */}
      {tab === 'kyc' && user && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">

          {/* VERIFIED */}
          {user.kycStatus === 'VERIFIED' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-emerald-700">Tài khoản đã được xác minh KYC</p>
              {kycData?.verifiedAt && (
                <p className="text-sm text-slate-400">Ngày xác minh: {formatDate(kycData.verifiedAt)}</p>
              )}
            </div>
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
                  <Input label="Mã sinh viên" type="text" name="studentCode" value={kycForm.studentCode} onChange={handleKycChange} placeholder="SV00000" error={kycErrors.studentCode} />
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

export default Profile;
