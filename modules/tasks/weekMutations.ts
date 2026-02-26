'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveTaskPlannedDateAction(taskId: string, targetDateStr: string, targetIndex?: number) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // Optional: we can manage order_index here if required. 
    // Right now, order_index is not fully utilized globally, but we'll prepare the ground.
    const updatePayload: any = {
        planned_date: targetDateStr,
        scheduled_date: null // if it moves to a planned date, it's no longer just on the radar
    }

    if (targetIndex !== undefined) {
        updatePayload.order_index = targetIndex
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        return { error: 'Falha ao mover tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou não alterada.' }
    }

    // Retornamos E5 success. O client decide se dá refresh local ou não.
    return { success: true, data: data[0] }
}
