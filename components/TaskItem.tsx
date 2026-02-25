'use client'

import { useTransition } from 'react'
import { toggleTaskComplete } from '@/modules/tasks/actions'
import type { Task } from '@/modules/tasks/queries'

export function TaskItem({ task }: { task: Task }) {
    const [isPending, startTransition] = useTransition()
    const isCompleted = task.status === 'completed'

    const handleToggle = () => {
        startTransition(async () => {
            const nextStatus = isCompleted ? 'pending' : 'completed'
            await toggleTaskComplete(task.id, nextStatus)
        })
    }

    const renderStatus = (status: string) => {
        switch (status) {
            case 'pending': return <span className="text-gray-500 text-sm font-medium">Pendente</span>;
            case 'in_progress': return <span className="text-blue-600 text-sm font-medium">Em Progresso</span>;
            case 'completed': return <span className="text-green-600 text-sm font-medium">Concluída</span>;
            case 'archived': return <span className="text-gray-400 text-sm font-medium">Arquivada</span>;
            default: return null;
        }
    }

    const renderDate = (date: string | null) => {
        if (!date) return <span className="text-gray-400 text-sm">Sem data</span>;
        const todayDate = new Date();
        const today = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        if (date === today) return <span className="text-blue-600 font-semibold text-sm">Hoje</span>;
        const [y, m, d] = date.split('-');
        return <span className="text-gray-600 text-sm">{`${d}/${m}/${y}`}</span>;
    }

    return (
        <li className={`p-4 sm:p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-start gap-4">

                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted
                            ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600'
                            : 'border-gray-300 hover:border-green-500 bg-white'
                        }`}
                    aria-label={isCompleted ? "Desmarcar tarefa" : "Concluir tarefa"}
                >
                    {isCompleted && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-gray-900 ${isCompleted ? 'line-through opacity-50' : ''}`}>
                            {task.title}
                        </h3>
                        {task.is_frog && <span className="text-xl leading-none" title="Sapo do Dia">🐸</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {renderStatus(task.status)}
                        <span className="text-gray-300">•</span>
                        {renderDate(task.planned_date)}
                    </div>
                </div>

            </div>
        </li>
    )
}
