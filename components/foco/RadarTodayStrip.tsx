'use client'

import { usePlanningShell } from './PlanningShellContext'

export function RadarTodayStrip() {
    const { openShell } = usePlanningShell()

    return (
        <button
            type="button"
            onClick={() => openShell('radar')}
            className="w-full mb-8 text-left bg-gradient-to-r from-slate-50 to-white border border-slate-200/60 p-3 rounded-xl flex items-center justify-between group hover:border-indigo-300 hover:shadow-sm transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">
                        Planejar • Ver Radar
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 group-hover:text-indigo-600/70">
                        Há algo te esperando no radar de hoje.
                    </p>
                </div>
            </div>

            <div className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 px-3 py-1.5 rounded-lg bg-white border border-transparent group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-colors flex items-center gap-1">
                Abrir
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    )
}
