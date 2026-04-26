import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import userApi from '../api/userApi';
import transactionApi from '../api/transactionApi';
import type { RecipientResponse } from '../types';

type Step = 'method' | 'phone' | 'details' | 'pin';

const formatVND = (raw: string) =>
  raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

const Transfer: React.FC = () => {
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState<RecipientResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const reset = () => {
    setStep('method');
    setPhone('');
    setRecipient(null);
    setAmount('');
    setDescription('');
    setPin(['', '', '', '', '', '']);
  };

  const handleSearchRecipient = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Số điện thoại phải có đúng 10 chữ số');
      return;
    }
    setSearching(true);
    try {
      const data = await userApi.getRecipientByPhone(phone);
      setRecipient(data);
      setStep('details');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không tìm thấy tài khoản';
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1000) {
      toast.error('Số tiền tối thiểu là 1.000đ');
      return;
    }
    setPin(['', '', '', '', '', '']);
    setStep('pin');
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinStr = pin.join('');
    if (pinStr.length < 6) {
      toast.error('Vui lòng nhập đủ 6 số PIN');
      return;
    }
    setSubmitting(true);
    try {
      await transactionApi.transfer({
        requestId: crypto.randomUUID(),
        toPhoneNumber: phone,
        amount: parseInt(amount),
        description: description.trim() || 'Chuyển tiền',
        pin: pinStr,
      });
      toast.success('Chuyển tiền thành công!');
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Chuyển tiền thất bại';
      toast.error(msg);
      setPin(['', '', '', '', '', '']);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Chuyển khoản</h1>
      <p className="text-sm text-slate-500 mb-8">Chuyển tiền đến tài khoản khác trong hệ thống</p>

      {/* ── STEP: chọn phương thức ── */}
      {step === 'method' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-sm font-medium text-slate-600 mb-5">Chọn phương thức chuyển tiền</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Quét QR — chưa có */}
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 select-none">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h2v2h-2z" />
                  <path d="M18 14h3" />
                  <path d="M14 18v3" />
                  <path d="M18 18h3v3h-3z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Quét mã QR</p>
                <p className="text-xs mt-0.5 text-slate-400">Sắp ra mắt</p>
              </div>
            </div>

            {/* Nhập số tài khoản */}
            <button
              onClick={() => setStep('phone')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 hover:border-primary-400 transition-all duration-200 text-primary-700 cursor-pointer group"
            >
              <div className="w-14 h-14 bg-primary-100 group-hover:bg-primary-200 rounded-2xl flex items-center justify-center transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Nhập số tài khoản</p>
                <p className="text-xs mt-0.5 text-primary-500">Nhập số điện thoại</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: nhập số điện thoại ── */}
      {step === 'phone' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <button
            onClick={() => setStep('method')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại
          </button>

          <p className="text-base font-semibold text-slate-800 mb-1">Nhập số điện thoại người nhận</p>
          <p className="text-sm text-slate-400 mb-5">Số điện thoại là số tài khoản trong hệ thống</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchRecipient()}
                placeholder="Nhập số điện thoại (10 số)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-base"
              />
            </div>

            <button
              onClick={handleSearchRecipient}
              disabled={searching || phone.length !== 10}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang tìm kiếm...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Tìm tài khoản
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: xác nhận thông tin & nhập số tiền ── */}
      {step === 'details' && recipient && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <button
            onClick={() => { setStep('phone'); setRecipient(null); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại
          </button>

          {/* Thông tin người nhận */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
              {recipient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-base">{recipient.fullName}</p>
              <p className="text-sm text-slate-500 mt-0.5">{recipient.phone}</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs bg-secondary-100 text-secondary-700 px-2.5 py-1 rounded-full font-medium">Đã xác minh</span>
            </div>
          </div>

          {/* Số tiền */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền chuyển</label>
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
            {amount && parseInt(amount) >= 1000 && (
              <p className="text-xs text-slate-400 mt-1.5 pl-1">
                = <span className="text-primary-600 font-medium">{formatVND(amount)} đồng</span>
              </p>
            )}
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung chuyển tiền</label>
            <input
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chuyển tiền (không bắt buộc)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition text-sm"
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!amount || parseInt(amount) < 1000}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-all duration-200"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* ── STEP: nhập mã PIN (overlay) ── */}
      {step === 'pin' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Header gradient */}
            <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 px-6 pt-8 pb-10 text-center relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl tracking-tight">Xác nhận giao dịch</h3>
              <p className="text-primary-200 text-sm mt-1">Nhập mã PIN 6 số của bạn</p>
              {/* Wave */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-white rounded-t-[2rem]" />
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Tóm tắt giao dịch */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Người nhận</span>
                  <span className="font-semibold text-slate-800">{recipient?.fullName}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Số tiền</span>
                  <span className="font-bold text-primary-600 text-lg">{formatVND(amount)}<span className="text-sm font-medium ml-1">VND</span></span>
                </div>
                {description && (
                  <>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Nội dung</span>
                      <span className="font-medium text-slate-700 text-right max-w-[160px] truncate">{description}</span>
                    </div>
                  </>
                )}
              </div>

              {/* PIN circles */}
              <div>
                <p className="text-xs text-slate-400 text-center mb-5 uppercase tracking-widest font-semibold">Mã PIN</p>
                <div className="flex justify-center gap-3">
                  {pin.map((digit, i) => (
                    <div key={i} className="relative w-11 h-11 group">
                      {/* invisible input captures keyboard */}
                      <input
                        ref={(el) => { pinRefs.current[i] = el; }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(i, e)}
                        className="absolute inset-0 opacity-0 cursor-default w-full h-full"
                      />
                      {/* visual circle */}
                      <div className={`w-full h-full rounded-full border-2 flex items-center justify-center pointer-events-none
                        transition-all duration-200
                        group-focus-within:ring-4 group-focus-within:ring-primary-200 group-focus-within:scale-110
                        ${digit
                          ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-500/40 scale-105'
                          : 'bg-white border-slate-200 group-focus-within:border-primary-400 group-focus-within:bg-primary-50'
                        }`}
                      >
                        {digit && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep('details'); setPin(['', '', '', '', '', '']); }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || pin.join('').length < 6}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-semibold text-sm shadow-md shadow-primary-500/30 disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
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

export default Transfer;
