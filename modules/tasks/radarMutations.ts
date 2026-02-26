'use server'

import { createClient } from '@/utils/supabase/server'
import { getTodayStrServer } from '@/utils/date'
import { revalidatePath } from 'next/cache'

export async function bringRadarTaskToTodayAction(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const todayStr = getTodayStrServer()

    const { data, error } = await supabase
        .from('tasks')
        .update({
            planned_date: todayStr,
            scheduled_date: null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        return { error: 'Falha ao trazer para hoje.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Nenhuma tarefa alterada.' }
    }

    revalidatePath('/foco')
    return { success: true }
}

export async function clearScheduledDateAction(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            scheduled_date: null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        return { error: 'Falha ao voltar pro backlog.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Nenhuma tarefa alterada.' }
    }

    // Opcionalmente podemos revalidar algo aqui, mas usualmente o cliente lida via E5
    return { success: true }
}
