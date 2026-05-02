/**
 * ActionBar — Barra de acciones con filtros y botones
 *
 * Componente reutilizable para barras de filtro/acción
 * como la de la pestaña de órdenes (filtros por estado)
 * o cualquier sección que necesite una barra de acciones horizontal.
 */

import type { ReactNode } from 'react';

interface ActionBarProps {
  children: ReactNode;
  /** Clase CSS adicional */
  className?: string;
  /** Disposición: 'between' separa hijos con space-between, 'start' los agrupa al inicio */
  layout?: 'between' | 'start' | 'center';
}

const LAYOUT_CLASSES = {
  between: 'justify-between',
  start: 'justify-start',
  center: 'justify-center',
} as const;

export const ActionBar: React.FC<ActionBarProps> = ({
  children,
  className = '',
  layout = 'between',
}) => {
  return (
    <div
      className={`
        flex flex-col xl:flex-row gap-4 items-center
        bg-white/40 backdrop-blur-md p-4 rounded-2xl
        border border-white/20 shadow-xl
        ${LAYOUT_CLASSES[layout]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ActionBar;
