'use client'

import { useState, useTransition } from 'react'
import { createTask } from '@/modules/tasks/actions'
import { usePlanningShell } from './PlanningShellContext'

export function QuickCaptureBar() {
    const { openShell, triggerRefreshInbox } = usePlanningShell()
    const [title, setTitle] = useState('')
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || isPending) return

        const currentTitle = title.trim()
        setTitle('') // Optimistic clear
        setError(null)
        setFeedback(null)

        startTransition(async () => {
            // Create as Inbox (planned_date = null) by default
            const formData = new FormData()
            formData.append('title', currentTitle)

            const res = await createTask(formData)

            if (res?.error) {
                setError(res.error)
                setTitle(currentTitle) // Revert on error
                setTimeout(() => setError(null), 4000)
            } else {
                setFeedback('Enviado pra Inbox')
                triggerRefreshInbox()
                setTimeout(() => setFeedback(null), 3500)
            }
        })
    }

    return (
        <div className="mb-8">
            <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Adicionar nova tarefa..."
                    disabled={isPending}
                    className="w-full bg-white border-2 border-transparent focus:border-indigo-400 placeholder-gray-400 text-gray-900 text-lg rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all outline-none pr-32 disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={!title.trim() || isPending}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white font-bold rounded-xl px-5 flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                    {isPending ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <span className="hidden sm:inline">Enter</span>
                            <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </>
                    )}
                </button>
            </form>

            {/* Error State */}
            {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Success Micro-Feedback com "Abrir Planejar" */}
            {feedback && !error && (
                <div className="mt-2 flex items-center justify-between text-sm bg-indigo-50/80 px-4 py-2.5 rounded-xl border border-indigo-100/50 text-indigo-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 font-medium">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feedback}
                    </div>

                    <button
                        type="button"
                        onClick={() => openShell('inbox')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                    >
                        Abrir Planejar
                    </button>
                </div>
            )}
        </div>
    )
}
