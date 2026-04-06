const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50 to-secondary-50">
      {/* Decorative bg shapes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-[400px] h-[400px] bg-primary-400 rounded-full opacity-15 -top-[120px] -right-[80px] blur-[60px]" />
        <div className="absolute w-[300px] h-[300px] bg-secondary-400 rounded-full opacity-15 -bottom-[80px] -left-[60px] blur-[50px]" />
        <div className="absolute w-[200px] h-[200px] bg-primary-300 rounded-full opacity-15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[80px]" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4 drop-shadow-[0_4px_12px_rgba(99,102,241,0.25)]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#logo-grad)" />
              <path d="M12 20C12 16 14 13 20 13C26 13 28 16 28 20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="10" y="18" width="20" height="14" rx="3" fill="#fff" fillOpacity="0.9" />
              <circle cx="20" cy="25" r="2.5" fill="#4F46E5" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366F1" />
                  <stop offset="1" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 tracking-tight">School Wallet</h1>
          <p className="text-[0.9375rem] text-slate-500 mt-1">Ví điện tử trường học thông minh</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl py-9 px-8 shadow-xl border border-white/80 backdrop-blur-[10px] max-sm:px-5 max-sm:py-7">
          {children}
        </div>

        <p className="text-center text-[0.8125rem] text-slate-400 mt-6">
          &copy; 2026 School Wallet. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
