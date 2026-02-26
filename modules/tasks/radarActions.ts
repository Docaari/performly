'use server'

import { createClient } from '@/utils/supabase/server'
import { getTodayStrServer } from '@/utils/date'
import type { Task } from '@/modules/tasks/queries'

export async function fetchRadarTodayTasksAction(): Promise<Task[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const todayStr = getTodayStrServer()

    // Query: planned_date IS NULL AND scheduled_date == todayStr AND status pendente/in_progress
    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, category, planned_date, scheduled_date, area_tag, area_color, intended_start_time, is_frog, created_at, recurrence_type, last_generated_date, recurrence_parent_id, delegated_to')
        .in('status', ['pending', 'in_progress'])
        .is('planned_date', null)
        .eq('scheduled_date', todayStr)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching radar tasks:', error.message)
        return []
    }

    return (data || []) as Task[]
}
