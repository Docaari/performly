'use client'

import { useState, useTransition } from 'react'
import { togglePlanForToday, setFrogTask, toggleTaskComplete, setFrogTime, setTaskPlannedDate, deleteTask, setTaskScheduledDate, bringTaskToToday } from '@/modules/tasks/actions'
import type { Task } from '@/modules/tasks/queries'
import { AreaSelector } from './AreaSelector'
import { getTodayStrClient, formatServerDateStr } from '@/utils/date'

export function PlanList({ tasks }: { tasks: Task[] }) {
    const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
    const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
    const [scheduledToast, setScheduledToast] = useState<{ taskId: string, date: string | null } | null>(null)

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

    // Data baseada no cliente
    const now = new Date()
    const todayDateStr = getTodayStrClient()

    // Gerar dias da semana
    const currentDay = now.getDay()
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - distanceToMonday + i)
        // Reutilizamos a lógica isolada (em uma lib com dependências externas fariamos melhor, 
        // mas aqui mantemos coerência manual subtraindo offset client-side perfeitamente já que Date API js lida com wrap).
        const tzOffsetMs = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffsetMs).toISOString().split('T')[0]
    })

    const weekdaysNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

    const pendingTasks = tasks.filter(t => t.status !== 'completed' && !deletedIds.has(t.id))

    // As tarefas planejadas para hoje (Top 6)
    const todayTasks = pendingTasks.filter(t => t.planned_date === todayDateStr)

    const atrasadasTasks = pendingTasks.filter(t => t.planned_date && t.planned_date < todayDateStr && !weekDates.includes(t.planned_date))

    // Radar: tarefas agendadas para hoje que ainda não foram puxadas pro planejamento
    const radarTasks = pendingTasks.filter(t => !t.planned_date && t.scheduled_date === todayDateStr)

    // Backlog puro ou com data futura (escondido até o dia radar)
    const backlogTasks = pendingTasks.filter(t => !t.planned_date && t.scheduled_date !== todayDateStr)

    const handleToggle = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
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

    const handleCompleteToggle = (taskId: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await toggleTaskComplete(taskId, currentStatus === 'completed' ? 'pending' : 'completed')
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

    const handleDelete = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await deleteTask(taskId)
            if (res?.error) {
                handleTaskResponse(taskId, res)
            } else {
                // Optimistic UI update: hide immediately AFTER success
                setDeletedIds(prev => {
                    const next = new Set(prev)
                    next.add(taskId)
                    return next
                })
            }
            setConfirmDeleteId(null)
            setTaskPending(taskId, false)
        })
    }

    const handleScheduleDate = (taskId: string, dateStr: string | null) => {
        clearTaskError(taskId)
        setTaskPending(taskId, true)

        startTransition(async () => {
            const res = await setTaskScheduledDate(taskId, dateStr)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)

            if (!res?.error && dateStr) {
                setScheduledToast({ taskId, date: dateStr })
                setTimeout(() => {
                    setScheduledToast(prev => prev?.taskId === taskId ? null : prev)
                }, 5000)
            }
        })
    }

    const handleUndoSchedule = (taskId: string) => {
        setScheduledToast(null)
        handleScheduleDate(taskId, null)
    }

    const handleBringToToday = (taskId: string) => {
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await bringTaskToToday(taskId)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId)
        e.dataTransfer.effectAllowed = 'move'
        setDraggingId(taskId)
    }

    const handleDragEnd = () => {
        setDraggingId(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, targetDate: string | null) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('taskId')
        if (!taskId) return

        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await setTaskPlannedDate(taskId, targetDate)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
        setDraggingId(null)
    }

    const handleMobileMove = (taskId: string, targetDate: string | null) => {
        clearTaskError(taskId)
        setTaskPending(taskId, true)
        startTransition(async () => {
            const res = await setTaskPlannedDate(taskId, targetDate)
            handleTaskResponse(taskId, res)
            setTaskPending(taskId, false)
        })
    }

    const formatShortDate = (dateStr: string) => {
        const [, m, d] = dateStr.split('-')
        return `${d}/${m}`
    }

    // Blocos do Planner
    const plannerBlocks = [
        { id: 'backlog', title: 'Sem data', date: null as string | null, isToday: false, isPast: false, tasks: backlogTasks },
        ...(atrasadasTasks.length > 0 ? [{ id: 'atrasadas', title: 'Atrasadas', date: 'past', isToday: false, isPast: true, tasks: atrasadasTasks }] : []),
        ...weekDates.map((dateStr, idx) => {
            return {
                id: dateStr,
                title: weekdaysNames[idx],
                date: dateStr,
                isToday: dateStr === todayDateStr,
                isPast: dateStr < todayDateStr,
                tasks: pendingTasks.filter(t => t.planned_date === dateStr)
            }
        })
    ]

    return (
        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>

            {/* Box do Top 6 (Foco do Dia) */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Top 6 (Hoje)</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Sapo do Dia: apenas uma prioridade máxima</p>
                    </div>
                    <span className={`text-sm font-bold ${todayTasks.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                        {todayTasks.length}/6 planejadas
                    </span>
                </div>

                {todayTasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 sm:p-12 text-center shadow-sm">
                        <p className="text-gray-500 text-sm font-medium max-w-sm mx-auto">
                            O método Ivy Lee exige restrição. Arraste tarefas abaixo para o bloco de Hoje e defina seu Sapo.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-green-500/30 overflow-hidden shadow-sm shadow-green-100/50">
                        <ul className="divide-y divide-gray-100">
                            {todayTasks.map(task => {
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
                                                    onClick={(e) => handleToggle(task.id, e)}
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
                                                    className={`shrink-0 flex-none min-h-[44px] px-4 rounded-xl text-sm font-bold transition-colors border shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center ${task.is_frog
                                                        ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                                        }`}
                                                    title={task.is_frog ? "Este é o seu Sapo do dia" : "Definir como Sapo do dia"}
                                                >
                                                    {isTaskPending ? (
                                                        <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <span className="text-base leading-none grayscale-[0.2]">🐸</span>
                                                    )}
                                                    {task.is_frog ? 'Sapo Ativo' : 'Definir Sapo'}
                                                </button>
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

            {/* Radar (Hoje) */}
            {radarTasks.length > 0 && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                No Radar (Hoje)
                            </h2>
                            <p className="text-sm text-indigo-600/70 mt-0.5">Tarefas agendadas para hoje aguardando aprovação.</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-400">
                            {radarTasks.length} {radarTasks.length === 1 ? 'item' : 'itens'}
                        </span>
                    </div>

                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden shadow-[inset_0_2px_10px_rgba(79,70,229,0.03)]">
                        <ul className="divide-y divide-indigo-100/50">
                            {radarTasks.map(task => {
                                const isTaskPending = pendingActionIds.has(task.id);
                                return (
                                    <li key={task.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white transition-colors ${isTaskPending ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="flex flex-col gap-1.5 flex-1 pr-4">
                                            <div className="font-semibold text-indigo-900 break-words">{task.title}</div>
                                            <div className="flex items-center">
                                                <AreaSelector taskId={task.id} initialTag={task.area_tag} initialColor={task.area_color} disabled={isTaskPending} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleBringToToday(task.id)}
                                                disabled={isTaskPending}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {isTaskPending ? (
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                    </svg>
                                                )}
                                                Trazer pro Hoje
                                            </button>
                                            <button
                                                onClick={() => handleScheduleDate(task.id, null)}
                                                disabled={isTaskPending}
                                                className="p-2 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Remover do Radar (Adiar para Sem Data)"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {/* Grid do Planner Semanal */}
            <div className="mt-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Planner Semanal</h2>
                    <p className="text-sm text-gray-500 font-medium">Arraste as tarefas para planejar seus dias</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {plannerBlocks.map((block) => {
                        // Não permite drag and drop nas atrasadas para evitar confusão. Elas só servem de origem.
                        const isAtrasadas = block.id === 'atrasadas'

                        return (
                            <div
                                key={block.id}
                                className={`flex flex-col bg-gray-50 rounded-2xl p-4 border transition-colors ${block.isToday ? 'border-green-400 bg-green-50/20 shadow-sm' : 'border-gray-200'
                                    }`}
                                onDragOver={!isAtrasadas ? handleDragOver : undefined}
                                onDrop={!isAtrasadas ? (e) => handleDrop(e, block.date) : undefined}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-bold ${block.isToday ? 'text-green-700' : 'text-gray-800'}`}>
                                        {block.title}
                                    </h3>
                                    {block.date && block.date !== 'past' && (
                                        <span className="text-xs font-semibold text-gray-400">{formatShortDate(block.date)}</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 min-h-[100px] flex-1">
                                    {block.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`group relative p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-black transition-all cursor-grab active:cursor-grabbing ${draggingId === task.id ? 'opacity-50' : 'opacity-100'
                                                } ${task.is_frog ? 'border-green-300' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-semibold text-gray-700 leading-snug break-words">
                                                    {task.title}
                                                    {task.is_frog && <span className="ml-1 grayscale-[0.2]" title="Sapo">🐸</span>}
                                                </span>

                                                {/* Mobile Fallback: Native Select to Move */}
                                                <div className="md:hidden shrink-0">
                                                    <select
                                                        className="appearance-none bg-gray-100 text-gray-500 text-xs font-bold py-1 px-2 rounded-lg border border-gray-200 outline-none"
                                                        value={task.planned_date || ''}
                                                        onChange={(e) => handleMobileMove(task.id, e.target.value === '' ? null : e.target.value)}
                                                    >
                                                        <option value="" disabled>Mover...</option>
                                                        <option value="">Sem data</option>
                                                        {weekDates.map((d, i) => (
                                                            <option key={d} value={d}>{weekdaysNames[i]} ({formatShortDate(d)})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Pequeno chip status do frog, etc */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <AreaSelector taskId={task.id} initialTag={task.area_tag} initialColor={task.area_color} disabled={draggingId === task.id} />
                                                    {block.date && block.isToday ? (
                                                        <div className="text-xs font-medium text-green-600">
                                                            Hoje
                                                        </div>
                                                    ) : !block.date && block.id === 'backlog' ? (
                                                        <div className="relative group/picker inline-flex">
                                                            <input
                                                                type="date"
                                                                id={`schedule-${task.id}`}
                                                                value={task.scheduled_date || ''}
                                                                onChange={(e) => handleScheduleDate(task.id, e.target.value === '' ? null : e.target.value)}
                                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                                title={task.scheduled_date ? `Agendado para ${formatShortDate(task.scheduled_date)}` : 'Agendar (Radar)'}
                                                            />
                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold border transition-colors ${task.scheduled_date ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200 group-hover/picker:border-indigo-300 group-hover/picker:text-indigo-500'}`}>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {task.scheduled_date ? formatShortDate(task.scheduled_date) : 'Agendar no Radar'}
                                                            </div>
                                                        </div>
                                                    ) : <div />}
                                                </div>

                                                {task.planned_date && block.date && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        {confirmDeleteId === task.id ? (
                                                            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-100">
                                                                <span className="font-semibold whitespace-nowrap">Excluir?</span>
                                                                <button onClick={(e) => handleDelete(task.id, e)} className="font-bold hover:underline px-1">Sim</button>
                                                                <span className="opacity-50">/</span>
                                                                <button onClick={() => setConfirmDeleteId(null)} className="hover:underline px-1">Não</button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmDeleteId(task.id)}
                                                                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                                title="Excluir tarefa"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {block.tasks.length === 0 && !isAtrasadas && (
                                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-medium p-4 text-center">
                                            Solte aqui
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Config Toast Fixo */}
            {scheduledToast && (
                <div className="fixed bottom-6 right-6 bg-gray-900 border border-black shadow-2xl text-white px-5 py-4 rounded-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Agendado para {formatShortDate(scheduledToast.date!)} no Radar.</span>
                        <span className="text-xs text-gray-400 mt-0.5">Surgirá isolado na data correta.</span>
                    </div>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button
                        onClick={() => handleUndoSchedule(scheduledToast.taskId)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-bold whitespace-nowrap px-2 transition-colors active:scale-95"
                    >
                        Desfazer
                    </button>
                </div>
            )}
        </div>
    )
}
