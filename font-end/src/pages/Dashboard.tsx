import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import transactionApi from '../api/transactionApi';
import userApi from '../api/userApi';
import walletApi from '../api/walletApi';
import type { RecentTransactionResponse, UserResponse, BalanceResponse } from '../types';

const quickActions = [
  { label: 'Nạp tiền',    path: '/top-up',   bg: 'bg-secondary-50', text: 'text-secondary-600', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { label: 'Chuyển tiền', path: '/transfer', bg: 'bg-primary-50',   text: 'text-primary-600', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )},
  { label: 'Thanh toán',  path: '/payment',  bg: 'bg-orange-50',    text: 'text-orange-500', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )},
  { label: 'Lịch sử',    path: '/transactions', bg: 'bg-slate-100',    text: 'text-slate-500', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )},
];

const formatAmount = (amount: string) => {
  const sign = amount[0] === '+' || amount[0] === '-' ? amount[0] : '';
  const digits = amount.replace(/[^0-9]/g, '');
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Hôm nay · ${time}`;
    if (isYesterday) return `Hôm qua · ${time}`;
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} · ${time}`;
  } catch {
    return dateStr;
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<RecentTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, balanceData, txData] = await Promise.all([
          userApi.getInfo(),
          walletApi.getMyBalance(),
          transactionApi.getRecent(),
        ]);
        setUser(userData);
        setBalance(balanceData);
        setTransactions(txData);
      } catch {
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4 sm:space-y-5">
      {/* ── Balance Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 p-5 sm:p-6 text-white shadow-lg shadow-primary-600/20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-52 h-52 rounded-full bg-white/5 -top-14 -right-14" />
          <div className="absolute w-36 h-36 rounded-full bg-white/5 bottom-0 right-10 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-primary-200 text-sm">Số dư khả dụng</p>
            <button
              onClick={() => setShowBalance((prev) => !prev)}
              className="text-primary-200 hover:text-white transition-colors"
            >
              {showBalance ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[1.625rem] sm:text-[2.25rem] font-bold tracking-tight mb-5 break-words">
            {showBalance
              ? (balance
                  ? <>{new Intl.NumberFormat('vi-VN').format(balance.balance)}<span className="text-base font-medium ml-1.5 opacity-80">VND</span></>
                  : '—')
              : '•••••••'}
            {!showBalance && <span className="text-base font-medium ml-1.5 opacity-80">VND</span>}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-primary-300 text-xs mb-0.5">Số tài khoản</p>
              <p className="font-mono text-white text-sm tracking-[0.15em]">{user?.phone || '—'}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-primary-300 text-xs mb-0.5">Chủ tài khoản</p>
              <p className="text-white text-sm sm:text-base font-semibold uppercase truncate">{user?.fullName || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => a.path && navigate(a.path)}
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
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-50">
          <h3 className="font-semibold text-slate-900">Giao dịch gần đây</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map((tx) => {
              const isCredit = tx.amount.startsWith('+');
              return (
                <div key={tx.transactionId} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 ${
                      isCredit
                        ? 'bg-secondary-50 text-secondary-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCredit ? '↓' : '↑'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                  </div>

                  <p className={`text-sm font-semibold shrink-0 ${isCredit ? 'text-secondary-600' : 'text-slate-700'}`}>
                    {formatAmount(tx.amount)}<span className="text-xs font-medium ml-1 opacity-60">VND</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
