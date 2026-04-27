import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination/Pagination';
import type { KycAdminListResponse } from '../../types';

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:    { label: 'Chờ duyệt',     bg: 'bg-amber-50',   text: 'text-amber-700'   },
  VERIFIED:   { label: 'Đã xác minh',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  REJECTED:   { label: 'Bị từ chối',    bg: 'bg-red-50',     text: 'text-red-700'     },
};

const KycManagement: React.FC = () => {
  const [list, setList]               = useState<KycAdminListResponse[]>([]);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');

  // Detail modal
  const [selected, setSelected]       = useState<KycAdminListResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getKycList(page, 10, filterStatus || undefined);
      setList(data.content);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements);
    } catch {
      toast.error('Không thể tải danh sách KYC');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setPage(0);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminApi.approveKyc(selected.kycId);
      toast.success('Duyệt KYC thành công');
      setSelected(null);
      fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Duyệt thất bại');
      else toast.error('Duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.rejectKyc(selected.kycId, rejectReason.trim());
      toast.success('Đã từ chối hồ sơ KYC');
      setSelected(null);
      setRejectReason('');
      setShowRejectInput(false);
      fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Từ chối thất bại');
      else toast.error('Từ chối thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setRejectReason('');
    setShowRejectInput(false);
  };

  const formatDate = (str?: string) => {
    if (!str) return '—';
    try { return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return str; }
  };

  const filters = [
    { value: 'PENDING',  label: 'Chờ duyệt' },
    { value: 'VERIFIED', label: 'Đã duyệt'  },
    { value: 'REJECTED', label: 'Từ chối'   },
    { value: '',         label: 'Tất cả'    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Quản lý KYC</h1>
      <p className="text-sm text-slate-500 mb-6">Xét duyệt hồ sơ xác minh danh tính người dùng</p>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p className="text-sm">Không có hồ sơ nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Họ và tên', 'Mã sinh viên', 'Số CCCD', 'Ngày nộp', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 sm:px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {list.map((kyc) => {
                  const cfg = statusConfig[kyc.status];
                  return (
                    <tr key={kyc.kycId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 font-medium text-slate-800">{kyc.fullName}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600">{kyc.studentCode}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600">{kyc.idNumber}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-500">{formatDate(kyc.submittedAt)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg?.bg} ${cfg?.text}`}>
                          {cfg?.label ?? kyc.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => setSelected(kyc)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-50 flex-wrap gap-3">
            <p className="text-xs text-slate-500">Tổng {totalElements} hồ sơ</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Chi tiết hồ sơ KYC</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 divide-y divide-slate-50">
              {[
                { label: 'Họ và tên',     value: selected.fullName },
                { label: 'Ngày sinh',     value: formatDate(selected.dateOfBirth) },
                { label: 'Số CCCD',       value: selected.idNumber },
                { label: 'Ngày cấp',      value: formatDate(selected.idIssueDate) },
                { label: 'Nơi cấp',       value: selected.idIssuePlace },
                { label: 'Mã sinh viên',  value: selected.studentCode },
                { label: 'Ngày nộp',      value: formatDate(selected.submittedAt) },
                ...(selected.verifiedAt ? [{ label: 'Ngày duyệt', value: formatDate(selected.verifiedAt) }] : []),
                ...(selected.rejectionReason ? [{ label: 'Lý do từ chối', value: selected.rejectionReason }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 py-3">
                  <span className="text-sm text-slate-500 shrink-0">{row.label}</span>
                  <span className="text-sm font-medium text-slate-800 text-right">{row.value}</span>
                </div>
              ))}

              {/* Trạng thái */}
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-slate-500 shrink-0">Trạng thái</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[selected.status]?.bg} ${statusConfig[selected.status]?.text}`}>
                  {statusConfig[selected.status]?.label ?? selected.status}
                </span>
              </div>
            </div>

            {/* Action buttons — chỉ hiện khi PENDING */}
            {selected.status === 'PENDING' && (
              <div className="px-6 py-4 border-t border-slate-100 space-y-3">
                {showRejectInput ? (
                  <div className="space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || actionLoading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận từ chối'}
                      </button>
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Duyệt KYC'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KycManagement;
