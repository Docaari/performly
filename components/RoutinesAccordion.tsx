'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '@/modules/tasks/queries'
import { updateRoutine, disableRoutine, deleteRoutine, createTask } from '@/modules/tasks/actions'

type RoutineProps = {
    routines: Task[]
    newRoutineTitle?: string
    newRoutineCategory?: string
}

export function RoutinesAccordion({ routines, newRoutineTitle, newRoutineCategory }: RoutineProps) {
    const router = useRouter()

    // Se vier props na URL forçamos abertura inicial
    const hasInitialPrefill = Boolean(newRoutineTitle)
    const [isOpen, setIsOpen] = useState(hasInitialPrefill)
    const [isCreating, setIsCreating] = useState(hasInitialPrefill)

    const [isPending, startTransition] = useTransition()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Se as props da URL mudarem repentinamente, forçamos o React a reagir
    useEffect(() => {
        if (newRoutineTitle) {
            setIsOpen(true)
            setIsCreating(true)
        }
    }, [newRoutineTitle])

    const weekdaysNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    const formatRecurrence = (r: Task) => {
        if (r.recurrence_type === 'daily') return 'Diária'
        if (r.recurrence_type === 'weekly' && r.recurrence_weekdays) {
            const days = r.recurrence_weekdays.map(d => weekdaysNames[d]).join(', ')
            return `Semanal: ${days}`
        }
        if (r.recurrence_type === 'monthly' && r.recurrence_month_day) {
            return `Mensal: dia ${r.recurrence_month_day}`
        }
        return 'Recorrência Inválida'
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, taskId: string) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const category = formData.get('category') as string
        const recurrenceType = formData.get('recurrence_type') as string

        const patch: {
            title: string;
            category: string;
            recurrence_type: string;
            recurrence_weekdays: number[] | null;
            recurrence_month_day: number | null;
        } = {
            title,
            category,
            recurrence_type: recurrenceType,
            recurrence_weekdays: null,
            recurrence_month_day: null
        }

        if (recurrenceType === 'weekly') {
            const wds = formData.getAll('recurrence_weekdays')
            if (wds.length === 0) {
                setError('Selecione ao menos um dia da semana.')
                return
            }
            patch.recurrence_weekdays = wds.map(v => parseInt(v as string, 10))
        } else if (recurrenceType === 'monthly') {
            const md = parseInt(formData.get('recurrence_month_day') as string, 10)
            if (isNaN(md) || md < 1 || md > 31) {
                setError('Dia do mês inválido.')
                return
            }
            patch.recurrence_month_day = md
        }

        startTransition(async () => {
            const res = await updateRoutine(taskId, patch)
            if (res?.error) {
                setError(res.error)
            } else {
                setEditingId(null)
            }
        })
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        // Validations antes de enviar
        const recurrenceType = formData.get('recurrence_type') as string
        if (recurrenceType === 'weekly') {
            const wds = formData.getAll('recurrence_weekdays')
            if (wds.length === 0) {
                setError('Selecione ao menos um dia da semana para rotinas semanais.')
                return
            }
        }
        if (recurrenceType === 'monthly') {
            const md = parseInt(formData.get('recurrence_month_day') as string, 10)
            if (isNaN(md) || md < 1 || md > 31) {
                setError('Dia do mês inválido (1-31).')
                return
            }
        }

        startTransition(async () => {
            const res = await createTask(formData)
            if (res?.error) {
                setError(res.error)
            } else {
                setIsCreating(false)
            }
        })
    }

    const handleDisable = (taskId: string) => {
        setError(null)
        startTransition(async () => {
            const res = await disableRoutine(taskId)
            if (res?.error) setError(res.error)
            else setEditingId(null)
        })
    }

    const handleDelete = (taskId: string) => {
        setError(null)
        startTransition(async () => {
            const res = await deleteRoutine(taskId)
            if (res?.error) setError(res.error)
            else {
                setConfirmDeleteId(null)
                setEditingId(null)
            }
        })
    }

    const RoutineForm = ({ task, isNew = false }: { task?: Task, isNew?: boolean }) => {
        const [recType, setRecType] = useState(task?.recurrence_type || 'daily')

        // Preencher defaults se for novo E houver props na query
        const defaultTitle = isNew && newRoutineTitle ? newRoutineTitle : task?.title || ''
        const defaultCategory = isNew && newRoutineCategory ? newRoutineCategory : task?.category || 'deep_work'

        return (
            <form onSubmit={isNew ? handleCreate : (e) => handleUpdate(e, task!.id)} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mt-2 transition-all">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">TÍTULO</label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={defaultTitle}
                            required
                            className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            placeholder="Ex: Correr 5km"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">CATEGORIA</label>
                        <select
                            name="category"
                            defaultValue={defaultCategory}
                            className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            <option value="deep_work">Deep Work / Foco</option>
                            <option value="operacional">Operacional / Burocracia</option>
                            <option value="estudo">Estudos / Leitura</option>
                            <option value="pessoal_saude">Pessoal / Saúde</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-2">REPETIÇÃO</label>
                    <div className="flex gap-2 mb-3 max-w-sm">
                        <select
                            name="recurrence_type"
                            value={recType}
                            onChange={(e) => setRecType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                            className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            <option value="daily">Diária (Todos os dias)</option>
                            <option value="weekly">Semanal (Dias específicos)</option>
                            <option value="monthly">Mensal (Dia específico)</option>
                        </select>
                    </div>

                    {recType === 'weekly' && (
                        <div className="flex flex-wrap gap-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                                <label key={day} className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 has-[:checked]:bg-black has-[:checked]:text-white has-[:checked]:border-black transition-colors">
                                    <input
                                        type="checkbox"
                                        name="recurrence_weekdays"
                                        value={idx}
                                        defaultChecked={task?.recurrence_weekdays?.includes(idx)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-semibold">{day}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {recType === 'monthly' && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Todo dia</span>
                            <input
                                type="number"
                                name="recurrence_month_day"
                                min="1" max="31"
                                defaultValue={task?.recurrence_month_day || 1}
                                className="w-20 min-h-[44px] px-3 rounded-lg border border-gray-300 text-sm text-center focus:ring-2 focus:ring-black focus:outline-none"
                            />
                            <span className="text-sm text-gray-400">do mês</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 mt-4 gap-3">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button type="submit" disabled={isPending} className="flex-1 sm:flex-none bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                            Salvar Rotina
                        </button>
                        <button type="button" onClick={() => {
                            if (isNew) {
                                setIsCreating(false);
                                if (hasInitialPrefill) router.replace('/tasks');
                            } else {
                                setEditingId(null);
                            }
                        }} className="flex-1 sm:flex-none border border-gray-300 bg-white px-5 py-2.5 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                    </div>

                    {!isNew && (
                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                            <button type="button" onClick={() => handleDisable(task!.id)} className="flex-1 sm:flex-none text-xs font-bold text-gray-500 hover:text-amber-600 underline underline-offset-2 px-2 py-1">
                                Desativar Rotina
                            </button>
                        </div>
                    )}
                </div>
            </form>
        )
    }

    return (
        <div className={`mb-8 border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Cabeçalho do Accordion */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h2 className="text-base font-extrabold text-gray-900 leading-tight">Rotinas ({routines.length})</h2>
                        <p className="text-xs font-medium text-gray-500">Gerencie modelos de tarefas recorrentes</p>
                    </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Corpo do Accordion */}
            {isOpen && (
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50">
                    {error && (
                        <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {routines.map(routine => (
                            <div key={routine.id}>
                                {editingId === routine.id ? (
                                    <RoutineForm task={routine} />
                                ) : (
                                    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                                        <div className="flex items-start gap-3 flex-1 mb-3 sm:mb-0">
                                            <span className="text-lg leading-none" title="Rotina Ativa">🔁</span>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{routine.title}</h3>
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">{formatRecurrence(routine)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {confirmDeleteId === routine.id ? (
                                                <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-red-600 mr-1">Excluir?</span>
                                                        <button onClick={() => handleDelete(routine.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">
                                                            Sim
                                                        </button>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                                                            Não
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => setEditingId(routine.id)} className="text-gray-400 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-100" title="Editar Rotina">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(routine.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-gray-100" title="Apagar definitivamente">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {routines.length === 0 && !isCreating && (
                            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-sm font-medium text-gray-500">Nenhuma rotina cadastrada.</p>
                            </div>
                        )}

                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 border-dashed rounded-xl text-sm font-bold text-gray-600 hover:border-black hover:text-black transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Nova Rotina
                            </button>
                        ) : (
                            <RoutineForm isNew />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
