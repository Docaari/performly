'use client'

import { useState, useTransition } from 'react'
import { updateNorteObjective } from '@/modules/tasks/actions'

export function NorteBanner({ initialObjective }: { initialObjective: string | null }) {
    const [isEditing, setIsEditing] = useState(false)
    const [objective, setObjective] = useState(initialObjective || '')
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        setIsEditing(false)
        const newObj = objective.trim()
        if (newObj !== (initialObjective || '')) {
            startTransition(async () => {
                await updateNorteObjective(newObj === '' ? null : newObj)
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
        if (e.key === 'Escape') {
            setObjective(initialObjective || '')
            setIsEditing(false)
        }
    }

    return (
        <div className="mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${isEditing ? 'border-amber-300 ring-4 ring-amber-50' : 'border-dashed border-gray-300 hover:border-amber-200'}`}>
                {/* Background Decorativo Suave */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-white to-orange-50/30 -z-10" />

                <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="shrink-0 pt-1 sm:pt-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center border border-amber-200/50 shadow-sm">
                            <span className="text-xl">🧭</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">Direção Estratégica</span>
                        </div>

                        {isEditing ? (
                            <input
                                type="text"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                                placeholder="Qual o seu grande objetivo de longo prazo atual?"
                                className="w-full bg-transparent border-none p-0 text-lg sm:text-xl font-bold text-gray-900 focus:ring-0 placeholder:text-gray-400/70 py-1"
                                autoFocus
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={isPending}
                                className={`text-left w-full truncate py-1 text-lg sm:text-xl font-bold transition-colors ${objective ? 'text-gray-900' : 'text-gray-400 italic'}`}
                            >
                                {objective || "Defina seu Norte..."}
                            </button>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                Editar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
