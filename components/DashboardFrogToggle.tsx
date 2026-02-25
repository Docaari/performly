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
            className={`text-sm self-start outline outline-2 outline-green-200 outline-offset-0 bg-green-50 text-green-700 px-5 py-2.5 font-bold rounded-xl hover:bg-green-100 hover:outline-green-300 transition-all shadow-sm flex items-center gap-2 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Marcar Sapo como feito
        </button>
    )
}
