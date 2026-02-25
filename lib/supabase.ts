import { createClient } from '@supabase/supabase-js';

// Inicialização do Supabase Client nativo com base em variáveis locais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Componentes Server-Side e Client-Side poderão convocar essa mesma instância Singleton
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

