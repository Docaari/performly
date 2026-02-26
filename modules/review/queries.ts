import { createClient } from '@/utils/supabase/server'
import { formatServerDateStr } from '@/utils/date'

export type ReviewDayData = {
    date: string; // YYYY-MM-DD
    pomodoroCount: number;
    frogCompleted: boolean;
    frogTitle: string | null;
}

export async function fetchMonthReviewData(year: number, month: number): Promise<Record<string, ReviewDayData>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    // Month is 1-indexed here, so month=2 is Feb
    // Start date of the month (UTC context for Supabase queries)
    const startDate = new Date(year, month - 1, 1).toISOString();
    // Start date of the next month
    const endDate = new Date(year, month, 1).toISOString();

    // 1. Fetch Pomodoros for the month (keep as is, only completes)
    const { data: pomodoros, error: pomodorosError } = await supabase
        .from('pomodoros')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', startDate)
        .lt('completed_at', endDate);

    if (pomodorosError) {
        console.error('Erro ao buscar pomodoros do mes:', pomodorosError);
    }

    // 2. Fetch Completed Frogs for the month (ULTRA LEVE)
    // Buscamos apenas planned_date para mapear rapidamente no calendário
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('planned_date') // Sem ID, sem title, sem status
        .eq('user_id', user.id)
        .eq('is_frog', true)
        .eq('status', 'completed')
        .like('planned_date', `${monthPrefix}-%`);

    if (tasksError) {
        console.error('Erro ao buscar sapos do mes:', tasksError);
    }

    // Aggregate Data
    const daysMap: Record<string, ReviewDayData> = {};

    // Populate Pomodoros
    (pomodoros || []).forEach(p => {
        const dateObj = new Date(p.completed_at);
        const dateStr = formatServerDateStr(dateObj);

        if (!daysMap[dateStr]) {
            daysMap[dateStr] = { date: dateStr, pomodoroCount: 0, frogCompleted: false, frogTitle: null };
        }
        daysMap[dateStr].pomodoroCount++;
    });

    // Populate Frogs
    (tasks || []).forEach(t => {
        if (!t.planned_date) return;
        const dateStr = t.planned_date;

        if (!daysMap[dateStr]) {
            daysMap[dateStr] = { date: dateStr, pomodoroCount: 0, frogCompleted: false, frogTitle: null };
        }
        daysMap[dateStr].frogCompleted = true;
    });

    return daysMap;
}

export type WeeklyBudgetStat = {
    category: 'deep_work' | 'operacional' | 'estudo' | 'pessoal_saude';
    planned: number;
    executed: number;
}

export async function fetchWeeklyBudgetStats(weekStart: string): Promise<Record<string, WeeklyBudgetStat>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    // weekStart is "YYYY-MM-DD" representing Monday.
    // Calculate weekEnd directly. JS Date works differently across timezones when parsing "YYYY-MM-DD"
    const startObj = new Date(`${weekStart}T00:00:00`);
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + 7); // up to next Monday
    const weekEnd = formatServerDateStr(endObj);

    // 1. Fetch Planned Budgets
    const { data: budgets, error: budgetsError } = await supabase
        .from('weekly_budgets')
        .select('category, planned_pomodoros')
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

    if (budgetsError) {
        console.error('Erro ao buscar budgest semanais:', budgetsError);
    }

    // 2. Fetch Pomodoros for the week with joined Tasks to get the category
    // This uses Supabase's automatic foreign key join syntax if task_id fk exists
    const { data: pomodoros, error: pomoError } = await supabase
        .from('pomodoros')
        .select(`
            id,
            tasks ( category )
        `)
        .eq('user_id', user.id)
        .gte('completed_at', `${weekStart} 00:00:00`)
        .lt('completed_at', `${weekEnd} 00:00:00`);

    if (pomoError) {
        console.error('Erro ao buscar pomodoros semanais:', pomoError);
    }

    // Initialize base stats map
    const stats: Record<string, WeeklyBudgetStat> = {
        'deep_work': { category: 'deep_work', planned: 0, executed: 0 },
        'operacional': { category: 'operacional', planned: 0, executed: 0 },
        'estudo': { category: 'estudo', planned: 0, executed: 0 },
        'pessoal_saude': { category: 'pessoal_saude', planned: 0, executed: 0 },
    };

    // Populate planned
    (budgets || []).forEach(b => {
        if (stats[b.category]) {
            stats[b.category].planned = b.planned_pomodoros;
        }
    });

    // Populate executed
    // Type structure from supbabse join is: tasks: { category: string } or tasks: { category: string }[] depending on relation
    // Since POMODOROS has N:1 relation to TASKS it returns a single object.
    (pomodoros || []).forEach(p => {
        // @ts-expect-error - Supabase types cast nested object correctly here in runtime
        const category = p.tasks?.category;
        if (category && stats[category]) {
            stats[category].executed++;
        }
    });

    return stats;
}

export type PerformanceMetrics = {
    weeklyCompletionRate: number; // 0-100
    weeklyFrogWinRate: number; // 0-100
    allTimeFocusHours: number;
}

export async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { weeklyCompletionRate: 0, weeklyFrogWinRate: 0, allTimeFocusHours: 0 }
    }

    // 1) All Time Focus Hours
    // Cada pomodoro = 25 min -> / 60 pra hora
    const { count: pomoCount, error: pomoError } = await supabase
        .from('pomodoros')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const totalPomodoros = pomoError ? 0 : (pomoCount || 0);
    const allTimeFocusHours = Math.round((totalPomodoros * 25) / 60);

    // 2) Set up Weekly Bounds (Mon-Sun)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(today.getTime());
    startOfWeek.setDate(today.getDate() + diffToMonday);
    const startOfWeekStr = formatServerDateStr(startOfWeek);

    const endOfWeek = new Date(startOfWeek.getTime());
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = formatServerDateStr(endOfWeek);

    // 3) Completion Rate (semana Seg-Dom)
    // Formula: completed(planned in week) / total(planned in week)
    const { data: weekTasks, error: weekTasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)
        .gte('planned_date', startOfWeekStr)
        .lte('planned_date', endOfWeekStr)
        // Somente tarefas comuns e instâncias (recurrence_type nulo)
        .is('recurrence_type', null)

    let weeklyCompletionRate = 0;
    if (!weekTasksError && weekTasks && weekTasks.length > 0) {
        const completedCount = weekTasks.filter(t => t.status === 'completed').length;
        weeklyCompletionRate = Math.round((completedCount / weekTasks.length) * 100);
    }

    // 4) Frog Win Rate (semana Seg-Dom)
    // Formula: completed(is_frog in week) / total(is_frog in week)
    const { data: frogTasks, error: frogError } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)
        .eq('is_frog', true)
        .gte('planned_date', startOfWeekStr)
        .lte('planned_date', endOfWeekStr)
        .is('recurrence_type', null)

    let weeklyFrogWinRate = 0;
    if (!frogError && frogTasks && frogTasks.length > 0) {
        const frogsCompleted = frogTasks.filter(t => t.status === 'completed').length;
        weeklyFrogWinRate = Math.round((frogsCompleted / frogTasks.length) * 100);
    }

    return {
        weeklyCompletionRate,
        weeklyFrogWinRate,
        allTimeFocusHours
    }
}

export type DailyReflection = {
    id: string;
    reflection_date: string;
    rating: 'bad' | 'ok' | 'great';
    note: string | null;
    sleep_quality: 'good' | 'fair' | 'poor' | null;
    sleep_hours: number | null;
    created_at: string;
}

export async function fetchDailyReflection(dateStr: string): Promise<DailyReflection | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .eq('reflection_date', dateStr)
        .maybeSingle()

    if (error) {
        console.error('Error fetching daily reflection:', error.message)
        return null
    }

    return data as DailyReflection | null
}

export async function fetchRecentReflections(limitDays: number = 28): Promise<DailyReflection[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Calculate start date
    const todayDate = new Date()
    const startDateObj = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000)
    startDateObj.setDate(startDateObj.getDate() - limitDays)
    const startDateStr = startDateObj.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .gte('reflection_date', startDateStr)
        .order('reflection_date', { ascending: false })

    if (error) {
        console.error('Error fetching recent reflections:', error.message)
        return []
    }

    return (data || []) as DailyReflection[]
}

export type DailyReviewDetails = {
    frogTask: { status: string } | null;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

export async function fetchDailyReviewDetails(dateStr: string): Promise<DailyReviewDetails> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { frogTask: null, totalTasks: 0, completedTasks: 0, completionRate: 0 }
    }

    // Query super leve sem id nem title
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status, is_frog')
        .eq('user_id', user.id)
        .eq('planned_date', dateStr)

    if (error) {
        console.error(`Erro ao buscar detalhes do dia ${dateStr}:`, error.message)
        return { frogTask: null, totalTasks: 0, completedTasks: 0, completionRate: 0 }
    }

    let frogTask = null;
    let totalTasks = 0;
    let completedTasks = 0;

    if (tasks && tasks.length > 0) {
        totalTasks = tasks.length;
        completedTasks = tasks.filter(t => t.status === 'completed').length;

        const frog = tasks.find(t => t.is_frog);
        if (frog) {
            frogTask = { status: frog.status };
        }
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        frogTask,
        totalTasks,
        completedTasks,
        completionRate
    }
}
