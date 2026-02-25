import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json(
                { ok: false, error: 'Supabase client não está configurado. Verifique as variáveis de ambiente.' },
                { status: 500 }
            );
        }

        // Tenta uma query levíssima sem expor dados reais (só conta linhas na tabela tasks, limitando a 1)
        const { error } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .limit(1);

        if (error) {
            console.error('Supabase health check error:', error);
            return NextResponse.json(
                { ok: false, error: 'Conexão falhou', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true, supabase: 'connected' });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: 'Erro inesperado', details: err.message },
            { status: 500 }
        );
    }
}
