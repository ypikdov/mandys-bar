import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. El reporte en tiempo real no funcionará correctamente.");
}

// Crear un único cliente de Supabase para interactuar con la DB en tiempo real
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
