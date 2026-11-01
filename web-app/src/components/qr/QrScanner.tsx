import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface Props {
  active: boolean;
  onScan: (text: string) => void;
}

const QrScanner: React.FC<Props> = ({ active, onScan }) => {
  const reactId = useId();
  const containerId = `qr-reader-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const html5QrCode = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = html5QrCode;
    scannedRef.current = false;
    setError(null);
    setStarting(true);

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          onScan(decodedText);
        },
        () => {
          /* ignore per-frame decode errors */
        }
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/Permission|NotAllowed/i.test(msg)) {
          setError('Vui lòng cấp quyền truy cập camera để quét mã QR');
        } else if (/NotFound|no camera/i.test(msg)) {
          setError('Không tìm thấy camera trên thiết bị');
        } else {
          setError('Không thể khởi động camera. Vui lòng thử lại');
        }
        setStarting(false);
      });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
        } else {
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    };
  }, [active, containerId, onScan]);

  return (
    <div className="relative w-full max-w-sm aspect-square mx-auto">
      {/* video container — html5-qrcode injects <video> here */}
      <div
        id={containerId}
        className="w-full h-full overflow-hidden rounded-2xl bg-black [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
      />

      {/* Loading overlay */}
      {starting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-black/40 rounded-2xl">
          <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="mt-3 text-sm">Đang khởi động camera…</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-black/70 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <p className="text-white text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Viewfinder corners + scan line (decorative) */}
      {!starting && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative w-[60%] h-[60%] overflow-hidden">
            {/* corners */}
            <span className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <span className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <span className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-white rounded-bl-xl" />
            <span className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-white rounded-br-xl" />
            {/* scan line */}
            <div className="absolute inset-x-2 top-0 animate-qr-scan-line">
              <div className="h-0.5 bg-primary-400 rounded-full shadow-[0_0_14px_rgba(129,140,248,0.9)]" />
              <div className="h-12 -mt-12 bg-gradient-to-b from-primary-400/40 to-transparent" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
