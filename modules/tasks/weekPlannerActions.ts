'use server'

import { createClient } from '@/utils/supabase/server'
import type { Task } from '@/modules/tasks/queries'

export async function fetchWeekPlannerTasksAction(startDateISO: string, endDateISO: string): Promise<Task[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            id, title, status, category, planned_date,
            intended_start_time, is_frog, created_at,
            recurrence_type, recurrence_weekdays, recurrence_month_day,
            last_generated_date, recurrence_parent_id,
            delegated_to, delegated_note, delegated_at,
            scheduled_date, area_tag, area_color
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .gte('planned_date', startDateISO)
        .lte('planned_date', endDateISO)

    if (error) {
        console.error('Error fetching week planner tasks:', error.message)
        return []
    }

    return (data || []) as Task[]
}
