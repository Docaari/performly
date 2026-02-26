'use client'

import { useEffect } from 'react'
import { usePlanningShell } from './PlanningShellContext'
import { InboxTab } from './tabs/InboxTab'
import { RadarTab } from './tabs/RadarTab'
import Link from 'next/link'

export function PlanningShell() {
    const { isOpen, closeShell, activeTab, setTab } = usePlanningShell()

    // Evita o scroll no background quando o Shell está aberto (Overlay mode)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    return (
        <>
            {/* Overlay Escurecido e Desfocado (Muralha) */}
            <div
                className={`fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-[2px] transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeShell}
                aria-hidden="true"
            />

            {/* O Shell: Bottom Sheet (Mobile) ou Drawer Lateral (Desktop) */}
            <div className={`fixed z-[110] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                bottom-0 left-0 right-0 top-[10%] rounded-t-3xl
                sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[450px] md:w-[500px] sm:rounded-none sm:translate-y-0
                ${isOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full'}
            `}>
                {/* Grabber visual para Mobile */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer" onClick={closeShell}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                </div>

                {/* Header Navbar do Shell */}
                <div className="flex items-center justify-between px-6 py-4 sm:pt-6 border-b border-gray-100">
                    <h2 className="text-2xl font-extrabold text-gray-900">Planejar</h2>
                    <button onClick={closeShell} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navbar de Tabs */}
                <div className="flex px-6 pt-2 gap-6 border-b border-gray-100 overflow-x-auto no-scrollbar shrink-0 justify-between items-center">
                    <div className="flex gap-6">
                        {(['inbox', 'radar'] as const).map(tab => {
                            const labels = { inbox: 'Inbox', radar: 'Radar' }
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setTab(tab)}
                                    className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {labels[tab]}
                                </button>
                            )
                        })}
                    </div>

                    {/* Link Externo para a Página Semana */}
                    <Link
                        href="/foco/semana"
                        onClick={closeShell}
                        className="pb-3 text-sm font-bold whitespace-nowrap flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                        Semana
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                </div>

                {/* Content Area das Gavetas */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 relative">
                    {/* Renderizamos condicionalmente. Fetching pesado só vai ocorrer dentro do componente ao ser montado */}
                    {activeTab === 'inbox' && <InboxTab />}
                    {activeTab === 'radar' && <RadarTab />}
                </div>
            </div>
        </>
    )
}
