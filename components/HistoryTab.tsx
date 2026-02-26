'use client'

import { useMemo } from 'react'
import type { Task } from '@/modules/tasks/queries'

type HistoryTabProps = {
    tasks: Task[]
}

export function HistoryTab({ tasks }: HistoryTabProps) {
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {}

        tasks.forEach(task => {
            const dateKey = task.planned_date || 'Desconhecida'
            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(task)
        })

        // Ordenar as chaves de data de forma decrescente
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Desconhecida') return 1;
            if (b === 'Desconhecida') return -1;
            return b.localeCompare(a);
        })

        return sortedKeys.map(key => ({
            date: key,
            items: groups[key]
        }))
    }, [tasks])

    const getCategoryColors = (category: string) => {
        switch (category) {
            case 'deep_work': return 'bg-purple-100 text-purple-700'
            case 'operacional': return 'bg-blue-100 text-blue-700'
            case 'estudo': return 'bg-amber-100 text-amber-700'
            case 'pessoal_saude': return 'bg-emerald-100 text-emerald-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getCategoryName = (category: string) => {
        switch (category) {
            case 'deep_work': return 'Deep Work'
            case 'operacional': return 'Operacional'
            case 'estudo': return 'Estudo'
            case 'pessoal_saude': return 'Saúde & Pessoal'
            default: return 'Geral'
        }
    }

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-10 text-center shadow-sm animate-in fade-in duration-500">
                <div className="text-4xl mb-4 text-gray-300">🕰️</div>
                <h2 className="text-xl font-semibold mb-2">Sem histórico recente</h2>
                <p className="text-gray-500 text-sm font-medium max-w-sm mx-auto">
                    Nenhuma tarefa foi concluída no período selecionado. Suas vitórias aparecerão aqui.
                </p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="space-y-8">
                {groupedTasks.map(group => {
                    let displayDate = group.date;
                    if (displayDate !== 'Desconhecida') {
                        const d = new Date(displayDate + 'T12:00:00') // forçar meio-dia local
                        displayDate = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
                        // Capitalizar o dia da semana
                        displayDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1)
                    }

                    return (
                        <div key={group.date} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                <span className="text-gray-400">📅</span>
                                {displayDate}
                                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                    {group.items.length} {group.items.length === 1 ? 'tarefa' : 'tarefas'}
                                </span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {group.items.map(task => (
                                    <div key={task.id} className="group relative flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">

                                        {/* Status Icon (Completed) */}
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black flex items-center justify-center mr-3">
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>

                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${getCategoryColors(task.category)}`}>
                                                    {getCategoryName(task.category)}
                                                </span>
                                                {task.is_frog && (
                                                    <span title="Sapo do Dia" className="text-sm shadow-sm inline-flex items-center justify-center bg-green-100 rounded-full w-5 h-5">
                                                        🐸
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-semibold text-gray-700 truncate line-through decoration-gray-300">
                                                {task.title}
                                            </h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
