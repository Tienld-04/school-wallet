import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  { icon: '⚡', title: 'Chuyển tiền nhanh chóng', desc: 'Giao dịch tức thì trong vài giây' },
  { icon: '🔒', title: 'Bảo mật tuyệt đối', desc: 'Xác thực 2 lớp, mã hóa end-to-end' },
  { icon: '💳', title: 'Thanh toán tiện lợi', desc: 'Học phí, căng-tin và nhiều hơn nữa' },
];

const WalletIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
    <path d="M4 13C4 10 6 8 13 8C20 8 22 10 22 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="3" y="12" width="20" height="11" rx="2.5" fill="white" fillOpacity="0.85" />
    <circle cx="13" cy="17.5" r="2" fill="#4F46E5" />
  </svg>
);

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex w-[44%] shrink-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-32 -right-32" />
          <div className="absolute w-72 h-72 rounded-full bg-white/5 -bottom-16 -left-16" />
          <div className="absolute w-48 h-48 rounded-full bg-white/[0.06] top-1/2 left-1/3 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <WalletIcon />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-tight">School Wallet</p>
              <p className="text-primary-300 text-xs">Ví điện tử trường học</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h2 className="text-white text-[2rem] font-bold leading-tight mb-3">
              Quản lý tài chính<br />thông minh hơn
            </h2>
            <p className="text-primary-200 text-[0.9375rem]">
              Dành riêng cho sinh viên và giáo viên
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-lg shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-primary-200 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300/60 text-xs relative z-10">
          © 2026 School Wallet. All rights reserved.
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-[420px] py-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <WalletIcon />
            </div>
            <p className="font-bold text-xl text-slate-900">School Wallet</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
