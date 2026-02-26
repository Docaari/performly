'use client'

import { useState, useEffect, useTransition } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd'
import { fetchWeekPlannerTasksAction } from '@/modules/tasks/weekPlannerActions'
import { moveTaskPlannedDateAction } from '@/modules/tasks/weekMutations'
import { getTodayStrClient, formatServerDateStr } from '@/utils/date'
import type { Task } from '@/modules/tasks/queries'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Formata dia como '24 fev' 
function formatDayShort(dateStr: string) {
    const d = new Date(`${dateStr}T12:00:00`)
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace(' de ', ' ')
}

export function WeekPlanner() {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [weekDates, setWeekDates] = useState<{ date: string, label: string, isToday: boolean }[]>([])

    const todayStr = getTodayStrClient()

    useEffect(() => {
        // Build this week's dates
        const now = new Date(`${todayStr}T12:00:00`)
        const currentDay = now.getDay()
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1

        const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now)
            d.setDate(d.getDate() - distanceToMonday + i)
            const dateStr = formatServerDateStr(d)
            return {
                date: dateStr,
                label: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i],
                isToday: dateStr === todayStr
            }
        })
        setWeekDates(dates)

        const loadWeekTasks = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchWeekPlannerTasksAction(dates[0].date, dates[6].date)
                setTasks(data)
            } catch (err) {
                setError('Falha ao carregar semana.')
            } finally {
                setLoading(false)
            }
        }

        loadWeekTasks()
    }, [todayStr])

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

    const onDragStart = () => {
        // Sinaliza globalmente que um drag está ativo
        // Impede que Refreshers como DayBoundary destruam a UI
        if (typeof document !== 'undefined') {
            document.body.dataset.dragging = "1"
        }
    }

    const onDragEnd = (result: DropResult) => {
        if (typeof document !== 'undefined') {
            document.body.dataset.dragging = "0"
        }

        const { source, destination, draggableId } = result

        // Dropped outside a valid container
        if (!destination) return

        // Dropped in the same place
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return
        }

        const sourceDate = source.droppableId
        const targetDate = destination.droppableId

        // Optismistic UI locally:
        const movedTask = tasks.find(t => t.id === draggableId)
        if (!movedTask) return

        const newTasks = Array.from(tasks)
        const taskIndex = newTasks.findIndex(t => t.id === draggableId)

        // Update planned date locally
        newTasks[taskIndex] = { ...movedTask, planned_date: targetDate }

        // Em um app completo, poderíamos ordenar e atualizar `order_index`. 
        // Para o MVP (U5.1), movemos de dia. A ordem real será resolvida na refatoração do backend.
        setTasks(newTasks)

        // Mutate Database
        startTransition(async () => {
            const res = await moveTaskPlannedDateAction(draggableId, targetDate, destination.index)
            if (res.error) {
                // Revert optimistic on error
                setError('Falha ao mover tarefa.')
                setTasks(tasks) // revert to old state
                setTimeout(() => setError(null), 3000)
            } else {
                // If the target date was today, or source was today, we must tell Next to refresh!
                if (targetDate === todayStr || sourceDate === todayStr) {
                    router.refresh()
                }
            }
        })
    }

    // Strict Mode / Suspense Workaround for react-beautiful-dnd
    if (!process.browser && typeof window === 'undefined') {
        // O DnD precisa de window, evitamos SSR quebrados num lazy load forçado.
        // Porém, sendo Client Component já ajuda.
    }

    return (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className={`flex flex-col h-full bg-slate-50 min-h-screen transition-opacity duration-200 ${isPending ? 'opacity-75 pointer-events-none' : ''}`}>
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm flex items-center justify-between sticky top-0 z-20">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Link href="/foco" className="p-2 -ml-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            Planejamento Semanal
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 pl-11 sm:pl-14">
                            Arraste as tarefas entre os dias. Planeje focando no longo prazo.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 mx-4 mt-4 rounded-xl border border-red-100 shadow-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-x-auto overflow-y-auto w-full no-scrollbar relative p-4 sm:p-8 pb-32">
                    {/* Alteração do Grid: Flex Row em Desktop, Flex Col em Mobile */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-full lg:min-w-max h-full">
                        {weekDates.map(dayInfo => {
                            const dayTasks = tasks.filter(t => t.planned_date === dayInfo.date)
                            const isWeekend = dayInfo.label === 'Sáb' || dayInfo.label === 'Dom'

                            return (
                                <div key={dayInfo.date} className="w-full lg:w-[320px] flex flex-col shrink-0 lg:h-full min-h-[250px] bg-white lg:bg-transparent rounded-2xl lg:rounded-none p-4 lg:p-0 shadow-sm lg:shadow-none border border-gray-100 lg:border-none">
                                    {/* Header da Coluna */}
                                    <div className={`flex items-center justify-between mb-3 px-1 ${isWeekend ? 'opacity-60' : ''}`}>
                                        <h4 className="font-bold flex items-center gap-2 text-sm">
                                            <span className={`${dayInfo.isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} w-7 h-7 rounded-sm flex items-center justify-center font-bold text-xs`}>
                                                {dayInfo.date.split('-')[2]}
                                            </span>
                                            <span className={dayInfo.isToday ? 'text-indigo-900' : 'text-gray-900'}>
                                                {dayInfo.label}
                                            </span>
                                        </h4>
                                        <span className="text-xs font-semibold text-gray-400 bg-gray-100/50 px-2 py-0.5 rounded-full">
                                            {dayTasks.length}
                                        </span>
                                    </div>

                                    {/* Droppable Area */}
                                    <Droppable droppableId={dayInfo.date}>
                                        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 rounded-xl p-2 min-h-[150px] shadow-sm flex flex-col gap-2 transition-colors border ${snapshot.isDraggingOver ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white/60 border-gray-200/50'}`}
                                            >
                                                {dayTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-white border rounded-lg p-3 shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg border-indigo-300 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-200'}`}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    // Prevent scroll jumping by stabilizing the transform if needed
                                                                }}
                                                            >
                                                                <div className="text-sm font-semibold text-gray-800 break-words mb-2 pl-1 border-l-2 border-transparent">
                                                                    {task.title}
                                                                </div>
                                                                {task.area_tag && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                                                                        style={{ backgroundColor: `${task.area_color}25`, color: task.area_color || '#666' }}>
                                                                        {task.area_tag}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 font-medium">
                                                        Nada agendado
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </DragDropContext>
    )
}
