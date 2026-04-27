import React, { useCallback, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import userApi from '../../api/userApi';
import type { QrVerifyResponse } from '../../types';
import QrScanner from './QrScanner';
import MyQrCard from './MyQrCard';

const FILE_CONTAINER_ID = 'qr-file-scanner-hidden';

interface Props {
  open: boolean;
  onClose: () => void;
  onVerified: (data: QrVerifyResponse) => void;
}

type Tab = 'scan' | 'my';

const QrTransferScreen: React.FC<Props> = ({ open, onClose, onVerified }) => {
  const [tab, setTab] = useState<Tab>('scan');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = useCallback(
    async (qrContent: string) => {
      if (processing) return;
      setProcessing(true);
      try {
        const data = await userApi.verifyQr(qrContent);
        onVerified(data);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Mã QR không hợp lệ';
        toast.error(msg);
        setProcessing(false);
      }
    },
    [processing, onVerified]
  );

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5MB)');
      return;
    }

    setProcessing(true);
    let html5QrCode: Html5Qrcode | null = null;
    try {
      html5QrCode = new Html5Qrcode(FILE_CONTAINER_ID, { verbose: false });
      const text = await html5QrCode.scanFile(file, false);
      await handleVerify(text);
    } catch {
      toast.error('Không tìm thấy mã QR trong ảnh');
      setProcessing(false);
    } finally {
      if (html5QrCode) {
        try {
          html5QrCode.clear();
        } catch {
          /* ignore */
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 text-white">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Đóng"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <p className="font-semibold text-base">{tab === 'scan' ? 'Quét mã QR' : 'QR của bạn'}</p>
        <div className="w-9" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 overflow-y-auto">
        {tab === 'scan' ? (
          <div className="w-full flex flex-col items-center">
            <QrScanner active={open && tab === 'scan' && !processing} onScan={handleVerify} />
            <p className="mt-5 text-white/70 text-sm text-center">
              Đưa mã QR vào khung hình để quét
            </p>
            {processing && (
              <p className="mt-2 text-primary-300 text-sm flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-300/40 border-t-primary-300 rounded-full animate-spin" />
                Đang xác thực mã QR…
              </p>
            )}
          </div>
        ) : (
          <MyQrCard />
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-slate-800/80 backdrop-blur border-t border-white/5 px-2 py-2.5 grid grid-cols-3 gap-1">
        {/* Quét QR — tab */}
        <button
          onClick={() => setTab('scan')}
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
            tab === 'scan' ? 'text-primary-300' : 'text-white/60 hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h2v2h-2z" />
            <path d="M18 14h3" />
            <path d="M14 18v3" />
            <path d="M18 18h3v3h-3z" />
          </svg>
          <span className="text-[11px] font-medium">Quét QR</span>
        </button>

        {/* Tải ảnh — action */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-white/60 hover:text-white disabled:opacity-50 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[11px] font-medium">Tải ảnh</span>
        </button>

        {/* QR của bạn — tab */}
        <button
          onClick={() => setTab('my')}
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
            tab === 'my' ? 'text-primary-300' : 'text-white/60 hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[11px] font-medium">QR của bạn</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
      />
      {/* Hidden container for scanFile (lib needs a DOM element) */}
      <div id={FILE_CONTAINER_ID} className="hidden" />
    </div>
  );
};

export default QrTransferScreen;
