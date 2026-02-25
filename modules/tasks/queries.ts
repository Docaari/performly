import { supabase } from '@/lib/supabase';

export type Task = {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'archived';
    planned_date: string | null;
    is_frog: boolean;
    created_at: string;
};

export async function fetchTasks(): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client não inicializado. Configure as variáveis de ambiente.');

    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, planned_date, is_frog, created_at');

    if (error) {
        console.error('Error fetching tasks:', error.message);
        throw new Error('Falha ao buscar tarefas no Supabase.');
    }

    const tasks = (data || []) as Task[];

    // O fuso horário da máquina local ou servidor pode variar, mas no Date String ISO, pegamos apenas o componente 'YYYY-MM-DD'
    // Para MVP simplificado sem dependências pesadas, comparamos strings
    const todayDate = new Date();
    const today = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    return tasks.sort((a, b) => {
        // 1. Hoje primeiro
        const isAToday = a.planned_date === today;
        const isBToday = b.planned_date === today;
        if (isAToday && !isBToday) return -1;
        if (!isAToday && isBToday) return 1;

        // 2. Sem data em seguida
        const isANull = a.planned_date === null;
        const isBNull = b.planned_date === null;
        if (isANull && !isBNull) return -1;
        if (!isANull && isBNull) return 1;

        // 3. Datas passadas (ordem decrescente - mais recente primeiro)
        if (a.planned_date && b.planned_date) {
            if (a.planned_date > b.planned_date) return -1;
            if (a.planned_date < b.planned_date) return 1;
        }

        // Desempate por data de criação
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}
