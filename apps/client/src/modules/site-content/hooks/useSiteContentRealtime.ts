import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseSiteContentRealtimeOptions {
  onContentChange: () => void;
  enabled?: boolean;
  debounceMs?: number;
}

export function useSiteContentRealtime({
  onContentChange,
  enabled = true,
  debounceMs = 450,
}: UseSiteContentRealtimeOptions): void {
  const onContentChangeRef = useRef(onContentChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onContentChangeRef.current = onContentChange;

  useEffect(() => {
    if (!enabled) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl === 'tu_url_aqui' || !supabaseKey || supabaseKey === 'tu_anon_key_aqui') {
      console.warn('[useSiteContentRealtime] Supabase no configurado - sincronizacion en tiempo real deshabilitada.');
      return;
    }

    const scheduleRefresh = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onContentChangeRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel('site-content-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_events' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_items' }, scheduleRefresh)
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debounceMs, enabled]);
}
