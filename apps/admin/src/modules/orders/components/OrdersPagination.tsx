import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

export const OrdersPagination: React.FC<OrdersPaginationProps> = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, onPageChange, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
      <span className="text-sm font-semibold text-zinc-500">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-zinc-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {getVisiblePageNumbers(currentPage, totalPages).map((page, index, pages) => {
          const previous = pages[index - 1];
          const showGap = previous !== undefined && page - previous > 1;

          return (
            <span key={page} className="inline-flex items-center gap-2">
              {showGap && <span className="px-1 text-sm font-black text-zinc-400" aria-hidden="true">...</span>}
              <button
                onClick={() => onPageChange(page)}
                className={`h-10 min-w-10 rounded-[14px] px-3 text-sm font-black transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-white shadow-[0_10px_22px_rgba(198,40,40,0.18)]'
                    : 'border border-zinc-200 bg-white text-zinc-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] hover:bg-zinc-100'
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </span>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-zinc-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
});

OrdersPagination.displayName = 'OrdersPagination';
