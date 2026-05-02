/**
 * DataTableShell — Shell para tablas de datos con búsqueda y paginación
 *
 * Encapsula el patrón repetido de tabla admin:
 * header (búsqueda + refresh + acciones) → tabla → paginación
 *
 * Expone slots para customizar headers y filas de la tabla.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { Search, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableShellProps {
  children?: ReactNode;
  title?: ReactNode;
  /** Columnas de la tabla: nombres para el <thead> */
  columns: Array<{ label?: string; header?: string; className?: string; cell?: (item: any) => ReactNode }>;
  /** Placeholder del input de búsqueda */
  searchPlaceholder?: string;
  /** Valor actual de búsqueda */
  searchValue: string;
  /** Callback al cambiar la búsqueda */
  onSearchChange: (value: string) => void;
  /** Si la tabla está cargando datos */
  isLoading?: boolean;
  /** Callback para refrescar datos */
  onRefresh: () => void;
  /** Acciones adicionales en el header (botones extras) */
  headerActions?: ReactNode;
  /** Página actual (1-indexed) */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Callback para cambiar de página */
  onPageChange: (page: number) => void;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Si true, muestra el mensaje vacío */
  isEmpty?: boolean;
  /** Opcional: Data array (si se provee renderea automaticamente the body) */
  data?: any[];
  /** Opcional: Function for key extractor used in mapping auto data */
  keyExtractor?: (item: any) => string;
}

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

export const DataTableShell: React.FC<DataTableShellProps> = ({
  children,
  title,
  columns,
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  isLoading = false,
  onRefresh,
  headerActions,
  currentPage,
  totalPages,
  onPageChange,
  emptyMessage = 'No se encontraron resultados.',
  isEmpty = false,
  data,
  keyExtractor,
}) => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const hasMountedPageRef = useRef(false);

  useEffect(() => {
    if (!hasMountedPageRef.current) {
      hasMountedPageRef.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, onPageChange, totalPages]);

  return (
    <div ref={listTopRef} className="scroll-mt-24" data-admin-table-shell="true">
      {/* Header con búsqueda y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-white px-5 py-4 md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {title && <h2 className="pr-3 text-base font-black uppercase tracking-[0.08em] text-zinc-950 md:text-lg">{title}</h2>}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 w-full rounded-[16px] border border-zinc-200 bg-white pl-9 pr-4 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-72"
            />
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
            title="Refrescar"
          >
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50/80 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.label || col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isEmpty && !isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={keyExtractor ? keyExtractor(row) : row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 align-middle">
                      {col.cell ? col.cell(row) : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-5 py-4 md:px-6">
          <span className="text-sm font-semibold text-zinc-500">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {getVisiblePageNumbers(currentPage, totalPages).map((page, index, pages) => {
              const previous = pages[index - 1];
              const showGap = previous !== undefined && page - previous > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {showGap && <span className="px-1 text-sm font-black text-zinc-400" aria-hidden="true">...</span>}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`h-9 min-w-9 rounded-md px-3 text-sm font-bold transition-colors ${
                      page === currentPage
                        ? 'bg-primary text-white'
                        : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
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
              className="p-1.5 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTableShell;
