import { createClient } from '@/utils/supabase/server'
import { getTodayStrServer, formatServerDateStr } from '@/utils/date'

export async function getFrogEatingStreak() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Busca sapos concluidos, ordenados do mais recente pro mais antigo
    const { data, error } = await supabase
        .from('tasks')
        .select('planned_date, completed_at')
        .eq('user_id', user.id)
        .eq('is_frog', true)
        .eq('status', 'completed')
        .order('planned_date', { ascending: false })

    if (error || !data) return 0

    // JS-side cross date filter: O completed_at precisa bater (pertencer) ao mesmo dia que foi planejado.
    const validFrogs = data.filter(t => {
        if (!t.completed_at || !t.planned_date) return false
        // Split timestamp pra pegar YYYY-MM-DD
        const compDateStr = formatServerDateStr(new Date(t.completed_at))
        return compDateStr === t.planned_date
    })

    if (validFrogs.length === 0) return 0

    const todayStr = getTodayStrServer()

    // Ontem
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yesterdayStr = formatServerDateStr(d)

    // Streak Logic Loop
    let streak = 0
    let expectedDate = todayStr
    const hasTodayFrog = validFrogs.findIndex(f => f.planned_date === todayStr) !== -1

    if (!hasTodayFrog) {
        // Se ainda nao concluiu o de hoje, o streak conta de ontem! (Sem perdas no dia corrente ativo)
        expectedDate = yesterdayStr
    }

    // Removendo duplicações (caso raro) para o loop andar corretamente 1 a 1 dia
    const uniqueDates = Array.from(new Set(validFrogs.map(f => f.planned_date)))

    for (const currentStr of uniqueDates) {
        if (currentStr === expectedDate) {
            streak++

            // ExpectedDate regride 1 dia certinho de acordo com o JS Date Engine UTC safe.
            const curDateObj = new Date(`${currentStr}T12:00:00`)
            curDateObj.setDate(curDateObj.getDate() - 1)
            expectedDate = formatServerDateStr(curDateObj)
        } else {
            // Se rompeu, nao desce mais.
            break
        }
    }

    return streak
}

export async function getFrogToday() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const todayStr = getTodayStrServer()

    const { data } = await supabase
        .from('tasks')
        .select('id, title, status, intended_start_time')
        .eq('user_id', user.id)
        .eq('planned_date', todayStr)
        .eq('is_frog', true)
        .maybeSingle()

    return data
}

export async function getTodayStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { pomodoros: 0, completedTasks: 0 }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0) // Offsets do Server

    const [poms, tasks] = await Promise.all([
        supabase
            .from('pomodoros')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('completed_at', startOfToday.toISOString()),
        supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', startOfToday.toISOString())
    ])

    return {
        pomodoros: poms.count || 0,
        completedTasks: tasks.count || 0
    }
}
