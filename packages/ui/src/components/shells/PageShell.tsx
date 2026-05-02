/**
 * PageShell — Contenedor de página estándar
 *
 * Provee padding, max-width, y espaciado vertical consistente
 * para cualquier página del sistema (cliente o admin).
 *
 * Props opcionales permiten personalizar sin romper la consistencia.
 */

import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Título opcional de la página — se renderiza como h1 */
  title?: ReactNode;
  /** Subtítulo opcional — se renderiza debajo del título */
  subtitle?: ReactNode;
  /** Acciones del header (botones de tabs, etc.) */
  headerActions?: ReactNode;
  /** Clase CSS adicional para el contenedor exterior */
  className?: string;
  /** Ancho máximo: 'default' = max-w-7xl, 'narrow' = max-w-4xl, 'wide' = max-w-[1400px] */
  maxWidth?: 'narrow' | 'default' | 'wide';
  /** Padding top extra para compensar Navbar fija (default: true) */
  withNavbarOffset?: boolean;
}

const MAX_WIDTH_CLASSES = {
  narrow: 'max-w-4xl',
  default: 'max-w-7xl',
  wide: 'max-w-[1400px]',
} as const;

export const PageShell: React.FC<PageShellProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  className = '',
  maxWidth = 'default',
  withNavbarOffset = true,
}) => {
  return (
    <div className={`min-h-screen ${withNavbarOffset ? 'pt-24' : ''} pb-12 ${className}`}>
      <div className={`container mx-auto px-4 ${MAX_WIDTH_CLASSES[maxWidth]}`}>
        {(title || subtitle || headerActions) && (
          <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-3xl font-black uppercase text-black flex items-center gap-3">{title}</h1>
              )}
              {subtitle && (
                <p className="text-zinc-500 mt-2">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex justify-start">
                {headerActions}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageShell;
