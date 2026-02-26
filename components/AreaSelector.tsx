'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { setTaskArea } from '@/modules/tasks/actions'

const AREAS = [
    { tag: 'Trabalho', color: 'slate' },
    { tag: 'Pessoal', color: 'indigo' },
    { tag: 'Saúde', color: 'emerald' },
    { tag: 'Estudo', color: 'amber' },
    { tag: 'Finanças', color: 'rose' }
]

const COLOR_MAP: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-800',
    rose: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-800',
}

const DOT_MAP: Record<string, string> = {
    slate: 'bg-slate-400',
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
}

interface AreaSelectorProps {
    taskId: string;
    initialTag: string | null;
    initialColor: string | null;
    disabled?: boolean;
}

export function AreaSelector({ taskId, initialTag, initialColor, disabled }: AreaSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const handleSelect = (tag: string | null, color: string | null, e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen(false)
        if (tag === initialTag) return

        startTransition(async () => {
            await setTaskArea(taskId, tag, color)
        })
    }

    const currentStyle = initialColor && COLOR_MAP[initialColor]
        ? COLOR_MAP[initialColor]
        : 'bg-transparent text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600'

    return (
        <div className="relative inline-flex items-center shrink-0" ref={popoverRef} onClick={e => e.stopPropagation()}>
            <button
                type="button"
                disabled={disabled || isPending}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors flex items-center justify-center gap-1.5 ${currentStyle} ${isPending ? 'opacity-50 grayscale' : ''}`}
                title="Definir Área"
            >
                {initialTag ? (
                    <>
                        <span className={`w-1.5 h-1.5 rounded-full ${DOT_MAP[initialColor!] || 'bg-gray-400'}`}></span>
                        {initialTag}
                    </>
                ) : (
                    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col gap-0.5">
                        {AREAS.map(area => (
                            <button
                                key={area.tag}
                                onClick={(e) => handleSelect(area.tag, area.color, e)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors w-full text-left
                                    ${initialTag === area.tag ? 'bg-gray-50 text-gray-900 border border-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}
                                `}
                            >
                                <span className={`w-2 h-2 rounded-full ${DOT_MAP[area.color]}`}></span>
                                {area.tag}
                            </button>
                        ))}
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                            onClick={(e) => handleSelect(null, null, e)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Sem área
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
