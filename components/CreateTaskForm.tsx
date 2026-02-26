'use client'

import { useRef, useState } from 'react'
import { createTask } from '@/modules/tasks/actions'

export function CreateTaskForm({ targetDateStr }: { targetDateStr?: string }) {
    const formRef = useRef<HTMLFormElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [recurrence, setRecurrence] = useState<string>('')
    const [sentToInbox, setSentToInbox] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)
        setSentToInbox(false)

        const result = await createTask(formData, targetDateStr)

        if (result?.error) {
            setError(result.error)
        } else {
            // Sucesso: limpar form
            formRef.current?.reset()
            setRecurrence('')
            if (result?.sentToInbox) {
                setSentToInbox(true)
                setTimeout(() => setSentToInbox(false), 4000)
            }
        }

        setLoading(false)
    }

    const weekdays = [
        { label: 'D', value: '0' },
        { label: 'S', value: '1' },
        { label: 'T', value: '2' },
        { label: 'Q', value: '3' },
        { label: 'Q', value: '4' },
        { label: 'S', value: '5' },
        { label: 'S', value: '6' },
    ]

    return (
        <div className="mb-8">
            <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        name="title"
                        placeholder="Capture uma nova tarefa..."
                        required
                        disabled={loading}
                        autoComplete="off"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition shadow-sm disabled:bg-gray-50 disabled:text-gray-400 font-medium"
                    />

                    <select
                        name="category"
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition shadow-sm disabled:bg-gray-50 disabled:text-gray-400 font-medium bg-white text-gray-700 cursor-pointer appearance-none shrink-0"
                        defaultValue="deep_work"
                    >
                        <option value="deep_work">🧠 Deep Work</option>
                        <option value="operacional">⚙️ Operacional</option>
                        <option value="estudo">📚 Estudo</option>
                        <option value="pessoal_saude">🧘‍♂️ Pessoal/Saúde</option>
                    </select>

                    <select
                        name="recurrence_type"
                        disabled={loading}
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition shadow-sm disabled:bg-gray-50 disabled:text-gray-400 font-medium bg-white text-gray-700 cursor-pointer appearance-none shrink-0"
                    >
                        <option value="">Não repetir</option>
                        <option value="daily">Diariamente</option>
                        <option value="weekly">Semanalmente</option>
                        <option value="monthly">Mensalmente</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto bg-black text-white px-7 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                    >
                        {loading ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </div>

                {/* Inline Recurrence Options */}
                {recurrence === 'weekly' && (
                    <div className="flex items-center gap-2 pl-2 animate-in slide-in-from-top-2 duration-300">
                        <span className="text-sm text-gray-500 font-medium mr-2">Repetir aos:</span>
                        {weekdays.map((day) => (
                            <label key={day.value} className="flex items-center justify-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="recurrence_weekdays"
                                    value={day.value}
                                    className="peer sr-only"
                                />
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-xs peer-checked:bg-black peer-checked:text-white transition-colors duration-200 hover:bg-gray-200">
                                    {day.label}
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                {recurrence === 'monthly' && (
                    <div className="flex items-center gap-2 pl-2 animate-in slide-in-from-top-2 duration-300">
                        <span className="text-sm text-gray-500 font-medium mr-2">Dia do mês:</span>
                        <input
                            type="number"
                            name="recurrence_month_day"
                            min="1"
                            max="31"
                            defaultValue="1"
                            required
                            className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-medium"
                        />
                    </div>
                )}
            </form>
            {(error || sentToInbox) && (
                <div className="mt-3 ml-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    {sentToInbox && <p className="text-amber-600 text-[13px] font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Top 6 cheio — mandei pra Inbox.
                    </p>}
                </div>
            )}
        </div>
    )
}
