import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import transactionApi from '../api/transactionApi';
import walletApi from '../api/walletApi';
import { getErrorMessage } from '../utils/errorMessage';
import Pagination from '../components/common/Pagination/Pagination';
import type { TransactionHistoryItem, LedgerEntry } from '../types';

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

type TabKey = 'transactions' | 'ledger';

const TransactionHistory: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('transactions');

  // Transactions tab state
  const [txItems, setTxItems] = useState<TransactionHistoryItem[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txTotalElements, setTxTotalElements] = useState(0);
  const [txLoading, setTxLoading] = useState(true);

  // Ledger tab state
  const [ledgerItems, setLedgerItems] = useState<LedgerEntry[]>([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(0);
  const [ledgerTotalElements, setLedgerTotalElements] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  const fetchTransactions = useCallback(async (pageToFetch: number) => {
    setTxLoading(true);
    try {
      const data = await transactionApi.getHistory(pageToFetch, PAGE_SIZE);
      setTxItems(data.content);
      setTxTotalPages(data.totalPages);
      setTxTotalElements(data.totalElements);
      setTxPage(data.page);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch sử giao dịch'));
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async (pageToFetch: number) => {
    setLedgerLoading(true);
    try {
      const data = await walletApi.getMyLedger(pageToFetch, PAGE_SIZE);
      setLedgerItems(data.content);
      setLedgerTotalPages(data.totalPages);
      setLedgerTotalElements(data.totalElements);
      setLedgerPage(data.page);
      setLedgerLoaded(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải biến động số dư'));
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(0);
  }, [fetchTransactions]);

  // Lazy-load ledger lần đầu khi user click sang tab
  useEffect(() => {
    if (tab === 'ledger' && !ledgerLoaded) {
      fetchLedger(0);
    }
  }, [tab, ledgerLoaded, fetchLedger]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Lịch sử hoạt động</h1>
      <p className="text-sm text-slate-500 mb-5 sm:mb-6">
        Giao dịch và biến động số dư ví của bạn
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 sm:mb-6 w-fit flex-wrap">
        {([
          { key: 'transactions' as TabKey, label: 'Giao dịch' },
          { key: 'ledger' as TabKey, label: 'Biến động số dư' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {txLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : txItems.length === 0 ? (
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
                {txItems.map((tx) => {
                  const isCredit = tx.displayAmount > 0;
                  const counterName = isCredit ? tx.fromFullName : tx.toFullName;
                  const counterPhone = isCredit ? tx.fromPhone : tx.toPhone;
                  const status = statusStyle[tx.status] || statusStyle.PENDING;
                  return (
                    <div
                      key={tx.transactionId}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 font-bold ${
                          isCredit
                            ? 'bg-secondary-50 text-secondary-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isCredit ? '↓' : '↑'}
                      </div>

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

          {!txLoading && txItems.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-medium text-slate-600">{txItems.length}</span> / {txTotalElements} giao dịch
              </p>
              {txTotalPages > 1 && (
                <Pagination page={txPage} totalPages={txTotalPages} onPageChange={fetchTransactions} />
              )}
            </div>
          )}
        </>
      )}

      {/* Ledger tab */}
      {tab === 'ledger' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {ledgerLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : ledgerItems.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">Chưa có biến động số dư nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {ledgerItems.map((entry) => {
                  const isCredit = entry.direction === 'CREDIT';
                  return (
                    <div
                      key={entry.entryId}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 font-bold ${
                          isCredit
                            ? 'bg-secondary-50 text-secondary-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isCredit ? '↓' : '↑'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {entry.reasonLabel}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.note}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                          <span>{formatDateTime(entry.createdAt)}</span>
                          <span className="ml-2">
                            · Số dư: {formatVND(entry.balanceBefore)} → <span className="font-medium text-slate-500">{formatVND(entry.balanceAfter)}đ</span>
                          </span>
                          {entry.transactionId && (
                            <span
                              className="ml-2 font-mono text-slate-500 cursor-pointer hover:text-primary-600"
                              title={`Mã giao dịch: ${entry.transactionId} (click để sao chép)`}
                              onClick={() => {
                                navigator.clipboard.writeText(entry.transactionId!);
                                toast.success('Đã sao chép mã giao dịch');
                              }}
                            >
                              · #{entry.transactionId.slice(0, 8)}
                            </span>
                          )}
                        </p>
                      </div>

                      <p
                        className={`text-sm sm:text-base font-bold shrink-0 ${
                          isCredit ? 'text-secondary-600' : 'text-slate-700'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatVND(entry.amount)}
                        <span className="text-xs font-medium ml-1 opacity-60">{entry.currency}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!ledgerLoading && ledgerItems.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-medium text-slate-600">{ledgerItems.length}</span> / {ledgerTotalElements} bút toán
              </p>
              {ledgerTotalPages > 1 && (
                <Pagination page={ledgerPage} totalPages={ledgerTotalPages} onPageChange={fetchLedger} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
