'use client'

import { useState, useEffect } from 'react'
import { getInboxTasksAction } from '@/modules/tasks/inboxActions'
import { TaskItem } from '@/components/TaskItem'
import { getTodayStrClient } from '@/utils/date'
import type { Task } from '@/modules/tasks/queries'
import { usePlanningShell } from '../PlanningShellContext'

export function InboxTab() {
    const { refreshInboxKey } = usePlanningShell()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadTasks = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getInboxTasksAction()
            const todayStr = getTodayStrClient()
            // Filtro visual para ocultar o Radar (tarefas agendadas pra hoje)
            const filtered = data.filter(t => t.scheduled_date !== todayStr)
            setTasks(filtered)
        } catch (err) {
            setError('Falha ao carregar inbox.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTasks()
    }, [refreshInboxKey])

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-[300px]">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (error) {
        return <div className="p-6 text-red-500 text-center">{error}</div>
    }

    return (
        <div className="p-4 sm:p-6 pb-24">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Backlog</h3>
            </div>
            {tasks.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center text-center h-[200px] text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-medium text-gray-900 text-sm">Sua Inbox está limpa!</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </ul>
            )}
        </div>
    )
}
