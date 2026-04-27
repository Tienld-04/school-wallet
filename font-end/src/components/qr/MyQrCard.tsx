import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import userApi from '../../api/userApi';

type Mode = 'static' | 'dynamic';

interface ParsedQr {
  type: 'SCHOOL_WALLET_STATIC' | 'SCHOOL_WALLET_DYNAMIC';
  phone: string;
  name: string;
  amount?: string;
  description?: string;
  expiredAt?: number;
}

const formatVND = (raw: string) =>
  raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

const parseQr = (content: string): ParsedQr | null => {
  try {
    return JSON.parse(content) as ParsedQr;
  } catch {
    return null;
  }
};

const MyQrCard: React.FC = () => {
  const [mode, setMode] = useState<Mode>('static');

  // Static
  const [staticContent, setStaticContent] = useState<string | null>(null);
  const [loadingStatic, setLoadingStatic] = useState(false);

  // Dynamic
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dynamicContent, setDynamicContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Load Static QR khi vào tab static lần đầu
  useEffect(() => {
    if (mode !== 'static' || staticContent || loadingStatic) return;
    setLoadingStatic(true);
    userApi
      .getMyQr()
      .then((data) => setStaticContent(data.qrContent))
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể tạo mã QR';
        toast.error(msg);
      })
      .finally(() => setLoadingStatic(false));
  }, [mode, staticContent, loadingStatic]);

  // Tick mỗi giây để update countdown
  useEffect(() => {
    if (mode !== 'dynamic' || !dynamicContent) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode, dynamicContent]);

  const handleGenerateDynamic = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1000) {
      toast.error('Số tiền tối thiểu là 1.000đ');
      return;
    }
    setGenerating(true);
    try {
      const data = await userApi.getDynamicQr({
        amount: amt,
        description: description.trim() || undefined,
      });
      setDynamicContent(data.qrContent);
      setNow(Date.now());
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tạo mã QR động';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleResetDynamic = () => {
    setDynamicContent(null);
    setAmount('');
    setDescription('');
  };

  const parsedStatic = useMemo(() => (staticContent ? parseQr(staticContent) : null), [staticContent]);
  const parsedDynamic = useMemo(() => (dynamicContent ? parseQr(dynamicContent) : null), [dynamicContent]);

  const remainingMs = parsedDynamic?.expiredAt ? parsedDynamic.expiredAt - now : 0;
  const expired = parsedDynamic ? remainingMs <= 0 : false;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Mode toggle: QR Tĩnh / QR Động */}
      <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-1 mb-5">
        {(['static', 'dynamic'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === m ? 'bg-white text-primary-700 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            {m === 'static' ? 'QR cá nhân' : 'Yêu cầu số tiền'}
          </button>
        ))}
      </div>

      {/* STATIC */}
      {mode === 'static' && (
        <div className="w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          {loadingStatic && !staticContent && (
            <div className="w-64 h-64 flex items-center justify-center">
              <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}
          {staticContent && (
            <>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <QRCodeSVG value={staticContent} size={224} level="M" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{parsedStatic?.name ?? '—'}</p>
              <p className="text-sm text-slate-500">{parsedStatic?.phone ?? ''}</p>
              <p className="mt-3 text-xs text-slate-400 text-center">
                Người gửi quét QR và tự nhập số tiền chuyển
              </p>
            </>
          )}
        </div>
      )}

      {/* DYNAMIC */}
      {mode === 'dynamic' && !dynamicContent && (
        <div className="w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatVND(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full px-4 py-3 pr-14 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 text-base font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">VND</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung</label>
            <input
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung hiển thị cho người gửi"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 text-sm"
            />
          </div>

          <button
            onClick={handleGenerateDynamic}
            disabled={generating || !amount || parseInt(amount) < 1000}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang tạo…
              </>
            ) : (
              'Tạo mã QR'
            )}
          </button>

          <p className="text-xs text-slate-400 text-center">Yêu cầu sẽ hết hạn sau 5 phút</p>
        </div>
      )}

      {mode === 'dynamic' && dynamicContent && parsedDynamic && (
        <div className="w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          <div className={`p-3 bg-white rounded-xl border ${expired ? 'border-red-200 opacity-50' : 'border-slate-100'}`}>
            <QRCodeSVG value={dynamicContent} size={208} level="M" />
          </div>

          <p className="mt-4 text-base font-semibold text-slate-900">{parsedDynamic.name}</p>
          <p className="text-sm text-slate-500">{parsedDynamic.phone}</p>

          <div className="mt-3 px-4 py-2 bg-primary-50 rounded-xl">
            <p className="text-xl font-bold text-primary-700">
              {formatVND(parsedDynamic.amount ?? '0')} <span className="text-sm font-medium">VND</span>
            </p>
          </div>

          {parsedDynamic.description && (
            <p className="mt-2 text-xs text-slate-500 italic max-w-xs text-center truncate">
              "{parsedDynamic.description}"
            </p>
          )}

          {/* Countdown */}
          <div
            className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
              expired ? 'text-red-500' : remainingMs < 60000 ? 'text-amber-600' : 'text-slate-500'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {expired ? 'Đã hết hạn' : `Còn lại ${minutes}:${String(seconds).padStart(2, '0')}`}
          </div>

          <button
            onClick={handleResetDynamic}
            className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Tạo mã mới
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQrCard;
