'use client'

import { useState, useTransition } from 'react'
import { saveWeeklyBudgets } from '@/modules/review/actions'
import type { WeeklyBudgetStat } from '@/modules/review/queries'

interface Props {
    weekStart: string
    stats: Record<string, WeeklyBudgetStat>
}

export function WeeklyBudgets({ weekStart, stats }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [msg, setMsg] = useState<string | null>(null)

    // Form states
    const [deepWork, setDeepWork] = useState(stats['deep_work']?.planned || 0)
    const [operacional, setOperacional] = useState(stats['operacional']?.planned || 0)
    const [estudo, setEstudo] = useState(stats['estudo']?.planned || 0)
    const [pessoalSaude, setPessoalSaude] = useState(stats['pessoal_saude']?.planned || 0)

    const totalPlanned = deepWork + operacional + estudo + pessoalSaude
    const hasAnyBudget = Object.values(stats).some(s => s.planned > 0)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setMsg(null)

        startTransition(async () => {
            const budgets = {
                'deep_work': deepWork,
                'operacional': operacional,
                'estudo': estudo,
                'pessoal_saude': pessoalSaude
            }

            const res = await saveWeeklyBudgets(weekStart, budgets)
            if (res.error) {
                setMsg(res.error)
            } else {
                setMsg('Salvo')
                setIsEditing(false)
                setTimeout(() => setMsg(null), 3000)
            }
        })
    }

    const renderBar = (stat: WeeklyBudgetStat) => {
        if (stat.planned === 0 && stat.executed === 0) return null

        // Se planejou 0 mas executou (esforço livre), tratar barra como 100% cheia ou over-limit
        const percentage = stat.planned > 0
            ? Math.min((stat.executed / stat.planned) * 100, 100)
            : 100

        const isComplete = stat.executed >= stat.planned && stat.planned > 0

        const getBgColor = (category: string) => {
            switch (category) {
                case 'deep_work': return 'bg-purple-500'
                case 'operacional': return 'bg-orange-500'
                case 'estudo': return 'bg-blue-500'
                case 'pessoal_saude': return 'bg-teal-500'
                default: return 'bg-gray-500'
            }
        }

        const getEmoji = (category: string) => {
            switch (category) {
                case 'deep_work': return '🧠'
                case 'operacional': return '⚙️'
                case 'estudo': return '📚'
                case 'pessoal_saude': return '🧘‍♂️'
                default: return '📌'
            }
        }

        const getName = (category: string) => {
            switch (category) {
                case 'deep_work': return 'Deep Work'
                case 'operacional': return 'Operacional'
                case 'estudo': return 'Estudo'
                case 'pessoal_saude': return 'Pessoal/Saúde'
                default: return category
            }
        }

        return (
            <div key={stat.category} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center text-sm font-bold mb-1.5">
                    <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="opacity-80">{getEmoji(stat.category)}</span> {getName(stat.category)}
                    </span>
                    <span className={isComplete ? 'text-green-600' : 'text-gray-500'}>
                        {stat.executed} <span className="text-gray-400 font-medium hidden sm:inline">/ {stat.planned} 🍅</span>
                    </span>
                </div>
                {stat.planned > 0 && (
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                            className={`h-full ${getBgColor(stat.category)} transition-all duration-700`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </div>
        )
    }

    // Format week
    const dateObj = new Date(weekStart + 'T00:00:00')
    const weekLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(dateObj)

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm relative overflow-hidden group transition-colors duration-300 hover:border-gray-200">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 text-8xl opacity-[0.02] transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">⚖️</div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Semana Atual</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Semana de {weekLabel}</p>
                </div>

                {hasAnyBudget && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors duration-200 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200"
                    >
                        Editar Orçamento
                    </button>
                )}
            </div>

            {!hasAnyBudget && !isEditing ? (
                <div className="text-center py-6 relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-4">A intenção precede a execução.</p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-bold text-black border-2 border-black rounded-xl px-5 py-2.5 hover:bg-black hover:text-white transition-all duration-200 shadow-sm"
                    >
                        Definir Orçamento de Tempo
                    </button>
                </div>
            ) : isEditing ? (
                <form onSubmit={handleSave} className={`relative z-10 animate-in fade-in duration-300 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-bold text-gray-700">🧠 Deep Work (🍅)</label>
                            <input type="number" min="0" value={deepWork} onChange={e => setDeepWork(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-center font-bold" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-bold text-gray-700">⚙️ Operacional (🍅)</label>
                            <input type="number" min="0" value={operacional} onChange={e => setOperacional(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-center font-bold" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-bold text-gray-700">📚 Estudo (🍅)</label>
                            <input type="number" min="0" value={estudo} onChange={e => setEstudo(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-center font-bold" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-bold text-gray-700">🧘‍♂️ Pessoal/Saúde (🍅)</label>
                            <input type="number" min="0" value={pessoalSaude} onChange={e => setPessoalSaude(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-center font-bold" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {msg ? (
                            <span className="text-sm font-bold text-green-600">{msg}</span>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium">Total: {totalPlanned} pomodoros</span>
                        )}

                        <div className="flex gap-2">
                            {hasAnyBudget && (
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-lg">Cancelar</button>
                            )}
                            <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-xl shadow-sm transition-colors">
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="animate-in fade-in duration-500">
                    {/* Render actual execution bars */}
                    {Object.values(stats).map(renderBar)}
                </div>
            )}
        </div>
    )
}
