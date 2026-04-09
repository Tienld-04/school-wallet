import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// TODO: replace mock data with real API calls when wallet/transaction service is ready
const MOCK_BALANCE = 1_250_000;
const MOCK_ACCOUNT = '1234 5678 90';
const MOCK_NAME = 'Nguyễn Văn A';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  desc: string;
  amount: number;
  time: string;
  date: string;
}

const mockTransactions: Transaction[] = [
  { id: 1, type: 'credit', desc: 'Nạp tiền ví',        amount: 500_000,   time: '10:30', date: 'Hôm nay' },
  { id: 2, type: 'debit',  desc: 'Thanh toán học phí', amount: 1_200_000, time: '09:15', date: 'Hôm nay' },
  { id: 3, type: 'credit', desc: 'Nhận chuyển khoản',  amount: 200_000,   time: '18:45', date: 'Hôm qua' },
  { id: 4, type: 'debit',  desc: 'Thanh toán căng-tin', amount: 35_000,   time: '12:00', date: 'Hôm qua' },
];

const quickActions = [
  { label: 'Nạp tiền',    bg: 'bg-secondary-50', text: 'text-secondary-600', symbol: '↑' },
  { label: 'Chuyển tiền', bg: 'bg-primary-50',   text: 'text-primary-600',   symbol: '→' },
  { label: 'Rút tiền',    bg: 'bg-orange-50',    text: 'text-orange-500',    symbol: '↓' },
  { label: 'Lịch sử',    bg: 'bg-slate-100',    text: 'text-slate-500',     symbol: '☰' },
];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const WalletIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
    <path d="M4 13C4 10 6 8 13 8C20 8 22 10 22 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="3" y="12" width="20" height="11" rx="2.5" fill="white" fillOpacity="0.85" />
    <circle cx="13" cy="17.5" r="2" fill="#4F46E5" />
  </svg>
);

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <WalletIcon />
            </div>
            <span className="font-bold text-slate-900 text-[0.9375rem]">School Wallet</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-7 space-y-5">
        {/* ── Balance Card ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 p-6 text-white shadow-lg shadow-primary-600/20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-52 h-52 rounded-full bg-white/5 -top-14 -right-14" />
            <div className="absolute w-36 h-36 rounded-full bg-white/5 bottom-0 right-10 translate-y-1/2" />
          </div>

          <div className="relative z-10">
            <p className="text-primary-200 text-sm mb-1">Số dư khả dụng</p>
            <p className="text-[2.25rem] font-bold tracking-tight mb-5">{fmt(MOCK_BALANCE)}</p>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-primary-300 text-xs mb-0.5">Số tài khoản</p>
                <p className="font-mono text-white text-sm tracking-[0.15em]">{MOCK_ACCOUNT}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-300 text-xs mb-0.5">Chủ tài khoản</p>
                <p className="text-white text-sm font-medium">{MOCK_NAME}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              className="flex flex-col items-center gap-2.5 py-4 px-2 bg-white rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-semibold ${a.bg} ${a.text}`}>
                {a.symbol}
              </div>
              <span className="text-xs font-medium text-slate-600 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {/* ── Recent Transactions ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Giao dịch gần đây</h3>
            <button className="text-sm text-primary-600 font-medium hover:underline">
              Xem tất cả
            </button>
          </div>

          {mockTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              Chưa có giao dịch nào
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-secondary-50 text-secondary-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tx.type === 'credit' ? '↓' : '↑'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.desc}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tx.date} · {tx.time}</p>
                  </div>

                  <p
                    className={`text-sm font-semibold shrink-0 ${
                      tx.type === 'credit' ? 'text-secondary-600' : 'text-slate-700'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
