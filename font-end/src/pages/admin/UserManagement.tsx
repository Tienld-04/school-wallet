import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination/Pagination';
import { getErrorMessage } from '../../utils/errorMessage';
import type { UsersResponse } from '../../types';

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  LOCKED: { bg: 'bg-red-50', text: 'text-red-700' },
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  USER: 'Người dùng',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khóa',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UsersResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  // Reset PIN modal state
  const [resetTarget, setResetTarget] = useState<UsersResponse | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, 10, filterStatus || undefined, search || undefined);
      setUsers(data.content);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements);
    } catch {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    setToggling(userId);
    try {
      await adminApi.toggleUserStatus(userId);
      toast.success('Cập nhật trạng thái thành công');
      fetchUsers();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setToggling(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const openResetPin = (user: UsersResponse) => {
    setResetTarget(user);
    setNewPin('');
    setConfirmPin('');
  };

  const closeResetPin = () => {
    if (submittingPin) return;
    setResetTarget(null);
    setNewPin('');
    setConfirmPin('');
  };

  const handleResetPin = async () => {
    if (!resetTarget) return;
    if (!/^\d{6}$/.test(newPin)) {
      toast.error('Mã OTP phải gồm 6 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('Mã OTP xác nhận không khớp');
      return;
    }
    setSubmittingPin(true);
    try {
      await adminApi.resetPin(resetTarget.phone, newPin);
      toast.success(`Đã cập nhật OTP cho ${resetTarget.fullName}`);
      setResetTarget(null);
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cập nhật OTP thất bại'));
    } finally {
      setSubmittingPin(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý người dùng</h1>
      <p className="text-sm text-slate-500 mb-8">Xem và quản lý tài khoản người dùng trong hệ thống</p>

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
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="w-full py-2.5 pl-10 pr-4 bg-white border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/12 transition-all"
          />
        </form>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="py-2.5 px-4 bg-white border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-primary-400 transition-all cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="LOCKED">Bị khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Không tìm thấy người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Họ và tên</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Số điện thoại</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Vai trò</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-600">Trạng thái</th>
                  <th className="text-center px-6 py-3.5 font-semibold text-slate-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => {
                  const sc = statusColors[u.status] || statusColors.ACTIVE;
                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.fullName}</td>
                      <td className="px-6 py-4 text-slate-600">{u.phone}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${u.role === 'ADMIN' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {statusLabels[u.status] || u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openResetPin(u)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all"
                            title="Cập nhật mã OTP giao dịch"
                          >
                            Cập nhật OTP
                          </button>
                          {u.role !== 'ADMIN' ? (
                            <button
                              onClick={() => handleToggleStatus(u.userId)}
                              disabled={toggling === u.userId}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {toggling === u.userId ? '...' : u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </button>
                          ) : (
                            // Placeholder giữ chỗ để cột Hành động thẳng hàng giữa admin row và user row
                            <span aria-hidden className="invisible px-3 py-1.5 text-xs font-medium">Khóa</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 flex-wrap gap-3">
            <p className="text-xs text-slate-500">Tổng {totalElements} người dùng</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Reset PIN modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={closeResetPin}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Cập nhật OTP</h3>
                <p className="text-xs text-slate-500 mt-0.5">{resetTarget.fullName} · {resetTarget.phone}</p>
              </div>
              <button
                onClick={closeResetPin}
                disabled={submittingPin}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>Sau khi cập nhật, vui lòng thông báo mã OTP mới cho người dùng. Mã OTP mới sẽ thay thế mã cũ.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã OTP mới (6 số)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="●●●●●●"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition tracking-widest text-center text-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mã OTP mới</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="●●●●●●"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition tracking-widest text-center text-lg font-mono"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={closeResetPin}
                disabled={submittingPin}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPin}
                disabled={submittingPin || newPin.length < 6 || confirmPin.length < 6}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submittingPin ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : 'Cập nhật OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
