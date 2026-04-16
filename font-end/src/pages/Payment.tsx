import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import merchantApi from '../api/merchantApi';
import type { MerchantType, MerchantListResponse } from '../types';

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
  }, [fetchMerchants]);

  const handleFilterType = (code: string) => {
    const newType = selectedType === code ? '' : code;
    setSelectedType(newType);
    fetchMerchants(newType);
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
    </div>
  );
};

export default Payment;
