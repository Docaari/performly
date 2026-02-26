import { createClient } from '@/utils/supabase/server'
import { getTodayStrServer } from '@/utils/date'

export async function fetchFrogOfTheDay() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const todayStr = getTodayStrServer()
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('planned_date', todayStr)
        .eq('is_frog', true)
        .neq('status', 'completed')
        .maybeSingle()

    if (error) {
        console.error('Erro ao buscar sapo:', error)
        return null
    }

    return data
}

export async function fetchTodayPomodorosCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Meia noite no UTC atual ou Offset do Servidor SSR
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
        .from('pomodoros')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', startOfToday.toISOString())

    if (error) {
        console.error('Erro ao buscar pomodoros count:', error)
        return 0
    }

    return count || 0
}
