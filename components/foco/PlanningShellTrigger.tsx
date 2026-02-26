'use client'

import { usePlanningShell } from './PlanningShellContext'

export function PlanningShellTrigger() {
    const { openShell } = usePlanningShell()

    return (
        <button
            type="button"
            onClick={() => openShell('inbox')}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-indigo-700 transition-colors shadow-sm"
        >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Planejar
        </button>
    )
}
