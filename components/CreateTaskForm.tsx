'use client'

import { useRef, useState } from 'react'
import { createTask } from '@/modules/tasks/actions'

export function CreateTaskForm() {
    const formRef = useRef<HTMLFormElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        const result = await createTask(formData)

        if (result?.error) {
            setError(result.error)
        } else {
            // Sucesso: limpar form
            formRef.current?.reset()
        }

        setLoading(false)
    }

    return (
        <div className="mb-8">
            <form ref={formRef} action={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    name="title"
                    placeholder="Capture uma nova tarefa..."
                    required
                    disabled={loading}
                    autoComplete="off"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition shadow-sm disabled:bg-gray-50 disabled:text-gray-400 font-medium"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-black text-white px-7 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                    {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-3 ml-1 font-medium">{error}</p>}
        </div>
    )
}
