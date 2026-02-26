import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getTodayStrServer } from '@/utils/date'
import type { Task } from '@/modules/tasks/queries'
import { NorteBanner } from '@/components/NorteBanner'
import { TodayPanel } from '@/components/foco/TodayPanel'
import { QuickCaptureBar } from '@/components/foco/QuickCaptureBar'
import { RadarTodayStrip } from '@/components/foco/RadarTodayStrip'
import { PlanningShellProvider } from '@/components/foco/PlanningShellContext'
import { PlanningShell } from '@/components/foco/PlanningShell'
import { PlanningShellTrigger } from '@/components/foco/PlanningShellTrigger'

export const dynamic = 'force-dynamic'

export default async function FocoPage(
    props: {
        searchParams: Promise<{ simulate_date?: string }>
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const searchParams = await props.searchParams
    const simulateDateStr = process.env.NODE_ENV !== 'production' ? searchParams.simulate_date : undefined
    const todayServerISO = simulateDateStr || getTodayStrServer()

    let tasks: Task[] = []
    let initialNorte: string | null = null
    let fetchError: string | null = null

    try {
        // Fetch User Settings (for Norte)
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('norte_objective')
            .eq('user_id', user.id)
            .maybeSingle()

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error fetching settings:', settingsError)
        } else {
            initialNorte = settingsData?.norte_objective || null
        }

        // Fetch Today Tasks (Top 6)
        // Regra de Ouro: Hoje = planned_date igual ao dia atual e status pendente/em progresso
        const { data: todayTasks, error: tasksError } = await supabase
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
            .eq('planned_date', todayServerISO)
            .order('is_frog', { ascending: false })
            .order('created_at', { ascending: true })

        if (tasksError) {
            console.error('Error fetching today tasks:', tasksError)
            throw new Error('Falha ao carregar as tarefas programadas para hoje.')
        }

        tasks = todayTasks as Task[]

    } catch (error: unknown) {
        fetchError = error instanceof Error ? error.message : String(error)
    }

    return (
        <PlanningShellProvider>
            <div className="p-6 md:p-10 max-w-4xl mx-auto h-full flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-extrabold text-gray-900">Foco e Ação</h1>
                    <PlanningShellTrigger />
                </div>
                <p className="text-gray-500 mb-8">O que importa agora. Sapo primeiro.</p>

                <QuickCaptureBar />

                <RadarTodayStrip />

                {!fetchError && <NorteBanner initialObjective={initialNorte} />}

                {fetchError ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm border border-red-200">
                        Ocorreu um erro: {fetchError}
                    </div>
                ) : (
                    <div className="flex-1 w-full pb-32">
                        <TodayPanel tasks={tasks} />
                    </div>
                )}
            </div>

            <PlanningShell />
        </PlanningShellProvider>
    )
}
