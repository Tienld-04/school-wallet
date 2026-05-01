import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import merchantApi from '../../api/merchantApi';
import Pagination from '../../components/common/Pagination/Pagination';
import type { MerchantResponse, MerchantType, MerchantRequest } from '../../types';

const MerchantManagement: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [types, setTypes] = useState<MerchantType[]>([]);
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MerchantRequest>({ name: '', type: '', userPhone: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMerchants(page, size, filterType || undefined, search || undefined);
      setMerchants(data.content || []);
      setTotalPages(data.page?.totalPages || 0);
      setTotalElements(data.page?.totalElements || 0);
    } catch {
      toast.error('Không thể tải danh sách merchant');
    } finally {
      setLoading(false);
    }
  }, [page, size, filterType, search]);

  useEffect(() => {
    merchantApi.getTypes().then(setTypes).catch(() => {});
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const getTypeDesc = (code: string) => types.find((t) => t.code === code)?.description || code;

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', type: '', userPhone: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (m: MerchantResponse) => {
    setEditingId(m.merchantId);
    setForm({ name: m.name, type: m.type, userPhone: m.userPhone });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Tên không được trống';
    if (!form.type) errors.type = 'Vui lòng chọn loại';
    if (!form.userPhone.trim()) errors.userPhone = 'Số điện thoại không được trống';
    else if (!/^\d{10}$/.test(form.userPhone)) errors.userPhone = 'Số điện thoại phải có đúng 10 chữ số';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await adminApi.updateMerchant(editingId, form);
        toast.success('Cập nhật merchant thành công');
      } else {
        await adminApi.createMerchant(form);
        toast.success('Tạo merchant thành công');
      }
      setShowModal(false);
      fetchMerchants();
    } catch {
      toast.error(editingId ? 'Cập nhật thất bại' : 'Tạo merchant thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (merchantId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa merchant này?')) return;
    setDeleting(merchantId);
    try {
      await adminApi.deleteMerchant(merchantId);
      toast.success('Xóa merchant thành công');
      fetchMerchants();
    } catch {
      toast.error('Xóa merchant thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const inputClass = (hasError: boolean) =>
    `w-full py-2.5 px-3.5 bg-white border-[1.5px] rounded-[10px] text-slate-800 text-sm outline-none transition-all focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/12 ${hasError ? 'border-red-500' : 'border-slate-200'}`;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Merchant</h1>
          <p className="text-sm text-slate-500">Quản lý các đơn vị cung cấp dịch vụ</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm merchant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm merchant..."
            className="w-full py-2.5 pl-10 pr-4 bg-white border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/12 transition-all"
          />
        </form>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className="py-2.5 px-4 bg-white border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-primary-400 transition-all cursor-pointer"
        >
          <option value="">Tất cả loại</option>
          {types.map((t) => (
            <option key={t.code} value={t.code}>{t.description}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Không tìm thấy merchant nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Tên</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Loại</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Trạng thái</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Ngày tạo</th>
                  <th className="text-center px-6 py-3.5 font-semibold text-slate-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {merchants.map((m) => (
                  <tr key={m.merchantId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{m.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                        {getTypeDesc(m.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {m.active ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(m.merchantId)}
                          disabled={deleting === m.merchantId}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
                        >
                          {deleting === m.merchantId ? '...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && merchants.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 flex-wrap gap-3">
            <p className="text-xs text-slate-500">Tổng {totalElements} merchant</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-5">
              {editingId ? 'Cập nhật merchant' : 'Thêm merchant mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Tên merchant</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormErrors((fe) => ({ ...fe, name: '' })); }}
                  placeholder="Nhập tên merchant"
                  className={inputClass(!!formErrors.name)}
                />
                {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Loại</label>
                <select
                  value={form.type}
                  onChange={(e) => { setForm((f) => ({ ...f, type: e.target.value })); setFormErrors((fe) => ({ ...fe, type: '' })); }}
                  className={inputClass(!!formErrors.type)}
                >
                  <option value="">Chọn loại</option>
                  {types.map((t) => (
                    <option key={t.code} value={t.code}>{t.description}</option>
                  ))}
                </select>
                {formErrors.type && <span className="text-xs text-red-500">{formErrors.type}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Số điện thoại (chủ merchant)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.userPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setForm((f) => ({ ...f, userPhone: digits }));
                    setFormErrors((fe) => ({ ...fe, userPhone: '' }));
                  }}
                  placeholder="Nhập số điện thoại (10 chữ số)"
                  className={inputClass(!!formErrors.userPhone)}
                />
                {formErrors.userPhone && <span className="text-xs text-red-500">{formErrors.userPhone}</span>}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 disabled:opacity-55 transition-all"
                >
                  {submitting ? '...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantManagement;
