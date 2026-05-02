/**
 * SectionCard — Card genérica para secciones del dashboard
 *
 * Provee la estructura visual consistente de las cards del admin:
 * bordes redondeados, sombra, header con título y acciones, body.
 *
 * Reemplaza el patrón repetido en los feature tabs:
 *   <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
 *     <div className="p-6 border-b ... flex justify-between">
 *       <h2>Título</h2>
 *       <div>acciones</div>
 *     </div>
 *     {children}
 *   </div>
 */

import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  /** Título de la sección */
  title?: ReactNode;
  /** Acciones del header (botones, filtros, etc.) */
  headerActions?: ReactNode;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Si true, el header no se renderiza */
  noHeader?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  headerActions,
  className = '',
  noHeader = false,
}) => {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${className}`}>
      {!noHeader && (title || headerActions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-white px-5 py-4 md:px-6">
          {title && (
            <h2 className="flex items-center gap-2 text-base font-black uppercase tracking-[0.08em] text-zinc-950 md:text-lg">{title}</h2>
          )}
          {headerActions && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default SectionCard;
