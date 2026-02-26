'use client'

import { useState, useTransition } from 'react'
import { upsertDailyReflection } from '@/modules/review/actions'
import type { DailyReflection } from '@/modules/review/queries'

type DailyReflectionPanelProps = {
    date: string
    initialReflection: DailyReflection | null
}

export function DailyReflectionPanel({ date, initialReflection }: DailyReflectionPanelProps) {
    // Se não há reflection, começamos "editando" (em modo aberto)
    const [isEditing, setIsEditing] = useState(!initialReflection)

    // Estados do Form
    const [rating, setRating] = useState<'bad' | 'ok' | 'great' | null>(initialReflection?.rating || null)
    const [note, setNote] = useState(initialReflection?.note || '')
    const [sleepQuality, setSleepQuality] = useState<'good' | 'fair' | 'poor' | null>(initialReflection?.sleep_quality || null)
    const [sleepHours, setSleepHours] = useState<string>(initialReflection?.sleep_hours ? initialReflection.sleep_hours.toString() : '')

    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSave = () => {
        if (!rating) {
            setError('Selecione como foi o seu foco hoje.')
            return
        }

        setError(null)
        startTransition(async () => {
            const res = await upsertDailyReflection({
                date,
                rating,
                note: note.trim(),
                sleepQuality,
                sleepHours: sleepHours ? Number(sleepHours) : null
            })

            if (res?.error) {
                setError(res.error)
            } else {
                setIsEditing(false)
            }
        })
    }

    if (!isEditing) {
        // Estado Compacto (Salvo)
        const ratingEmoji = initialReflection?.rating === 'great' ? '🤩' : initialReflection?.rating === 'ok' ? '😐' : '😞'
        const ratingText = initialReflection?.rating === 'great' ? 'Ótimo' : initialReflection?.rating === 'ok' ? 'OK' : 'Ruim'

        return (
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:px-8 py-5 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-lg">
                        {ratingEmoji}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            Reflexão salva ✓
                            <span className="text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-100 uppercase tracking-widest">{ratingText}</span>
                        </div>
                        {initialReflection?.note && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5 opacity-80 max-w-sm">&quot;{initialReflection.note}&quot;</p>
                        )}
                        {(initialReflection?.sleep_quality || initialReflection?.sleep_hours) && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 font-medium">
                                <span className="opacity-70">🌙</span>
                                {initialReflection.sleep_quality === 'good' ? 'Bom' : initialReflection.sleep_quality === 'fair' ? 'Médio' : initialReflection.sleep_quality === 'poor' ? 'Ruim' : ''}
                                {initialReflection.sleep_quality && initialReflection.sleep_hours ? ' • ' : ''}
                                {initialReflection.sleep_hours ? `${initialReflection.sleep_hours}h` : ''}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 rounded-xl transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                    Editar
                </button>
            </div>
        )
    }

    // Estado Form (Edição / Novo)
    return (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-2xl opacity-80">💭</span> Como foi seu foco hoje?
            </h3>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4 border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => setRating('bad')}
                    disabled={isPending}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold ${rating === 'bad' ? 'border-red-400 bg-red-50 text-red-900 scale-105 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                    <span className="text-xl">😞</span>
                    Ruim
                </button>
                <button
                    onClick={() => setRating('ok')}
                    disabled={isPending}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold ${rating === 'ok' ? 'border-amber-400 bg-amber-50 text-amber-900 scale-105 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                    <span className="text-xl">😐</span>
                    OK
                </button>
                <button
                    onClick={() => setRating('great')}
                    disabled={isPending}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold ${rating === 'great' ? 'border-green-400 bg-green-50 text-green-900 scale-105 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                    <span className="text-xl">🤩</span>
                    Ótimo
                </button>
            </div>

            <div className="space-y-2 mb-6 transition-all duration-300">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Uma frase sobre o dia (opcional)</label>
                <div className="relative">
                    <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value.substring(0, 240))}
                        disabled={isPending}
                        placeholder="Ex: Muitas interrupções, mas matei o sapo cedo."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:ring-0 transition-colors"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave()
                        }}
                    />
                    <div className="absolute right-3 bottom-0 top-0 flex items-center">
                        <span className={`text-[10px] font-medium ${note.length > 220 ? 'text-amber-500' : 'text-gray-300'}`}>
                            {note.length}/240
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pb-6 mb-2 border-b border-gray-100 transition-all duration-300">
                {/* Sleep Quality */}
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Qualidade do Sono (opcional)</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSleepQuality(prev => prev === 'poor' ? null : 'poor')}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-bold ${sleepQuality === 'poor' ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                        >
                            <span className="text-base">🥱</span> Ruim
                        </button>
                        <button
                            onClick={() => setSleepQuality(prev => prev === 'fair' ? null : 'fair')}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-bold ${sleepQuality === 'fair' ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                        >
                            <span className="text-base">😌</span> Médio
                        </button>
                        <button
                            onClick={() => setSleepQuality(prev => prev === 'good' ? null : 'good')}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-bold ${sleepQuality === 'good' ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                        >
                            <span className="text-base">😴</span> Bom
                        </button>
                    </div>
                </div>

                {/* Sleep Hours */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Horas (opcional)</label>
                    <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={sleepHours}
                        onChange={e => setSleepHours(e.target.value)}
                        disabled={isPending}
                        placeholder="Ex: 7.5"
                        className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 font-bold focus:border-gray-400 focus:ring-0 transition-colors"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave()
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                {initialReflection && (
                    <button
                        onClick={() => {
                            setRating(initialReflection.rating)
                            setNote(initialReflection.note || '')
                            setSleepQuality(initialReflection.sleep_quality || null)
                            setSleepHours(initialReflection.sleep_hours ? initialReflection.sleep_hours.toString() : '')
                            setIsEditing(false)
                        }}
                        disabled={isPending}
                        className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={isPending || !rating}
                    className="text-sm font-bold bg-black text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
                >
                    {isPending ? 'Salvando...' : 'Salvar Reflexão'}
                </button>
            </div>
        </div>
    )
}
