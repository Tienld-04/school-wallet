import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import transactionApi from '../api/transactionApi';
import { getErrorMessage } from '../utils/errorMessage';
import type { TopupStatusResponse } from '../types';

const formatVND = (n: number) => n.toLocaleString('vi-VN');

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // ~30s tổng

const TopUpResult: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<TopupStatusResponse | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = params.get('vnp_TxnRef');
  const vnpResponseCode = params.get('vnp_ResponseCode');

  useEffect(() => {
    if (!requestId) {
      setError('Thiếu mã giao dịch');
      setPolling(false);
      return;
    }

    let attempts = 0;
    let timer: number | undefined;

    const fetchStatus = async () => {
      try {
        const data = await transactionApi.getTopupStatus(requestId);
        setStatus(data);
        // Dừng poll khi đã có kết quả final (SUCCESS / FAILED / CANCELLED)
        if (data.status === 'SUCCESS' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          setPolling(false);
          return;
        }
        attempts += 1;
        if (attempts >= POLL_MAX_ATTEMPTS) {
          setPolling(false);
          return;
        }
        timer = window.setTimeout(fetchStatus, POLL_INTERVAL_MS);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể kiểm tra trạng thái giao dịch'));
        setPolling(false);
      }
    };
    fetchStatus();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [requestId]);


  const earlyCancelled = vnpResponseCode === '24';
  const earlyFailed = vnpResponseCode != null && vnpResponseCode !== '00' && !earlyCancelled;

  return (
    <div className="max-w-xl mx-auto pt-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Kết quả nạp tiền</h1>
      <p className="text-sm text-slate-500 mb-6">Cập nhật từ VNPay</p>

      <div className="bg-white rounded-2xl border border-slate-100 p-8">
        {error ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">Đã xảy ra lỗi</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : status?.status === 'SUCCESS' ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 text-lg">Nạp tiền thành công</p>
            <p className="text-3xl font-bold text-emerald-600">+{formatVND(Number(status.amount))} đ</p>
            <p className="text-xs text-slate-400 font-mono break-all">{status.requestId}</p>
          </div>
        ) : status?.status === 'CANCELLED' || earlyCancelled ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">Đã hủy giao dịch</p>
            <p className="text-sm text-slate-500">
              {status?.message ?? 'Bạn đã hủy giao dịch nạp tiền trên VNPay.'}
            </p>
            <p className="text-xs text-slate-400">Nếu muốn nạp lại, vui lòng quay về trang Nạp tiền.</p>
          </div>
        ) : status?.status === 'FAILED' || earlyFailed ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">Nạp tiền thất bại</p>
            <p className="text-sm text-slate-500">
              {status?.message ?? 'Giao dịch bị từ chối.'}
            </p>
            {vnpResponseCode && (
              <p className="text-xs text-slate-400">VNPay code: {vnpResponseCode}</p>
            )}
          </div>
        ) : (
          <div className="text-center space-y-3">
            <span className="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="font-semibold text-slate-700">Đang chờ xác nhận từ VNPay...</p>
            <p className="text-xs text-slate-500">
              {polling
                ? 'Quá trình này có thể mất vài giây. Vui lòng không đóng trang.'
                : 'Hệ thống chưa nhận được xác nhận. Vui lòng kiểm tra Lịch sử giao dịch sau ít phút.'}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            to="/transactions"
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm text-center hover:bg-slate-50 transition-colors"
          >
            Lịch sử giao dịch
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm text-center transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopUpResult;
