'use client'

import { useState, useTransition } from 'react'
import { togglePlanForToday } from '@/modules/tasks/actions'
import type { Task } from '@/modules/tasks/queries'

export function PlanList({ tasks }: { tasks: Task[] }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Data baseada no cliente (UTC Date String para bater com supabase date)
    const todayDateStr = new Date().toISOString().split('T')[0]

    // As tarefas planejadas para o dia e as tarefas totais
    const todayTasks = tasks.filter(t => t.planned_date === todayDateStr)

    // Tarefas elegíveis são estritamente as pendentes ou em progresso que não estão batizadas para hoje.
    const eligibleTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.planned_date !== todayDateStr)

    const handleToggle = (taskId: string) => {
        setError(null)
        startTransition(async () => {
            const res = await togglePlanForToday(taskId)
            if (res?.error) setError(res.error)
        })
    }

    return (
        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 shadow-sm font-medium">
                    {error}
                </div>
            )}

            {/* Box do Top 6 */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-extrabold text-gray-900">Top 6 (Hoje)</h2>
                    <span className={`text-sm font-bold ${todayTasks.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                        {todayTasks.length}/6 planejadas
                    </span>
                </div>

                {todayTasks.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center text-gray-400 text-sm font-medium">
                        Nenhuma tarefa selecionada. Transfira as tarefas do Backlog para cá.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-green-500/30 overflow-hidden shadow-sm shadow-green-100/50">
                        <ul className="divide-y divide-gray-100">
                            {todayTasks.map(task => (
                                <li key={task.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <button
                                        onClick={() => handleToggle(task.id)}
                                        className="shrink-0 w-6 h-6 rounded border-2 border-black bg-black text-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors"
                                        title="Remover de hoje"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{task.title}</span>
                                        {task.is_frog && <span className="text-lg leading-none">🐸</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Box do Backlog */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Backlog na Central</h2>
                {eligibleTasks.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center text-gray-400 text-sm font-medium">
                        Não há tarefas pendentes disponíveis para planejar.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <ul className="divide-y divide-gray-100">
                            {eligibleTasks.map(task => (
                                <li key={task.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleToggle(task.id)}>
                                    <button className="shrink-0 w-6 h-6 rounded border-2 border-gray-300 text-gray-400 flex items-center justify-center pointer-events-none transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <span className="font-medium text-gray-600">{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
