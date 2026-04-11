import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Chuyển tiền nhanh chóng',
    desc: 'Giao dịch tức thì trong vài giây',
    accent: 'from-yellow-400 to-orange-400',
    iconBg: 'bg-gradient-to-br from-yellow-400/20 to-orange-400/20',
    iconColor: 'text-yellow-300',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Bảo mật tuyệt đối',
    desc: 'Xác thực 2 lớp, mã hóa end-to-end',
    accent: 'from-emerald-400 to-teal-400',
    iconBg: 'bg-gradient-to-br from-emerald-400/20 to-teal-400/20',
    iconColor: 'text-emerald-300',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Thanh toán tiện lợi',
    desc: 'Học phí, căng-tin và nhiều hơn nữa',
    accent: 'from-violet-400 to-purple-400',
    iconBg: 'bg-gradient-to-br from-violet-400/20 to-purple-400/20',
    iconColor: 'text-violet-300',
  },
];

const stats = [
  { value: '10K+', label: 'Người dùng' },
  { value: '99.9%', label: 'Uptime' },
  { value: '2s', label: 'Xử lý' },
];

const WalletIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
    <path d="M4 13C4 10 6 8 13 8C20 8 22 10 22 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="3" y="12" width="20" height="11" rx="2.5" fill="white" fillOpacity="0.9" />
    <circle cx="13" cy="17.5" r="2" fill="#4F46E5" />
  </svg>
);

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex w-[46%] shrink-0 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 25%, #312E81 50%, #1e1b4b 100%)',
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Animated gradient orbs */}
          <div className="absolute w-[500px] h-[500px] rounded-full -top-48 -right-48 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
          />
          <div className="absolute w-[400px] h-[400px] rounded-full -bottom-32 -left-32 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', animationDelay: '2s' }}
          />
          <div className="absolute w-[300px] h-[300px] rounded-full top-1/3 right-1/4 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', animationDelay: '1s' }}
          />

          {/* Floating geometric shapes */}
          <div className="absolute top-20 right-16 w-16 h-16 border border-white/10 rounded-2xl rotate-12 animate-float-slow" />
          <div className="absolute bottom-40 right-24 w-10 h-10 border border-white/[0.07] rounded-xl -rotate-12 animate-float-medium" />
          <div className="absolute top-1/2 left-8 w-6 h-6 bg-white/[0.06] rounded-lg rotate-45 animate-float-medium" style={{ animationDelay: '1s' }} />
          <div className="absolute top-32 left-1/2 w-3 h-3 bg-yellow-400/20 rounded-full animate-float-slow" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-28 left-1/3 w-2 h-2 bg-emerald-400/25 rounded-full animate-float-medium" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16 animate-slide-up">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg shadow-black/10">
              <WalletIcon />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-tight tracking-tight">School Wallet</p>
              <p className="text-indigo-300/80 text-xs font-medium">Ví điện tử trường học</p>
            </div>
          </div>

          {/* Headline with gradient text */}
          <div className="mb-12 animate-slide-up-delay-1">
            <h2 className="text-[2.25rem] font-extrabold leading-[1.15] mb-4 tracking-tight">
              <span className="text-white">Quản lý tài chính</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                thông minh hơn
              </span>
            </h2>
            <p className="text-indigo-200/70 text-[0.9375rem] leading-relaxed max-w-[320px]">
              Giải pháp thanh toán hiện đại dành riêng cho sinh viên và giáo viên
            </p>
          </div>

          {/* Feature cards with glassmorphism */}
          <div className="space-y-3 animate-slide-up-delay-2">
            {features.map((f, i) => (
              <div
                key={i}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300 cursor-default"
              >
                <div className={`w-11 h-11 ${f.iconBg} rounded-xl flex items-center justify-center shrink-0 ${f.iconColor} border border-white/[0.08] group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-[0.9rem] leading-tight">{f.title}</p>
                  <p className="text-indigo-200/60 text-xs mt-1">{f.desc}</p>
                </div>
                <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${f.accent} opacity-40 group-hover:opacity-70 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 space-y-6">
          {/* Stats bar */}
          <div className="flex items-center gap-0 p-3 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] animate-slide-up-delay-3">
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="w-px h-8 bg-white/10" />}
                <div className="flex-1 text-center">
                  <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                  <p className="text-indigo-300/60 text-[0.6875rem] mt-0.5">{s.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-3 animate-slide-up-delay-4">
            <div className="flex -space-x-2">
              {['bg-gradient-to-br from-indigo-400 to-violet-400', 'bg-gradient-to-br from-emerald-400 to-teal-400', 'bg-gradient-to-br from-orange-400 to-amber-400'].map((bg, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${bg} border-2 border-[#312E81] flex items-center justify-center`}
                >
                  <span className="text-white text-[0.5rem] font-bold">
                    {['SW', 'HS', 'GV'][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-indigo-300/50 text-xs">
              Được tin dùng bởi hàng nghìn người dùng
            </p>
          </div>

          <p className="text-indigo-400/30 text-xs">
            &copy; 2026 School Wallet. All rights reserved.
          </p>
        </div>
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
