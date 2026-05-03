import React, { useState } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import { getErrorMessage } from '../../utils/errorMessage';
import type { TransactionDetail } from '../../types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán dịch vụ',
  TOPUP: 'Nạp tiền',
};

const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  SUCCESS:   { bg: 'bg-secondary-50', text: 'text-secondary-700', dot: 'bg-secondary-500', label: 'Thành công' },
  PENDING:   { bg: 'bg-amber-50',     text: 'text-amber-700',     dot: 'bg-amber-500',     label: 'Đang xử lý' },
  FAILED:    { bg: 'bg-red-50',       text: 'text-red-700',       dot: 'bg-red-500',       label: 'Thất bại' },
  CANCELLED: { bg: 'bg-slate-100',    text: 'text-slate-600',     dot: 'bg-slate-400',     label: 'Đã hủy' },
};

const TransactionLookup: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionDetail | null>(null);
  const [searched, setSearched] = useState(false); // đã search ít nhất 1 lần

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = input.trim();
    if (!UUID_REGEX.test(id)) {
      toast.error('Mã giao dịch không hợp lệ (UUID)');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await adminApi.getTransactionDetail(id);
      setResult(data);
    } catch (err: unknown) {
      setResult(null);
      toast.error(getErrorMessage(err, 'Không tìm thấy giao dịch'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setSearched(false);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Tra cứu giao dịch</h1>
      <p className="text-sm text-slate-500 mb-6">Nhập mã giao dịch (UUID) để xem chi tiết và lịch sử trạng thái</p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập mã giao dịch, ví dụ: 94ffa169-1c9e-45b9-b4eb-561245ee177e"
              className="w-full py-2.5 pl-10 pr-4 bg-white border-[1.5px] border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/12 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 transition-all"
          >
            {loading ? 'Đang tra…' : 'Tra cứu'}
          </button>
          {(input || result) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            >
              Xóa
            </button>
          )}
        </div>
      </form>

      {/* Result */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && !result && searched && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Không tìm thấy giao dịch</p>
          <p className="text-xs text-slate-400 mt-1">Kiểm tra lại mã giao dịch và thử tra cứu lại</p>
        </div>
      )}

      {!loading && !result && !searched && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-14 h-14 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Sẵn sàng tra cứu</p>
          <p className="text-xs text-slate-400 mt-1">Nhập mã giao dịch ở ô tìm kiếm phía trên</p>
        </div>
      )}

      {!loading && result && (
        <ResultCard data={result} />
      )}
    </div>
  );
};

const ResultCard: React.FC<{ data: TransactionDetail }> = ({ data }) => {
  const status = statusStyle[data.status] || statusStyle.PENDING;
  const merchantAmount = data.amount - data.fee;

  const copyId = () => {
    navigator.clipboard.writeText(data.transactionId);
    toast.success('Đã sao chép mã giao dịch');
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Mã giao dịch</p>
            <button
              onClick={copyId}
              className="font-mono text-sm text-slate-700 hover:text-primary-600 transition-colors flex items-center gap-1.5"
              title="Click để sao chép"
            >
              {data.transactionId}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Loại giao dịch" value={typeLabel[data.transactionType] || data.transactionType} />
          <Field label="Thời gian" value={formatDateTime(data.createdAt)} />
          <Field label="Người gửi" value={data.fromFullName || '—'} sub={data.fromPhone} />
          <Field label="Người nhận" value={data.toFullName || '—'} sub={data.toPhone} />
          <Field label="Mô tả" value={data.description || '—'} fullWidth />
          {data.merchantId && (
            <Field label="Merchant ID" value={data.merchantId} mono fullWidth />
          )}
        </div>
      </div>

      {/* Amount breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Số tiền</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Số tiền giao dịch</span>
            <span className="font-semibold text-slate-800">{formatVND(data.amount)}đ</span>
          </div>
          {data.fee > 0 && (
            <>
              <div className="flex justify-between text-amber-700">
                <span>Phí nền tảng</span>
                <span className="font-semibold">−{formatVND(data.fee)}đ</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-secondary-700">
                <span className="font-medium">Người nhận thực nhận</span>
                <span className="font-bold text-base">{formatVND(merchantAmount)}đ</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status history timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Lịch sử trạng thái</p>
        {data.statusHistory.length === 0 ? (
          <p className="text-sm text-slate-400">Không có dữ liệu</p>
        ) : (
          <ol className="space-y-4">
            {data.statusHistory.map((h, i) => {
              const s = statusStyle[h.toStatus] || statusStyle.PENDING;
              const isLast = i === data.statusHistory.length - 1;
              return (
                <li key={h.historyId} className="relative pl-7">
                  {/* Dot */}
                  <span className={`absolute left-0 top-1 w-3 h-3 rounded-full ${s.dot} ring-4 ring-white border border-slate-200`} />
                  {/* Vertical line connecting */}
                  {!isLast && <span className="absolute left-[5px] top-5 bottom-[-1rem] w-px bg-slate-200" />}
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {h.fromStatus
                          ? <>{statusStyle[h.fromStatus]?.label || h.fromStatus} → {s.label}</>
                          : s.label}
                      </p>
                      {h.reason && <p className="text-xs text-slate-500 mt-0.5">{h.reason}</p>}
                    </div>
                    <p className="text-[11px] text-slate-400">{formatDateTime(h.changedAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  fullWidth?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, sub, mono, fullWidth }) => (
  <div className={fullWidth ? 'sm:col-span-2' : ''}>
    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
    <p className={`text-sm text-slate-800 ${mono ? 'font-mono' : 'font-medium'} truncate`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

export default TransactionLookup;
