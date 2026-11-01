import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number): (number | 'dots')[] => {
  const delta = 1;
  const range: (number | 'dots')[] = [];

  if (total <= 7) {
    for (let i = 0; i < total; i++) range.push(i);
    return range;
  }

  range.push(0);

  const left = Math.max(1, current - delta);
  const right = Math.min(total - 2, current + delta);

  if (left > 1) range.push('dots');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 2) range.push('dots');

  range.push(total - 1);
  return range;
};

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const safeTotal = Math.max(Number.isFinite(totalPages) ? totalPages : 1, 1);
  const pages = getPageNumbers(page, safeTotal);

  const baseBtn = 'min-w-[34px] h-[34px] flex items-center justify-center text-xs font-medium rounded-lg transition-all';
  const inactiveBtn = 'text-slate-600 border border-slate-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600';
  const activeBtn = 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-sm shadow-primary-600/30';
  const disabledBtn = 'text-slate-300 border border-slate-100 cursor-not-allowed';
  const arrowBtn = 'px-2.5';

  return (
    <div className="flex items-center gap-1.5">
      {/* Prev */}
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className={`${baseBtn} ${arrowBtn} ${page === 0 ? disabledBtn : inactiveBtn}`}
        aria-label="Trang trước"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === 'dots' ? (
          <span key={`dots-${i}`} className="min-w-[34px] h-[34px] flex items-center justify-center text-xs text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${baseBtn} ${page === p ? activeBtn : inactiveBtn}`}
          >
            {p + 1}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(safeTotal - 1, page + 1))}
        disabled={page >= safeTotal - 1}
        className={`${baseBtn} ${arrowBtn} ${page >= safeTotal - 1 ? disabledBtn : inactiveBtn}`}
        aria-label="Trang sau"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
