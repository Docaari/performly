'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPomodoro(taskId: string, durationMinutes: number = 25) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const { error } = await supabase.from('pomodoros').insert({
        user_id: user.id,
        task_id: taskId,
        duration_minutes: durationMinutes,
        // completed_at falls back to NOW() organically via Supabase Schema Defaults
    })

    if (error) {
        console.error('Falha ao registrar pomodoro:', error.message)
        return { error: 'Falha ao salvar pomodoro no banco de dados.' }
    }

    revalidatePath('/focus')
    revalidatePath('/dashboard')

    return { success: true }
}
