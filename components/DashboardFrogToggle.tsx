'use client'

import { useTransition } from 'react'
import { toggleTaskComplete } from '@/modules/tasks/actions'

interface Props {
    taskId: string
}

export function DashboardFrogToggle({ taskId }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleComplete = () => {
        startTransition(async () => {
            await toggleTaskComplete(taskId, 'completed')
        })
    }

    return (
        <button
            onClick={handleComplete}
            disabled={isPending}
            className={`text-sm self-start outline outline-2 outline-green-200 outline-offset-0 bg-green-50 text-green-700 px-5 py-2.5 font-bold rounded-xl hover:bg-green-100 hover:outline-green-300 transition-all duration-200 shadow-sm flex items-center gap-2 ${isPending ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
            {isPending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {isPending ? 'Processando...' : 'Marcar Sapo como feito'}
        </button>
    )
}
