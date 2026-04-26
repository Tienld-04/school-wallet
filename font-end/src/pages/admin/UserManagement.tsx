import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination/Pagination';
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
                        {u.role !== 'ADMIN' && (
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
                        )}
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
    </div>
  );
};

export default UserManagement;
