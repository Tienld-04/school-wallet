import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import merchantApi from '../api/merchantApi';
import transactionApi from '../api/transactionApi';
import walletApi from '../api/walletApi';
import { getErrorMessage } from '../utils/errorMessage';
import type { MerchantType, MerchantListResponse } from '../types';

type PaymentStep = 'details' | 'pin';

const formatVND = (raw: string) =>
  raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

interface ParkingBracket {
  fee: number;
  label: string;
}

/**
 * Phí bãi gửi xe theo giờ: ban ngày (6-18h) 3k, tối (18-22h) 5k, đêm (22-6h) 10k.
 * Tính ở FE để giữ scope nhỏ — đây là project học tập, BE không cần policy pricing.
 */
const computeParkingFee = (date: Date = new Date()): ParkingBracket => {
  const h = date.getHours();
  if (h >= 6 && h < 18) return { fee: 3000, label: 'Ban ngày (06:00 – 18:00)' };
  if (h >= 18 && h < 22) return { fee: 5000, label: 'Buổi tối (18:00 – 22:00)' };
  return { fee: 10000, label: 'Đêm khuya (22:00 – 06:00)' };
};

const typeIcons: Record<string, React.ReactNode> = {
  CANTEEN: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  PARKING: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  ),
  PRINTING: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  LIBRARY: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  BOOKSTORE: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  CLUB: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  EVENT: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  OTHER: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  CANTEEN:   { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200' },
  PARKING:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200' },
  PRINTING:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200' },
  LIBRARY:   { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  BOOKSTORE: { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200' },
  CLUB:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200' },
  EVENT:     { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200' },
  OTHER:     { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200' },
};

const defaultColor = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

const Payment: React.FC = () => {
  const [types, setTypes] = useState<MerchantType[]>([]);
  const [merchants, setMerchants] = useState<MerchantListResponse[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [activeMerchant, setActiveMerchant] = useState<MerchantListResponse | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('details');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [parkingBracket, setParkingBracket] = useState<ParkingBracket | null>(null);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchMerchants = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const data = await merchantApi.getList(type || undefined);
      setMerchants(data);
    } catch {
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(() => {
    walletApi.getMyBalance()
      .then((data) => setBalance(data.balance))
      .catch(() => {
        // Fail mở: BE vẫn check khi submit
      });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const typesData = await merchantApi.getTypes();
        setTypes(typesData);
      } catch {
        toast.error('Không thể tải danh mục dịch vụ');
      }
      fetchMerchants();
    };
    init();
    fetchBalance();
  }, [fetchMerchants, fetchBalance]);

  const handleFilterType = (code: string) => {
    const newType = selectedType === code ? '' : code;
    setSelectedType(newType);
    fetchMerchants(newType);
  };

  const closeModal = () => {
    setActiveMerchant(null);
    setPaymentStep('details');
    setAmount('');
    setDescription('');
    setPin(['', '', '', '', '', '']);
    setParkingBracket(null);
  };

  const handleMerchantClick = (m: MerchantListResponse) => {
    setActiveMerchant(m);
    setPaymentStep('details');
    setPin(['', '', '', '', '', '']);
    if (m.type === 'PARKING') {
      const bracket = computeParkingFee();
      setParkingBracket(bracket);
      setAmount(String(bracket.fee));
      setDescription(`Phí gửi xe ${bracket.label}`);
    } else {
      setParkingBracket(null);
      setAmount('');
      setDescription('');
    }
  };

  const handleConfirm = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1000) {
      toast.error('Số tiền tối thiểu là 1.000đ');
      return;
    }
    if (balance != null && amt > balance) {
      toast.error('Số dư không đủ');
      return;
    }
    setPin(['', '', '', '', '', '']);
    setPaymentStep('pin');
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    if (value && index < 5) pinRefs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!activeMerchant) return;
    const pinStr = pin.join('');
    if (pinStr.length < 6) {
      toast.error('Vui lòng nhập đủ 6 số PIN');
      return;
    }
    setSubmitting(true);
    try {
      await transactionApi.merchantPayment({
        requestId: crypto.randomUUID(),
        merchantId: activeMerchant.merchantId,
        merchantName: activeMerchant.name,
        merchantPhone: activeMerchant.userPhone,
        amount: parseInt(amount),
        description: description.trim() || undefined,
        pin: pinStr,
      });
      toast.success('Thanh toán thành công!');
      closeModal();
      fetchBalance();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Thanh toán thất bại'));
      setPin(['', '', '', '', '', '']);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeDesc = (code: string) =>
    types.find((t) => t.code === code)?.description || code;

  const filtered = merchants;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Thanh toán dịch vụ</h1>
      <p className="text-sm text-slate-500 mb-8">Chọn dịch vụ bạn muốn thanh toán</p>

      {/* Filter by type */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Danh mục dịch vụ</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedType(''); fetchMerchants(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              selectedType === ''
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          {types.map((t) => {
            const color = typeColors[t.code] || defaultColor;
            const isActive = selectedType === t.code;
            return (
              <button
                key={t.code}
                onClick={() => handleFilterType(t.code)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  isActive
                    ? `${color.bg} ${color.text} ${color.border} shadow-sm ring-1 ring-current/10`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t.description}
              </button>
            );
          })}
        </div>
      </div>

      {/* Merchant list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">Không tìm thấy dịch vụ nào</p>
            <p className="text-slate-400 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((m) => {
            const color = typeColors[m.type] || defaultColor;
            return (
              <div
                key={m.merchantId}
                onClick={() => handleMerchantClick(m)}
                className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${color.bg} ${color.text} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                    {typeIcons[m.type] || typeIcons.OTHER}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                      {m.name}
                    </p>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${color.bg} ${color.text}`}>
                      {getTypeDesc(m.type)}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="text-slate-300 group-hover:text-primary-500 transition-colors mt-1 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-4 text-center">
          Hiển thị {filtered.length} dịch vụ{selectedType && ` trong "${getTypeDesc(selectedType)}"`}
        </p>
      )}

      {/* ── Payment modal — step: details ── */}
      {activeMerchant && paymentStep === 'details' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <p className="font-semibold text-slate-900">Thanh toán dịch vụ</p>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Đóng"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Merchant info */}
              {(() => {
                const color = typeColors[activeMerchant.type] || defaultColor;
                return (
                  <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-12 h-12 ${color.bg} ${color.text} rounded-xl flex items-center justify-center shrink-0`}>
                      {typeIcons[activeMerchant.type] || typeIcons.OTHER}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{activeMerchant.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{getTypeDesc(activeMerchant.type)}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Số tiền — auto cho PARKING, free input cho loại khác */}
              {activeMerchant.type === 'PARKING' && parkingBracket ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phí gửi xe</label>
                  <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3.5">
                    <p className="text-2xl font-bold text-primary-700">
                      {formatVND(String(parkingBracket.fee))}
                      <span className="text-sm font-medium ml-1.5 text-primary-500">VND</span>
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      <svg className="inline" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>{' '}
                      {parkingBracket.label}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền thanh toán</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={formatVND(amount)}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full px-4 py-3 pr-14 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-base font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">VND</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 pl-1">Số tiền tối thiểu là 1.000đ</p>
                </div>
              )}

              {/* Nội dung */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung</label>
                <input
                  type="text"
                  maxLength={255}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú (không bắt buộc)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!amount || parseInt(amount) < 1000}
                  className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-all duration-200"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal — step: pin ── */}
      {activeMerchant && paymentStep === 'pin' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white w-full max-w-sm shadow-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl pb-[env(safe-area-inset-bottom)]">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 px-5 pt-6 pb-8 text-center relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg tracking-tight">Xác nhận thanh toán</h3>
              <p className="text-primary-200 text-xs mt-0.5">Nhập mã PIN 6 số của bạn</p>
              <div className="absolute bottom-0 left-0 right-0 h-5 bg-white rounded-t-[1.75rem]" />
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Tóm tắt */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-sm">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-slate-400 shrink-0">Dịch vụ</span>
                  <span className="font-semibold text-slate-800 truncate">{activeMerchant.name}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-slate-400 shrink-0">Số tiền</span>
                  <span className="font-bold text-primary-600 text-base">
                    {formatVND(amount)}
                    <span className="text-xs font-medium ml-1">VND</span>
                  </span>
                </div>
                {description && (
                  <>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-400 shrink-0">Nội dung</span>
                      <span className="font-medium text-slate-700 text-right truncate">{description}</span>
                    </div>
                  </>
                )}
              </div>

              {/* PIN */}
              <div>
                <p className="text-[11px] text-slate-400 text-center mb-3 uppercase tracking-widest font-semibold">Mã PIN</p>
                <div className="flex justify-center gap-2.5">
                  {pin.map((digit, i) => (
                    <div key={i} className="relative w-10 h-10 sm:w-11 sm:h-11 group">
                      <input
                        ref={(el) => { pinRefs.current[i] = el; }}
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(i, e)}
                        style={{ fontSize: '16px' }}
                        className="absolute inset-0 opacity-0 cursor-default w-full h-full"
                      />
                      <div className={`w-full h-full rounded-full border-2 flex items-center justify-center pointer-events-none
                        transition-all duration-200
                        group-focus-within:ring-4 group-focus-within:ring-primary-200 group-focus-within:scale-110
                        ${digit
                          ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-500/40 scale-105'
                          : 'bg-white border-slate-200 group-focus-within:border-primary-400 group-focus-within:bg-primary-50'
                        }`}
                      >
                        {digit && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => { setPaymentStep('details'); setPin(['', '', '', '', '', '']); }}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || pin.join('').length < 6}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-semibold text-sm shadow-md shadow-primary-500/30 disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
