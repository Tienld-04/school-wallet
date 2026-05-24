import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import merchantApi from '../api/merchantApi';
import type { MerchantResponse } from '../types';

const typeLabels: Record<string, string> = {
  CANTEEN:   'Căng tin',
  PARKING:   'Bãi gửi xe',
  PRINTING:  'Dịch vụ in ấn',
  LIBRARY:   'Thư viện',
  BOOKSTORE: 'Nhà sách',
  CLUB:      'Câu lạc bộ',
  EVENT:     'Sự kiện',
  OTHER:     'Khác',
};

const typeColors: Record<string, { bg: string; text: string }> = {
  CANTEEN:   { bg: 'bg-orange-50',  text: 'text-orange-600' },
  PARKING:   { bg: 'bg-blue-50',    text: 'text-blue-600' },
  PRINTING:  { bg: 'bg-violet-50',  text: 'text-violet-600' },
  LIBRARY:   { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  BOOKSTORE: { bg: 'bg-pink-50',    text: 'text-pink-600' },
  CLUB:      { bg: 'bg-cyan-50',    text: 'text-cyan-600' },
  EVENT:     { bg: 'bg-amber-50',   text: 'text-amber-600' },
  OTHER:     { bg: 'bg-slate-50',   text: 'text-slate-600' },
};

const MyMerchants: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    merchantApi.getMyMerchants()
      .then(setMerchants)
      .catch(() => toast.error('Không thể tải danh sách dịch vụ'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dịch vụ của tôi</h1>
        <p className="text-sm text-slate-500">Danh sách dịch vụ bạn đang sở hữu</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium text-sm">Bạn chưa sở hữu dịch vụ nào</p>
          <p className="text-slate-400 text-xs mt-1">Liên hệ quản trị viên để được cấp quyền</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {merchants.map((m) => {
            const color = typeColors[m.type] ?? typeColors.OTHER;
            return (
              <div
                key={m.merchantId}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-[0.9375rem] font-semibold text-slate-900 leading-snug">{m.name}</p>
                  <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {m.active ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </div>

                <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${color.bg} ${color.text}`}>
                  {typeLabels[m.type] ?? m.type}
                </span>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                  <span>Ngày tạo</span>
                  <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && merchants.length > 0 && (
        <p className="text-xs text-slate-400 mt-5 text-center">
          {merchants.length} dịch vụ đang sở hữu
        </p>
      )}
    </div>
  );
};

export default MyMerchants;
