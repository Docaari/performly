'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveWeeklyBudgets(weekStart: string, budgets: Record<string, number>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Sessão inválida. Por favor, faça login.' }
    }

    // Convert object { 'deep_work': 10, 'estudo': 5 } to rows
    const rowsToUpsert = Object.keys(budgets).map(category => ({
        user_id: user.id,
        week_start: weekStart,
        category: category,
        planned_pomodoros: budgets[category]
    }));

    if (rowsToUpsert.length === 0) return { success: true }

    // Upsert expects table to have a unique constraint/index on (user_id, week_start, category)
    const { error } = await supabase
        .from('weekly_budgets')
        .upsert(rowsToUpsert, { onConflict: 'user_id, week_start, category' });

    if (error) {
        console.error('Falha ao salvar orçamento semanal:', error);
        return { error: 'Falha ao salvar orçamento. Tente novamente.' }
    }

    revalidatePath('/review');
    return { success: true };
}

export async function upsertDailyReflection({
    date,
    rating,
    note,
    sleepQuality,
    sleepHours
}: {
    date: string;
    rating: 'bad' | 'ok' | 'great';
    note?: string | null;
    sleepQuality?: string | null;
    sleepHours?: number | null;
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    if (!['bad', 'ok', 'great'].includes(rating)) {
        return { error: 'Rating inválido' }
    }

    // Sanitização rigorosa do sono
    let safeSleepQuality = null;
    if (sleepQuality && ['good', 'fair', 'poor'].includes(sleepQuality)) {
        safeSleepQuality = sleepQuality;
    }

    let safeSleepHours = null;
    if (sleepHours !== undefined && sleepHours !== null) {
        const h = Number(sleepHours);
        if (!isNaN(h) && h >= 0 && h <= 24) {
            safeSleepHours = h;
        }
    }

    const { data, error } = await supabase
        .from('daily_reflections')
        .upsert({
            user_id: user.id,
            reflection_date: date,
            rating,
            note: note ? note.trim().substring(0, 240) : null,
            sleep_quality: safeSleepQuality,
            sleep_hours: safeSleepHours,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, reflection_date' })
        .select()

    if (error) {
        console.error('Falha ao salvar reflexão:', error)
        return { error: 'Falha técnica ao salvar sua reflexão.' }
    }

    if (!data || data.length === 0) {
        return { error: 'A reflexão não pôde ser salva (Falha silenciosa do banco).' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/review')

    return { success: true }
}
