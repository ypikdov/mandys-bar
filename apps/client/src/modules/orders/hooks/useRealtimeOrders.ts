/**
 * Hook de infraestructura — Supabase Realtime para Órdenes
 *
 * Encapsula la suscripción Realtime actualmente usada en AdminDashboard.tsx.
 * Solo escucha cambios en la tabla `orders` — NO se extiende a otras tablas
 * por confirmación del código real (AdminDashboard.tsx, línea 576).
 *
 * Véase: Documento de Especificación, sección 1.3 — Supabase solo para realtime de pedidos.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseRealtimeOrdersOptions {
  /** Callback ejecutado cuando cambia alguna orden en la BD */
  onOrderChange: () => void;
  /** Si es false, la suscripción no se activa */
  enabled?: boolean;
}

/**
 * Suscribe a cambios postgres_changes en la tabla `orders`.
 * Verifica que las variables de entorno de Supabase sean válidas
 * antes de intentar la suscripción.
 */
export function useRealtimeOrders({ onOrderChange, enabled = true }: UseRealtimeOrdersOptions): void {
  const onOrderChangeRef = useRef(onOrderChange);
  onOrderChangeRef.current = onOrderChange;

  useEffect(() => {
    if (!enabled) return;

    // Verificar que Supabase esté configurado correctamente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl === 'tu_url_aqui' || !supabaseKey || supabaseKey === 'tu_anon_key_aqui') {
      console.warn('[useRealtimeOrders] Supabase no configurado — Realtime deshabilitado.');
      return;
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          onOrderChangeRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
