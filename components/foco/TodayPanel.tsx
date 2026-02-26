'use client'

import { useState, useTransition } from 'react'
import { toggleTaskComplete, setFrogTask, setFrogTime, togglePlanForToday, delegateTask } from '@/modules/tasks/actions'
import type { Task } from '@/modules/tasks/queries'
import { AreaSelector } from '@/components/AreaSelector'
import { usePlanningShell } from './PlanningShellContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TodayPanel({ tasks }: { tasks: Task[] }) {
    const { refreshTodayKey } = usePlanningShell()
    const router = useRouter()

    const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
    const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set())
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isPendingGlobal, startTransition] = useTransition()

    // Fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        if (refreshTodayKey > 0) {
            startTransition(() => {
                router.refresh()
            })
        }
    }, [refreshTodayKey, router])

    const setTaskPending = (id: string, pending: boolean) => {
        setPendingActionIds(prev => {
            const next = new Set(prev)
            if (pending) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const clearTaskError = (id: string) => {
        setActionErrors(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    const handleTaskResponse = (taskId: string, res?: { error?: string }) => {
        if (res?.error) {
            setActionErrors(prev => ({ ...prev, [taskId]: res.error as string }))
            setTimeout(() => clearTaskError(taskId), 4000)
        }
    }

    const handleCompleteToggle = (taskId: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            // Reusing the toggle action
            const res = await toggleTaskComplete(taskId, currentStatus === 'completed' ? 'pending' : 'completed')
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const handleToggleToday = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            // Remove from today (returns to backlog)
            const res = await togglePlanForToday(taskId)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const handleFrogToggle = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await setFrogTask(taskId)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const handleTimeChange = (taskId: string, timeValue: string) => {
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await setFrogTime(taskId, timeValue || null)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const handleDelegate = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setOpenMenuId(null)

        // MVP: Simple window prompt for the assignee name
        const delegatedTo = window.prompt("Para quem você quer delegar essa tarefa?")
        if (delegatedTo === null) return // Cancelled

        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await delegateTask(taskId, delegatedTo)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const toggleMenu = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setOpenMenuId(prev => prev === taskId ? null : taskId)
    }

    return (
        <div className={`transition-opacity duration-200 ${isPendingGlobal ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Hoje (Top 6)</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Sapo do Dia: apenas uma prioridade máxima</p>
                </div>
                <span className={`text-sm font-bold ${tasks.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                    {tasks.length}/6 planejadas
                </span>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 sm:p-12 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium max-w-sm mx-auto">
                        Seu dia está livre. Abra o seu Planejador para puxar tarefas importantes para o foco de hoje.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-green-500/30 overflow-hidden shadow-sm shadow-green-100/50">
                    <ul className="divide-y divide-gray-100">
                        {tasks.map(task => {
                            const isCompleted = task.status === 'completed';
                            const isTaskPending = pendingActionIds.has(task.id);

                            return (
                                <li key={task.id} className={`p-4 sm:p-5 flex flex-col hover:bg-gray-50 transition-colors ${task.is_frog ? 'bg-green-50/30' : ''}`}>
                                    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 ${isTaskPending ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleCompleteToggle(task.id, task.status, e)}
                                                disabled={isTaskPending}
                                                className={`shrink-0 flex-none w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isCompleted
                                                    ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600'
                                                    : 'bg-white border-gray-300 text-transparent hover:border-green-400'
                                                    }`}
                                                title={isCompleted ? "Desmarcar" : "Concluir Tarefa"}
                                            >
                                                {isTaskPending ? (
                                                    <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className={`w-5 h-5 ${isCompleted ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>

                                            <button
                                                onClick={(e) => handleToggleToday(task.id, e)}
                                                disabled={isTaskPending}
                                                className="shrink-0 flex-none w-11 h-11 rounded-xl border-2 border-black bg-black text-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm"
                                                title="Remover de hoje"
                                            >
                                                {isTaskPending ? (
                                                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-semibold pr-2 break-words transition-all ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {task.title}
                                                </span>
                                                <AreaSelector taskId={task.id} initialTag={task.area_tag} initialColor={task.area_color} disabled={isTaskPending} />
                                            </div>

                                            {/* Botão de Frog */}
                                            <button
                                                onClick={(e) => handleFrogToggle(task.id, e)}
                                                disabled={task.is_frog || isTaskPending}
                                                className={`shrink-0 flex-none min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors border shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center ${task.is_frog
                                                    ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                                    }`}
                                                title={task.is_frog ? "Este é o seu Sapo do dia" : "Definir como Sapo do dia"}
                                            >
                                                {isTaskPending && !task.is_frog ? (
                                                    <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <span className="text-base leading-none grayscale-[0.2]">🐸</span>
                                                )}
                                                <span className="hidden sm:inline">{task.is_frog ? 'Sapo Ativo' : 'Definir Sapo'}</span>
                                            </button>

                                            {/* Menu de Ações Secundárias (Delegate) */}
                                            <div className="relative shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                                <button
                                                    onClick={(e) => toggleMenu(task.id, e)}
                                                    disabled={isTaskPending}
                                                    className="w-full sm:w-11 h-10 sm:h-11 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center shadow-sm"
                                                    title="Mais ações"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>

                                                {openMenuId === task.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in slide-in-from-top-2">
                                                        <button
                                                            onClick={(e) => handleDelegate(task.id, e)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium flex items-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            Delegar...
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Frog Anchor Inline UI */}
                                    {task.is_frog && !isCompleted && (
                                        <div className="w-full mt-3 pt-3 border-t border-green-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <p className="text-sm font-bold text-green-800">A que horas você pretende começar este Sapo amanhã?</p>
                                                <p className="text-xs text-green-600/70 mt-0.5">Não é um alarme. É só uma promessa com você mesmo.</p>
                                            </div>
                                            <input
                                                type="time"
                                                defaultValue={task.intended_start_time || ''}
                                                onBlur={(e) => handleTimeChange(task.id, e.target.value)}
                                                disabled={isTaskPending}
                                                className="min-h-[44px] px-3 rounded-xl border border-green-300 bg-white text-green-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm shrink-0"
                                            />
                                        </div>
                                    )}

                                    {actionErrors[task.id] && (
                                        <div className="w-full mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100 flex items-center gap-2">
                                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{actionErrors[task.id]}</span>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}
