import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

interface KycGuardProps {
  children: React.ReactNode;
}

interface BannerConfig {
  title: string;
  description: string;
  ctaLabel: string;
  iconColor: string;
  bg: string;
  border: string;
  textColor: string;
  iconBg: string;
}

const STATUS_CONFIG: Record<string, BannerConfig> = {
  UNVERIFIED: {
    title: 'Bạn cần xác minh KYC để sử dụng tính năng này',
    description: 'Vui lòng hoàn thành xác minh danh tính (KYC) trước khi chuyển tiền, thanh toán hoặc nạp tiền.',
    ctaLabel: 'Xác minh ngay',
    iconColor: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  PENDING: {
    title: 'Hồ sơ KYC của bạn đang chờ duyệt',
    description: 'Hồ sơ đã được gửi và đang chờ admin xét duyệt. Bạn sẽ có thể giao dịch sau khi được xác minh.',
    ctaLabel: 'Xem trạng thái',
    iconColor: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  REJECTED: {
    title: 'Hồ sơ KYC của bạn đã bị từ chối',
    description: 'Hồ sơ xác minh không được chấp nhận. Vui lòng kiểm tra lý do và nộp lại hồ sơ.',
    ctaLabel: 'Nộp lại hồ sơ',
    iconColor: '#ef4444',
    bg: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-700',
    iconBg: 'bg-red-100',
  },
};

const KycGuard: React.FC<KycGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user.kycStatus === 'VERIFIED') {
    return <>{children}</>;
  }

  const config = STATUS_CONFIG[user.kycStatus] ?? STATUS_CONFIG.UNVERIFIED;

  return (
    <div className={`rounded-2xl border ${config.bg} ${config.border} p-6 sm:p-8 flex flex-col items-center text-center`}>
      <div className={`w-14 h-14 ${config.iconBg} rounded-full flex items-center justify-center mb-4`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h3 className={`text-base sm:text-lg font-bold ${config.textColor} mb-2`}>{config.title}</h3>
      <p className="text-sm text-slate-600 mb-5 max-w-md">{config.description}</p>
      <button
        onClick={() => navigate('/profile?tab=kyc')}
        className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/30 transition-all"
      >
        {config.ctaLabel}
      </button>
    </div>
  );
};

export default KycGuard;
