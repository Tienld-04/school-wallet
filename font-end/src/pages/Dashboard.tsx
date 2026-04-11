import React from 'react';

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
  { label: 'Nạp tiền',    bg: 'bg-secondary-50', text: 'text-secondary-600', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { label: 'Chuyển tiền', bg: 'bg-primary-50',   text: 'text-primary-600', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )},
  { label: 'Thanh toán',  bg: 'bg-orange-50',    text: 'text-orange-500', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )},
  { label: 'Lịch sử',    bg: 'bg-slate-100',    text: 'text-slate-500', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )},
];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-3xl space-y-5">
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
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${a.bg} ${a.text}`}>
              {a.icon}
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
    </div>
  );
};

export default Dashboard;
