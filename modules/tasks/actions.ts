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

export async function toggleTaskComplete(taskId: string, nextStatus: 'completed' | 'pending') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // RLS will ensure user only updates their own tasks, but we add an explicit .eq('user_id') anyway
    const updateData = {
        status: nextStatus,
        completed_at: nextStatus === 'completed' ? new Date().toISOString() : null
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Falha ao atualizar tarefa:', error)
        return { error: 'Falha ao atualizar a tarefa.' }
    }

    revalidatePath('/tasks')
    return { success: true }
}

export async function togglePlanForToday(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const todayStr = new Date().toISOString().split('T')[0]

    // Pega a tarefa atual para ver o statis de plan
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('planned_date')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !task) return { error: 'Tarefa não encontrada.' }

    const isPlannedForToday = task.planned_date === todayStr

    if (isPlannedForToday) {
        // Remover de hoje
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ planned_date: null })
            .eq('id', taskId)
            .eq('user_id', user.id)

        if (updateError) return { error: 'Falha ao remover do planejamento.' }
    } else {
        // Checar limite Ivy Lee (max 6 tarefas com planned_date = hoje)
        const { count, error: countError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('planned_date', todayStr)

        if (countError) return { error: 'Erro ao checar limite.' }
        if (count && count >= 6) {
            return { error: 'Limite de 6 prioridades alcançado para hoje. Desmarque uma para poder adicionar.' }
        }

        // Adicionar a hoje
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ planned_date: todayStr })
            .eq('id', taskId)
            .eq('user_id', user.id)

        if (updateError) return { error: 'Falha ao adicionar ao planejamento.' }
    }

    revalidatePath('/plan')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function setFrogTask(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const todayStr = new Date().toISOString().split('T')[0]

    // 1) Verify if it is planned for today
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('planned_date')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !task) return { error: 'Tarefa não encontrada.' }
    if (task.planned_date !== todayStr) return { error: 'Somente tarefas planejadas para hoje podem ser o Sapo.' }

    // 2) Remove is_frog from any other tasks of this user today
    const { error: resetError } = await supabase
        .from('tasks')
        .update({ is_frog: false })
        .eq('user_id', user.id)
        .eq('planned_date', todayStr)
        .eq('is_frog', true)

    if (resetError) return { error: 'Falha ao redefinir o sapo atual.' }

    // 3) Set is_frog to true on the selected task
    const { error: setFrogError } = await supabase
        .from('tasks')
        .update({ is_frog: true })
        .eq('id', taskId)
        .eq('user_id', user.id)

    if (setFrogError) return { error: 'Falha ao definir novo Sapo.' }

    revalidatePath('/plan')
    revalidatePath('/focus')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    return { success: true }
}

