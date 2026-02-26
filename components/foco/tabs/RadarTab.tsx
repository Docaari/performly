'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchRadarTodayTasksAction } from '@/modules/tasks/radarActions'
import { bringRadarTaskToTodayAction, clearScheduledDateAction } from '@/modules/tasks/radarMutations'
import { getTodayStrClient } from '@/utils/date'
import type { Task } from '@/modules/tasks/queries'
import { usePlanningShell } from '../PlanningShellContext'

function RadarItem({ task, onRefresh }: { task: Task, onRefresh: () => void }) {
    const [isPending, startTransition] = useTransition()
    const [actionError, setActionError] = useState<string | null>(null)

    const handleBringToToday = () => {
        startTransition(async () => {
            const res = await bringRadarTaskToTodayAction(task.id)
            if (res.error) {
                setActionError(res.error)
                setTimeout(() => setActionError(null), 3000)
            } else {
                onRefresh()
            }
        })
    }

    const handleClearDate = () => {
        startTransition(async () => {
            const res = await clearScheduledDateAction(task.id)
            if (res.error) {
                setActionError(res.error)
                setTimeout(() => setActionError(null), 3000)
            } else {
                onRefresh()
            }
        })
    }

    return (
        <li className={`flex flex-col p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-3 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <span className="font-semibold text-gray-900 pr-2">{task.title}</span>
                    {task.area_tag && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: `${task.area_color}20`, color: task.area_color || '#666' }}>
                            {task.area_tag}
                        </span>
                    )}
                </div>
            </div>

            {actionError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                    {actionError}
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    onClick={handleBringToToday}
                    disabled={isPending}
                    className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isPending ? (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Trazer pro Hoje'}
                </button>
                <button
                    onClick={handleClearDate}
                    disabled={isPending}
                    className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    Voltar pro Backlog
                </button>
            </div>
        </li>
    )
}

export function RadarTab() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadTasks = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchRadarTodayTasksAction()
            setTasks(data)
        } catch (err) {
            setError('Falha ao carregar radar.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTasks()
    }, [])

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
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Radar de Hoje</h3>
            </div>

            <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4 text-sm text-blue-800">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Estas tarefas foram agendadas previamente para a data de hoje. Elas <strong>não</strong> estão no seu dia ainda. Escolha o que quer puxar.</p>
            </div>

            {tasks.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center text-center h-[200px] text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-gray-900 text-sm">Nada no radar hoje.</p>
                </div>
            ) : (
                <ul className="list-none">
                    {tasks.map(task => (
                        <RadarItem key={task.id} task={task} onRefresh={loadTasks} />
                    ))}
                </ul>
            )}
        </div>
    )
}
