import { createClient } from '@/utils/supabase/server';
import { getTodayStrServer } from '@/utils/date';

export type Task = {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delegated';
    category: 'deep_work' | 'operacional' | 'estudo' | 'pessoal_saude';
    planned_date: string | null;
    intended_start_time: string | null;
    is_frog: boolean;
    created_at: string;
    scheduled_date: string | null;
    area_tag: string | null;
    area_color: string | null;
    recurrence_type?: 'daily' | 'weekly' | 'monthly' | null;
    recurrence_weekdays?: number[] | null;
    recurrence_month_day?: number | null;
    last_generated_date?: string | null;
    recurrence_parent_id?: string | null;

    // Novas colunas (opcionais) D3
    delegated_to?: string | null;
    delegated_note?: string | null;
    delegated_at?: string | null;
};

export async function fetchRoutines(): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Sessão inválida. Por favor, faça login.');
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .not('recurrence_type', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching routines:', error.message);
        throw new Error('Falha ao buscar rotinas no Supabase.');
    }

    return (data || []) as Task[];
}

export async function fetchTasks(): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Sessão inválida. Por favor, faça login.');
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, category, planned_date, scheduled_date, area_tag, area_color, intended_start_time, is_frog, created_at, recurrence_type, last_generated_date, recurrence_parent_id')
        .neq('status', 'delegated')
        .neq('status', 'skipped')
        // Push Down Sort (Partial): O DB entrega quase tudo ordenado
        .order('planned_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error.message);
        throw new Error('Falha ao buscar tarefas no Supabase.');
    }

    const tasks = (data || []) as Task[];

    // O fuso horário da máquina local ou servidor pode variar, mas no Date String ISO, pegamos apenas o componente 'YYYY-MM-DD'
    // Para MVP simplificado sem dependências pesadas, comparamos strings
    // Puxa o Fuso padronizado do App
    const today = getTodayStrServer();

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

export async function fetchPlanWeeklyTasks(): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Sessão inválida. Por favor, faça login.');
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, category, planned_date, scheduled_date, area_tag, area_color, intended_start_time, is_frog, created_at, recurrence_type, last_generated_date, recurrence_parent_id')
        .in('status', ['pending', 'in_progress']) // STRICT FILTER - No archived, skipped, delegated, completed
        // Push Down Sort (Partial): Estabiliza os dados antes de chegarem na RAM do Node
        .order('planned_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching plan tasks:', error.message);
        throw new Error('Falha ao buscar tarefas do Planner.');
    }

    const tasks = (data || []) as Task[];

    const today = getTodayStrServer();

    return tasks.sort((a, b) => {
        const isAToday = a.planned_date === today;
        const isBToday = b.planned_date === today;
        if (isAToday && !isBToday) return -1;
        if (!isAToday && isBToday) return 1;

        const isANull = a.planned_date === null;
        const isBNull = b.planned_date === null;
        if (isANull && !isBNull) return -1;
        if (!isANull && isBNull) return 1;

        if (a.planned_date && b.planned_date) {
            if (a.planned_date > b.planned_date) return -1;
            if (a.planned_date < b.planned_date) return 1;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export async function fetchCompletedHistory(startDateISO: string, endDateISO: string): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Sessão inválida.');
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'completed')
        .gte('planned_date', startDateISO)
        .lte('planned_date', endDateISO)
        .order('planned_date', { ascending: false });

    if (error) {
        console.error('Error fetching completed history:', error.message);
        throw new Error('Falha ao buscar histórico de tarefas.');
    }

    return (data || []) as Task[];
}

export type UserSettings = {
    user_id: string;
    norte_objective: string | null;
    updated_at: string;
}

export async function fetchUserSettings(): Promise<UserSettings | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Sessão inválida.');
    }

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // returns null if 0 rows, otherwise object

    if (error) {
        console.error('Error fetching user settings:', error.message);
        return null;
    }

    return data as UserSettings | null;
}

// Micro-PR D3: GTD Inbox Triage Queries

export async function fetchInboxTasks(): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return [];

    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, category, planned_date, scheduled_date, area_tag, area_color, intended_start_time, is_frog, created_at, recurrence_type, last_generated_date, recurrence_parent_id, delegated_to')
        .in('status', ['pending', 'in_progress', 'delegated'])
        .is('planned_date', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inbox tasks:', error.message);
        return [];
    }

    return (data || []) as Task[];
}

// Removed fetchArchivedTasks

export async function fetchDelegatedTasks(): Promise<Task[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return [];

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'delegated')
        .is('recurrence_type', null)
        .order('delegated_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching delegated tasks:', error.message);
        return [];
    }

    return (data || []) as Task[];
}
