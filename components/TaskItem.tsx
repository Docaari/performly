'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toggleTaskComplete, deleteTask, delegateTask, undelegateTask } from '@/modules/tasks/actions'
import type { Task } from '@/modules/tasks/queries'
import { AreaSelector } from './AreaSelector'
import { getTodayStrClient } from '@/utils/date'

export function TaskItem({ task }: { task: Task }) {
    const [isPendingTransition, startTransition] = useTransition()
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [showDelegate, setShowDelegate] = useState(false)
    const [delegateTo, setDelegateTo] = useState('')
    const [delegateNote, setDelegateNote] = useState('')
    const [showMobileActions, setShowMobileActions] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    const isCompleted = task.status === 'completed'
    const isDelegated = task.status === 'delegated'

    // É uma tarefa comum (não é modelo de rotina)
    const isNormalTask = task.recurrence_type === null
    const isInboxTask = isNormalTask && !task.planned_date && task.status === 'pending'
    const isRoutineInstance = isNormalTask && task.recurrence_parent_id !== null && task.status === 'pending'

    const handleActionResponse = (res?: { error?: string, success?: boolean }) => {
        if (res?.error) {
            setActionError(res.error)
            setTimeout(() => setActionError(null), 4000)
        }
    }

    const handleSkip = () => startTransition(async () => {
        const res = await deleteTask(task.id)
        handleActionResponse(res)
    })

    const handleToggle = () => {
        startTransition(async () => {
            const nextStatus = isCompleted ? 'pending' : 'completed'
            const res = await toggleTaskComplete(task.id, nextStatus)
            handleActionResponse(res)
        })
    }

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        startTransition(async () => {
            const res = await deleteTask(task.id)
            handleActionResponse(res)
        })
    }

    const handleDelegate = () => {
        if (!delegateTo.trim()) return
        startTransition(async () => {
            const res = await delegateTask(task.id, delegateTo.trim(), delegateNote.trim())
            if (!res?.error) setShowDelegate(false)
            handleActionResponse(res)
        })
    }

    const handleResume = () => {
        startTransition(async () => {
            if (isDelegated) {
                const res = await undelegateTask(task.id)
                handleActionResponse(res)
            }
        })
    }

    const handle2Min = () => startTransition(async () => {
        const res = await toggleTaskComplete(task.id, 'completed')
        handleActionResponse(res)
    })

    const renderStatus = (status: string) => {
        switch (status) {
            case 'pending': return <span className="text-gray-500 text-sm font-medium">Pendente</span>;
            case 'in_progress': return <span className="text-blue-600 text-sm font-medium">Em Progresso</span>;
            case 'completed': return <span className="text-green-600 text-sm font-medium">Concluída</span>;
            case 'delegated': return <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Delegada {task.delegated_to && <span className="font-bold underline decoration-blue-200 underline-offset-2">{task.delegated_to}</span>}</span>;
            default: return null;
        }
    }

    const renderCategory = (category?: string) => {
        switch (category) {
            case 'deep_work': return <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex-shrink-0">Deep Work</span>;
            case 'operacional': return <span className="bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex-shrink-0">Operacional</span>;
            case 'estudo': return <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex-shrink-0">Estudo</span>;
            case 'pessoal_saude': return <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex-shrink-0">Pessoal/Saúde</span>;
            default: return null;
        }
    }

    const renderDate = (date: string | null) => {
        if (!date) return <span className="text-gray-400 text-sm flex-shrink-0">Sem data</span>;
        const today = getTodayStrClient();
        if (date === today) return <span className="text-blue-600 font-semibold text-sm flex-shrink-0">Hoje</span>;
        const [y, m, d] = date.split('-');
        return <span className="text-gray-600 text-sm flex-shrink-0">{`${d}/${m}/${y}`}</span>;
    }

    return (
        <li className={`p-4 sm:p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${isPendingTransition ? 'pointer-events-none' : ''}`}>
            <div className="flex items-start gap-4 w-full">

                {isDelegated ? (
                    <button
                        onClick={handleResume}
                        disabled={isPendingTransition}
                        className="shrink-0 flex-none w-auto px-3 h-11 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors hover:border-blue-500 hover:text-blue-600 text-sm font-bold text-gray-400 bg-gray-50"
                        title="Retomar Tarefa"
                    >
                        ↩️ Retomar
                    </button>
                ) : (
                    <button
                        onClick={handleToggle}
                        disabled={isPendingTransition}
                        className={`shrink-0 flex-none w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isCompleted
                            ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600'
                            : 'border-gray-300 hover:border-green-500 bg-white'
                            }`}
                        aria-label={isCompleted ? "Desmarcar tarefa" : "Concluir tarefa"}
                    >
                        {isPendingTransition ? (
                            <svg className={`animate-spin w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isCompleted && (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                )}

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                        <div className="flex items-center justify-between w-full sm:w-auto">
                            <div className="flex items-center gap-2 max-w-full pr-2">
                                <h3 className={`font-semibold text-gray-900 break-words line-clamp-2 ${isCompleted ? 'line-through opacity-50' : ''}`}>
                                    {task.title}
                                </h3>
                                {task.is_frog && <span className="text-xl leading-none shrink-0" title="Sapo do Dia">🐸</span>}
                                {!isNormalTask && <span className="text-sm leading-none opacity-50 shrink-0" title="Tarefa Recorrente (Modelo)">🔁</span>}
                            </div>

                            {/* Mobile GTD Toggle */}
                            {isInboxTask && !showDelegate && (
                                <button
                                    onClick={() => setShowMobileActions(!showMobileActions)}
                                    className="sm:hidden text-gray-400 p-1 hover:bg-gray-100 rounded-md shrink-0 focus:outline-none"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Ações (Aparecem no Hover ou sempre em mobile) */}
                        {showDelegate ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 bg-white p-2 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                <input
                                    type="text"
                                    value={delegateTo}
                                    onChange={e => setDelegateTo(e.target.value)}
                                    placeholder="Para quem?"
                                    className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none w-full sm:w-28 focus:border-blue-400 transition-colors"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleDelegate()}
                                />
                                <input
                                    type="text"
                                    value={delegateNote}
                                    onChange={e => setDelegateNote(e.target.value)}
                                    placeholder="Nota (opc)"
                                    className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none w-full sm:w-32 focus:border-blue-400 transition-colors"
                                    onKeyDown={e => e.key === 'Enter' && handleDelegate()}
                                />
                                <div className="flex items-center justify-end gap-1 mt-1 sm:mt-0">
                                    <button onClick={() => setShowDelegate(false)} className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">Cancelar</button>
                                    <button onClick={handleDelegate} disabled={!delegateTo.trim() || isPendingTransition} className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Confirmar</button>
                                </div>
                            </div>
                        ) : (
                            <div className={`flex flex-wrap items-center gap-2 transition-opacity mt-2 sm:mt-0 
                                ${(!isInboxTask && isNormalTask) ? 'sm:opacity-0 sm:group-hover:opacity-100' : ''} 
                                ${isInboxTask ? (showMobileActions ? 'flex' : 'hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100') : 'flex'}
                            `}>

                                {isInboxTask && (
                                    <>
                                        <button onClick={handle2Min} disabled={isPendingTransition} className={`text-[10px] sm:text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 hover:scale-105 active:scale-95 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all outline outline-1 outline-transparent hover:outline-green-200 shadow-sm ${isPendingTransition ? 'opacity-50' : ''}`}>
                                            {isPendingTransition ? 'Fazendo...' : <>Fazer 2m <span className="hidden sm:inline">✅</span></>}
                                        </button>
                                        <button onClick={() => setShowDelegate(true)} disabled={isPendingTransition} className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all outline outline-1 outline-transparent hover:outline-blue-200 shadow-sm">
                                            Delegar <span className="hidden sm:inline">🤝</span>
                                        </button>
                                        <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block"></div>
                                    </>
                                )}

                                {isNormalTask && !isInboxTask && !isDelegated && !task.recurrence_parent_id && (
                                    <Link
                                        href={`/tasks?newRoutineTitle=${encodeURIComponent(task.title)}&newRoutineCategory=${encodeURIComponent(task.category)}`}
                                        className="text-[10px] sm:text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                                    >
                                        <span>Tornar Rotina</span>
                                    </Link>
                                )}

                                {isRoutineInstance && (
                                    <button
                                        onClick={handleSkip}
                                        disabled={isPendingTransition}
                                        className={`text-[10px] sm:text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-md flex items-center gap-1 transition-colors outline outline-1 outline-transparent hover:outline-amber-200 ${isPendingTransition ? 'opacity-50' : ''}`}
                                        title="Pular rotina hoje (não afeta modelo)"
                                    >
                                        <span>{isPendingTransition ? 'Pulando...' : 'Pular ⏭️'}</span>
                                    </button>
                                )}

                                {!isRoutineInstance && (
                                    confirmDelete ? (
                                        <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1.5 rounded-md text-xs border border-red-100">
                                            <span className="font-semibold whitespace-nowrap">Excluir?</span>
                                            <button onClick={handleDelete} className="font-bold hover:underline px-1">Sim</button>
                                            <span className="opacity-50">/</span>
                                            <button onClick={() => setConfirmDelete(false)} className="hover:underline px-1">Não</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleDelete}
                                            disabled={isPendingTransition}
                                            className={`text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors outline outline-1 outline-transparent hover:outline-red-100 ${isPendingTransition ? 'opacity-50' : ''}`}
                                            title="Excluir"
                                        >
                                            {isPendingTransition ? (
                                                <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                        <AreaSelector taskId={task.id} initialTag={task.area_tag} initialColor={task.area_color} disabled={isPendingTransition} />
                        {renderStatus(task.status)}
                        {task.category && renderCategory(task.category)}
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        {renderDate(task.planned_date)}
                    </div>
                </div>

            </div>
            {actionError && (
                <div className="w-full mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{actionError}</span>
                </div>
            )}
        </li>
    )
}
