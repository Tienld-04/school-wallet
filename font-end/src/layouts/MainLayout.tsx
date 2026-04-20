import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const menuItems = [
  {
    to: '/dashboard',
    label: 'Tổng quan',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/transfer',
    label: 'Chuyển khoản',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  },
  {
    to: '/payment',
    label: 'Thanh toán dịch vụ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    to: '/top-up',
    label: 'Nạp tiền',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

const WalletIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
    <path d="M4 13C4 10 6 8 13 8C20 8 22 10 22 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="3" y="12" width="20" height="11" rx="2.5" fill="white" fillOpacity="0.9" />
    <circle cx="13" cy="17.5" r="2" fill="#4F46E5" />
  </svg>
);

const adminMenuItems = [
  {
    to: '/admin/users',
    label: 'Quản lý người dùng',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/admin/merchants',
    label: 'Quản lý Merchant',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

const MainLayout: React.FC = () => {
  const { logout, role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium transition-all duration-200 group ${
      isActive
        ? 'bg-primary-50 text-primary-700 shadow-sm'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`;

  const showLabel = !collapsed || mobileOpen;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-100 flex flex-col z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          w-[260px]`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <WalletIcon />
          </div>
          {showLabel && (
            <span className="font-bold text-slate-900 text-[0.9375rem] whitespace-nowrap">
              School Wallet
            </span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={linkClass}>
              <span className="shrink-0">{item.icon}</span>
              {showLabel && <span>{item.label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              {showLabel && (
                <p className="text-[0.6875rem] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-1">
                  Quản trị
                </p>
              )}
              {!showLabel && <div className="my-2 mx-2 h-px bg-slate-100" />}
              {adminMenuItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <span className="shrink-0">{item.icon}</span>
                  {showLabel && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="px-3 pb-4 space-y-1 border-t border-slate-100 pt-3">
          <NavLink to="/profile" className={linkClass}>
            <span className="shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            {showLabel && <span>Thông tin cá nhân</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
          >
            <span className="shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {showLabel && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-20 flex items-center px-4 sm:px-6 gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
            aria-label="Mở menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-9 h-9 rounded-lg hidden lg:flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Thu gọn menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <WalletIcon />
            </div>
            <span className="font-bold text-slate-900 text-sm">School Wallet</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
