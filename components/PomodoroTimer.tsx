'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPomodoro } from '@/modules/pomodoros/actions'
import { toggleTaskComplete } from '@/modules/tasks/actions'

interface Props {
    taskId: string
    taskTitle: string
}

export function PomodoroTimer({ taskId, taskTitle }: Props) {
    const DEFAULT_TIME = 25 * 60

    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME)
    const [isActive, setIsActive] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [isFrogCompleted, setIsFrogCompleted] = useState(false)
    const [isPendingComplete, startTransitionComplete] = useTransition()

    const handleComplete = async () => {
        setIsSaving(true)
        // Persiste no banco invocando Server Action
        const res = await createPomodoro(taskId, 25)
        setIsSaving(false)

        if (res?.success) {
            const audio = new Audio('/notification.mp3') // Optional ding se tivermos assets
            audio.play().catch(() => { })

            setSuccessMsg("Pomodoro registrado ✅")
            setTimeout(() => {
                setSuccessMsg(null)
                setTimeLeft(DEFAULT_TIME)
            }, 4000)
        } else {
            alert("Erro ao salvar o pomodoro. Verifique sua conexão.")
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1)
            }, 1000)
        } else if (isActive && timeLeft === 0) {
            // Removendo chamadas síncronas de state no body pra evitar lint error
            // Agendando pro próximo tick ou tratando logicamente
            setTimeout(() => {
                setIsActive(false)
                handleComplete()
            }, 0)
        }

        return () => clearInterval(interval)
        // Usamos regra desativada pra evitar que re-criar o function handleComplete toda hora dispare o recuo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, timeLeft])

    const toggleTimer = () => {
        if (timeLeft === 0) setTimeLeft(DEFAULT_TIME)
        setIsActive(!isActive)
    }

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(DEFAULT_TIME)
        setSuccessMsg(null)
    }

    const triggerDevTest = () => {
        setTimeLeft(5)
        if (!isActive) setIsActive(true)
    }

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
    const secs = (timeLeft % 60).toString().padStart(2, '0')

    const handleCompleteFrog = () => {
        startTransitionComplete(async () => {
            const res = await toggleTaskComplete(taskId, 'completed')
            if (!res?.error) {
                setIsFrogCompleted(true)
                setSuccessMsg("Dia Vencido! 🏆\nSapo Concluído com Sucesso.")
                setIsActive(false)
            }
        })
    }

    const showCompleteFrogButton = !isActive && timeLeft === DEFAULT_TIME && !isFrogCompleted && !successMsg
    const showCompleteFrogWhenPaused = !isActive && timeLeft < DEFAULT_TIME && timeLeft > 0 && !isFrogCompleted

    return (
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-14 text-center shadow-sm relative overflow-hidden">

            {process.env.NODE_ENV === 'development' && (
                <button onClick={triggerDevTest} className="absolute top-4 right-4 text-xs font-mono font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md hover:bg-amber-200 transition-colors">
                    [Testar 5s]
                </button>
            )}

            <div className="mb-4">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-3xl mb-4 border-4 border-green-100 shadow-inner">
                    🐸
                </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 truncate px-4" title={taskTitle}>
                {taskTitle}
            </h2>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Devore o Sapo até o final do cronômetro sem nenhuma distração externa.</p>

            {successMsg ? (
                <div className="py-12 flex flex-col items-center justify-center animate-pulse">
                    <span className="text-4xl mb-4">🏆</span>
                    <div className="text-xl font-bold text-green-600">
                        {successMsg}
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-8xl sm:text-9xl font-black text-gray-900 tracking-tight tabular-nums mb-12">
                        {mins}:{secs}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <button
                            onClick={toggleTimer}
                            disabled={isSaving || isFrogCompleted}
                            className={`w-full flex-1 py-4 px-6 rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-sm ${isActive
                                ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 active:scale-[0.98]'
                                : 'bg-black text-white border-2 border-black hover:bg-gray-800 active:scale-[0.98]'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isActive ? 'Pausar' : 'Iniciar Foco'}
                        </button>
                        <button
                            onClick={resetTimer}
                            disabled={isSaving || isFrogCompleted}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg sm:text-xl border-2 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Resetar
                        </button>
                    </div>

                    {(showCompleteFrogButton || showCompleteFrogWhenPaused) && (
                        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center animate-in fade-in duration-500">
                            <button
                                onClick={handleCompleteFrog}
                                disabled={isPendingComplete}
                                className={`text-sm outline outline-2 outline-green-200 outline-offset-0 bg-green-50 text-green-700 px-5 py-2.5 font-bold rounded-xl hover:bg-green-100 hover:outline-green-300 transition-all shadow-sm flex items-center gap-2 ${isPendingComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isPendingComplete ? (
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isPendingComplete ? 'Concluindo...' : 'Marcar Sapo como Concluído'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
