import { createClient } from '@supabase/supabase-js';

// Prepara a inicialização do Supabase Client para o MVP
// Por enquanto, as variáveis de ambiente estarão vazias até configurarmos o projeto no painel oficial

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// O client é exportado globalmente. Como as variáveis são 'placeholder', não fará requests reais no MVP sem config.
export const supabase = createClient(supabaseUrl, supabaseKey);
