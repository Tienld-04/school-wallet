import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import transactionApi from '../api/transactionApi';
import { getErrorMessage } from '../utils/errorMessage';

const formatVND = (raw: string) =>
  raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const BANK_OPTIONS = [
  { code: '', label: 'VNPay Options' },
  { code: 'NCB', label: 'Ngân hàng NCB' },
  { code: 'VNBANK', label: 'Thẻ ATM nội địa' },
  { code: 'INTCARD', label: 'Thẻ Visa/Master/JCB' },
];

const newRequestId = () => crypto.randomUUID().replace(/-/g, '');

const TopUp: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string>(newRequestId());

  const handleSubmit = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    if (amt > 100000000) {
      toast.error('Số tiền nạp tối đa là 100.000.000đ');
      return;
    }
    setSubmitting(true);
    try {
      const data = await transactionApi.initiateTopup({
        requestId: requestIdRef.current,
        amount: amt,
        bankCode: bankCode || undefined,
        language: 'vn',
      });
      // Redirect cứng sang trang VNPay; user thanh toán xong sẽ được VNPay redirect về /top-up/result
      window.location.href = data.paymentUrl;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể khởi tạo thanh toán VNPay'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Nạp tiền</h1>
      <p className="text-sm text-slate-500 mb-8">Nạp tiền vào ví School Wallet qua VNPay</p>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        {/* Số tiền */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền cần nạp</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatVND(amount)}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 pr-14 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-base font-medium"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">VND</span>
          </div>
          {amount && parseInt(amount) >= 10000 && (
            <p className="text-xs text-slate-400 mt-1.5 pl-1">
              = <span className="text-primary-600 font-medium">{formatVND(amount)} đồng</span>
            </p>
          )}
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Chọn nhanh</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${parseInt(amount) === amt
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-primary-50'
                  }`}
              >
                {formatVND(String(amt))}
              </button>
            ))}
          </div>
        </div>

        {/* Bank selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phương thức thanh toán</label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-sm bg-white"
          >
            {BANK_OPTIONS.map((b) => (
              <option key={b.code} value={b.code}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Sandbox test info */}
        {/* <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Tài khoản test VNPay (sandbox NCB)</p>
          <p>Số thẻ: <span className="font-mono">9704 1985 2619 1432 198</span></p>
          <p>Tên: NGUYEN VAN A · Phát hành: 07/15 · OTP: <span className="font-mono">123456</span></p>
        </div> */}

        <button
          onClick={handleSubmit}
          disabled={submitting || !amount || parseInt(amount) < 10000}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Đang chuyển sang VNPay...
            </>
          ) : (
            'Tiếp tục với VNPay'
          )}
        </button>
      </div>
    </div>
  );
};

export default TopUp;
