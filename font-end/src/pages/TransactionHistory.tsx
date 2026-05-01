import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import transactionApi from '../api/transactionApi';
import { getErrorMessage } from '../utils/errorMessage';
import Pagination from '../components/common/Pagination/Pagination';
import type { TransactionHistoryItem } from '../types';

const PAGE_SIZE = 10;

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.abs(amount));

const formatDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán',
  TOPUP: 'Nạp tiền',
};

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  SUCCESS: { bg: 'bg-secondary-50', text: 'text-secondary-700', label: 'Thành công' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Đang xử lý' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Thất bại' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Đã hủy' },
};

const TransactionHistory: React.FC = () => {
  const [items, setItems] = useState<TransactionHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (pageToFetch: number) => {
    setLoading(true);
    try {
      const data = await transactionApi.getHistory(pageToFetch, PAGE_SIZE);
      setItems(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.page);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch sử giao dịch'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Lịch sử giao dịch</h1>
      <p className="text-sm text-slate-500 mb-6">
        Tất cả giao dịch của bạn — chuyển khoản, thanh toán, nạp tiền
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((tx) => {
              const isCredit = tx.displayAmount > 0;
              const counterName = isCredit ? tx.fromFullName : tx.toFullName;
              const counterPhone = isCredit ? tx.fromPhone : tx.toPhone;
              const status = statusStyle[tx.status] || statusStyle.PENDING;
              return (
                <div
                  key={tx.transactionId}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Direction icon */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 font-bold ${
                      isCredit
                        ? 'bg-secondary-50 text-secondary-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCredit ? '↓' : '↑'}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {counterName || '—'}
                        {counterPhone && (
                          <span className="font-normal text-slate-400"> - {counterPhone}</span>
                        )}
                      </p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {tx.description || typeLabel[tx.transactionType] || tx.transactionType}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      <span
                        className="font-mono text-slate-500 cursor-pointer hover:text-primary-600"
                        title={`Mã giao dịch: ${tx.transactionId} (click để sao chép)`}
                        onClick={() => {
                          navigator.clipboard.writeText(tx.transactionId);
                          toast.success('Đã sao chép mã giao dịch');
                        }}
                      >
                        #{tx.transactionId.slice(0, 8)}
                      </span>
                      <span className="ml-2">· {formatDateTime(tx.createdAt)}</span>
                      {tx.fee > 0 && isCredit && (
                        <span className="ml-2">
                          · Phí: <span className="text-slate-500 font-medium">{formatVND(tx.fee)}đ</span>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <p
                    className={`text-sm sm:text-base font-bold shrink-0 ${
                      isCredit ? 'text-secondary-600' : 'text-slate-700'
                    }`}
                  >
                    {isCredit ? '+' : '-'}
                    {formatVND(tx.displayAmount)}
                    <span className="text-xs font-medium ml-1 opacity-60">VND</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-xs text-slate-400">
            Hiển thị <span className="font-medium text-slate-600">{items.length}</span> / {totalElements} giao dịch
          </p>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={fetchData} />
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
