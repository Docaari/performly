'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
    const title = formData.get('title') as string
    if (!title || title.trim() === '') {
        return { error: 'O título da tarefa não pode estar vazio.' }
    }

    const supabase = await createClient()

    // Obtém sessão verificada via Cookie/SSR
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Sessão inválida. Por favor, faça login.' }
    }

    // Insere banco (O RLS garante que o supabase.from('tasks') só aceite se o user_id for igual ao auth.uid)
    const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        user_id: user.id,
        status: 'pending',
        planned_date: null,
        is_frog: false
    })

    if (error) {
        console.error('Falha ao inserir task:', error.message)
        return { error: 'Falha ao salvar a tarefa. Tente novamente.' }
    }

    // Revalida a página /tasks inteira (faz o fetchTasks no Server Component rodar novamente pra aparecer o item fresco)
    revalidatePath('/tasks')
    return { success: true }
}
