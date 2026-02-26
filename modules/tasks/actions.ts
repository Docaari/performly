'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTodayStrServer } from '@/utils/date'

export async function createTask(formData: FormData, targetDateStr?: string) {
    const title = formData.get('title') as string
    const category = (formData.get('category') as string) || 'deep_work'
    const recurrenceType = (formData.get('recurrence_type') as string)

    if (!title || title.trim() === '') {
        return { error: 'O título da tarefa não pode estar vazio.' }
    }

    const supabase = await createClient()

    // Obtém sessão verificada via Cookie/SSR
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Sessão inválida. Por favor, faça login.' }
    }

    const dbRecurrenceType = recurrenceType === 'daily' || recurrenceType === 'weekly' || recurrenceType === 'monthly' ? recurrenceType : null

    let recurrenceWeekdays: number[] | null = null
    let recurrenceMonthDay: number | null = null

    if (dbRecurrenceType === 'weekly') {
        const wds = formData.getAll('recurrence_weekdays')
        if (wds.length > 0) {
            recurrenceWeekdays = wds.map(v => parseInt(v as string, 10))
        } else {
            return { error: 'Selecione pelo menos um dia da semana para tarefas semanais.' }
        }
    } else if (dbRecurrenceType === 'monthly') {
        const md = formData.get('recurrence_month_day') as string
        if (md && parseInt(md, 10) >= 1 && parseInt(md, 10) <= 31) {
            recurrenceMonthDay = parseInt(md, 10)
        } else {
            return { error: 'Dia do mês inválido.' }
        }
    }

    // Lógica PR3: Ivy Lee Guard
    // targetDateStr será fornecido se estivermos criando na tela de "Hoje", neste caso vamos checar o limite
    let finalPlannedDate: string | null = targetDateStr || null
    let sentToInbox = false

    if (finalPlannedDate && dbRecurrenceType === null) {
        const { count, error: countError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('planned_date', finalPlannedDate)
            .in('status', ['pending', 'in_progress']) // Delegadas não competem pelo slot de foco do dia

        if (countError) {
            console.error('[CRITICAL] Erro ao contar limites do Top 6:', countError)
        }

        if (count && count >= 6) {
            // Guarda Ivy Lee: transborda para o Backlog/Inbox sem bloquear a criação
            finalPlannedDate = null
            sentToInbox = true
        }
    }

    const { data, error } = await supabase.from('tasks').insert({
        title: title.trim(),
        category: category,
        user_id: user.id,
        status: 'pending',
        planned_date: finalPlannedDate,
        is_frog: false,
        recurrence_type: dbRecurrenceType,
        recurrence_weekdays: recurrenceWeekdays,
        recurrence_month_day: recurrenceMonthDay,
        last_generated_date: null
    }).select()

    if (error) {
        console.error('Falha ao inserir task:', error.message)
        return { error: 'Falha ao salvar a tarefa. Tente novamente.' }
    }

    if (!data || data.length === 0) {
        return { error: 'A tarefa não pôde ser criada (Falha silenciosa do banco).' }
    }

    revalidatePath('/plan')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    return { success: true, sentToInbox }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    console.log(`[DEBUG] deleteTask called for task: ${taskId}, user: ${user.id}`)

    // 1) LER O DNA DA TAREFA ANTES DE DELETAR
    const { data: taskToKill, error: readError } = await supabase
        .from('tasks')
        .select('recurrence_parent_id, planned_date')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

    if (readError && readError.code !== 'PGRST116') {
        console.error('[CRITICAL] Erro ao ler tarefa antes de deletar:', readError)
        return { error: 'Falha técnica ao acessar a tarefa.' }
    }

    // 2) SE FOR UMA INSTÂNCIA DE ROTINA, REGISTRAMOS O SKIP DIÁRIO (ANTI-RESPAWN)
    if (taskToKill?.recurrence_parent_id && taskToKill?.planned_date) {
        const { error: skipError } = await supabase
            .from('routine_skips')
            .upsert({
                user_id: user.id,
                routine_id: taskToKill.recurrence_parent_id,
                skip_date: taskToKill.planned_date
            }, { onConflict: 'user_id, routine_id, skip_date' })

        if (skipError) {
            console.error('[CRITICAL] Falha ao registrar supressão de rotina:', skipError)
            // Não bloqueamos o delete se o skip falhar, mas logamos para monitoramento
        } else {
            console.log(`[DEBUG] Supressão diária registrada para rotina ${taskToKill.recurrence_parent_id} no dia ${taskToKill.planned_date}`)
        }
    }

    // 3) EXECUÇÃO DO HARD-DELETE TRADICIONAL
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('[CRITICAL] Falha ao deletar tarefa:', error)
        return { error: 'Falha técnica ao deletar a tarefa.' }
    }

    if (!data || data.length === 0) {
        console.warn(`[WARNING] deleteTask returned no data for task ${taskId}. Might be already deleted or RLS issue.`)
        return { error: 'Tarefa não encontrada ou já excluída.' }
    } else {
        console.log(`[DEBUG] deleteTask successful:`, data)
    }

    revalidatePath('/tasks')
    revalidatePath('/plan')
    revalidatePath('/dashboard')

    return { success: true }
}

export async function updateRoutine(taskId: string, patch: { title: string, category: string, recurrence_type: string, recurrence_weekdays: number[] | null, recurrence_month_day: number | null }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    if (!patch.title || patch.title.trim() === '') {
        return { error: 'O título não pode estar vazio.' }
    }

    if (patch.recurrence_type === 'weekly' && (!patch.recurrence_weekdays || patch.recurrence_weekdays.length === 0)) {
        return { error: 'Selecione pelo menos um dia para a rotina semanal.' }
    }

    if (patch.recurrence_type === 'monthly' && (!patch.recurrence_month_day || patch.recurrence_month_day < 1 || patch.recurrence_month_day > 31)) {
        return { error: 'Dia do mês inválido para a rotina mensal.' }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            title: patch.title.trim(),
            category: patch.category,
            recurrence_type: patch.recurrence_type,
            recurrence_weekdays: patch.recurrence_type === 'weekly' ? patch.recurrence_weekdays : null,
            recurrence_month_day: patch.recurrence_type === 'monthly' ? patch.recurrence_month_day : null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao atualizar rotina:', error)
        return { error: 'Falha ao atualizar rotina.' }
    }

    if (!data || data.length === 0) {
        return { error: 'A rotina não foi encontrada ou permissão negada.' }
    }

    revalidatePath('/tasks')
    return { success: true }
}

export async function disableRoutine(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            recurrence_type: null,
            recurrence_weekdays: null,
            recurrence_month_day: null,
            last_generated_date: null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao desativar rotina:', error)
        return { error: 'Falha ao desativar rotina.' }
    }

    if (!data || data.length === 0) {
        return { error: 'A rotina não foi encontrada ou permissão negada.' }
    }

    revalidatePath('/tasks')
    return { success: true }
}

export async function deleteRoutine(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    console.log(`[DEBUG] deleteRoutine called for task: ${taskId}, user: ${user.id}`)

    // 1. Deletar instâncias 'pending' futuras/hoje que vieram deste modelo
    await supabase
        .from('tasks')
        .delete()
        .eq('recurrence_parent_id', taskId)
        .eq('user_id', user.id)
        .eq('status', 'pending')

    // 2. Preservarórico: Desvincular instâncias concluídas, arquivadas ou puladas (quebra a FK mas mantém a task)
    await supabase
        .from('tasks')
        .update({ recurrence_parent_id: null })
        .eq('recurrence_parent_id', taskId)
        .eq('user_id', user.id)

    // 3. Deletar o modelo
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('[CRITICAL] Falha ao excluir rotina:', error)
        return { error: 'Falha ao excluir rotina. (Erro de banco: FK ou Constraint)' }
    }

    if (!data || data.length === 0) {
        console.warn(`[WARNING] deleteRoutine returned no data for task ${taskId}.`)
        return { error: 'Supabase: nenhuma rotina excluída (Provável erro de RLS ou Rotina não existe).' }
    }

    console.log(`[DEBUG] deleteRoutine successful:`, data)

    revalidatePath('/tasks')
    revalidatePath('/plan')
    revalidatePath('/dashboard')

    return { success: true }
}

export async function skipRoutineOccurrence(routineId: string, skipDate: string, instanceId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // Cria o registro do skip
    const { error: skipError } = await supabase
        .from('routine_skips')
        .upsert({ user_id: user.id, routine_id: routineId, skip_date: skipDate }, { onConflict: 'user_id, routine_id, skip_date' })

    if (skipError) {
        console.error('Falha ao criar skip:', skipError)
        return { error: 'Falha ao pular rotina.' }
    }

    // Se a instância já existir no banco, deletamos pra sumir da UI
    if (instanceId) {
        await supabase.from('tasks').delete().eq('id', instanceId).eq('user_id', user.id)
    }

    revalidatePath('/plan')
    revalidatePath('/tasks')

    return { success: true }
}

export async function ensureRecurringTasks(simulateDateStr?: string) {
    // Blindagem de segurança: em produção, ignorar parâmetros simulados
    const simulateDate = process.env.NODE_ENV !== 'production' ? simulateDateStr : undefined;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return; // Silent return for unauthenticated

    // Busca apenas as tarefas modelo
    const { data: models, error } = await supabase
        .from('tasks')
        .select('id, title, category, recurrence_type, recurrence_weekdays, recurrence_month_day, last_generated_date')
        .not('recurrence_type', 'is', null);

    if (error || !models) {
        console.error('Erro ao buscar modelos de recorrência:', error?.message);
        return;
    }

    const todayDate = simulateDate ? new Date(simulateDate) : new Date();
    // Usa a central de datas para injetar o timezone correto
    const today = simulateDate ? todayDate.toISOString().split('T')[0] : getTodayStrServer();
    const nowRefLocal = new Date(today); // Usado pra comparações de date ranges simulados com zero hora
    nowRefLocal.setHours(0, 0, 0, 0);

    const modelsToGenerate: { modelTask: Record<string, unknown>; newDateStr: string }[] = [];

    models.forEach(task => {
        let shouldGenerate = false;
        const newDateStr = today;

        if (task.recurrence_type === 'daily') {
            if (!task.last_generated_date || task.last_generated_date < today) {
                shouldGenerate = true;
            }
        } else if (task.recurrence_type === 'weekly' && task.recurrence_weekdays && task.recurrence_weekdays.length > 0) {
            // Em Javascript, 0=Dom.
            const currentDayOfWeek = nowRefLocal.getDay();

            // Só gera se for o dia correto DA SEMANA especificada.
            // Para não gerar infinitos, check se already generated today.
            const alreadyGeneratedToday = task.last_generated_date === today;

            // Se o dia bate com um dos dias da lista, e eu AINDA não gerei HOJE
            if (task.recurrence_weekdays.includes(currentDayOfWeek) && !alreadyGeneratedToday) {
                // Outra segurança: e se testarmos as regras puras de dia em si se já gerou < today (obvio pq já olhamos already generated)
                shouldGenerate = true;
            }

        } else if (task.recurrence_type === 'monthly' && task.recurrence_month_day) {
            const alreadyGeneratedToday = task.last_generated_date === today;
            const targetDay = task.recurrence_month_day;
            const currentDay = nowRefLocal.getDate();

            // Lógica de último dia do mês para meses mais curtos (fevereiro, ou meses com 30)
            const daysInCurrentMonth = new Date(nowRefLocal.getFullYear(), nowRefLocal.getMonth() + 1, 0).getDate();
            const effectiveTargetDay = targetDay > daysInCurrentMonth ? daysInCurrentMonth : targetDay;

            if (currentDay === effectiveTargetDay && !alreadyGeneratedToday) {
                // Checa se já geramos num dia efetivo MAIOR no mesmo mês (improvável com "always equal", 
                // mas a validação de last_generated_date = today ajuda).
                // Pra garantir que não geremos D+1 ou skip de meses se a pessoa pulou o mês inteiro, a lazy load vai bater 
                // apenas no effective current day. Se o usuário esquecer de abrir o app no dia 28 do mês, não gera. Essa é a premissa de app vivo.
                shouldGenerate = true;
            }
        }

        if (shouldGenerate) {
            modelsToGenerate.push({ modelTask: task, newDateStr });
        }
    });

    if (modelsToGenerate.length > 0) {
        for (const item of modelsToGenerate) {
            const { modelTask, newDateStr } = item;

            const { error: insertError } = await supabase.from('tasks').insert({
                title: modelTask.title,
                category: modelTask.category,
                user_id: user.id,
                status: 'pending',
                planned_date: newDateStr, // Bugfix: Estava nulo
                is_frog: false,
                recurrence_type: null,
                recurrence_parent_id: modelTask.id, // Bugfix: O vínculo estrutural estava ausente
                last_generated_date: null
            });

            if (insertError) {
                if (insertError.code === '23505') {
                    console.log(`[DEBUG] Concorrência - Rotina ${modelTask.id} já gerada para ${newDateStr} (23505).`);
                } else {
                    console.error('Falha ao gerar nova tarefa a partir de recorrência:', insertError.message);
                }
                continue;
            }

            const { error: updateError } = await supabase
                .from('tasks')
                .update({ last_generated_date: newDateStr })
                .eq('id', modelTask.id)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Falha ao atualizar data de geração da tarefa modelo:', updateError.message);
            }
        }
    }
}

export async function ensureRecurringTasksForRange(startDateISO: string, endDateISO: string, simulateDateStr?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    // 1) Busca Modelos
    const { data: models, error: modelsError } = await supabase
        .from('tasks')
        .select('id, title, category, recurrence_type, recurrence_weekdays, recurrence_month_day, last_generated_date')
        .not('recurrence_type', 'is', null);

    if (modelsError || !models || models.length === 0) return;

    // 2) Busca Tarefas já existentes neste período para evitar duplicação
    // Serão as tarefas normais (recurrence_type null) cujo planned_date esteja entre startDateISO e endDateISO
    const { data: existingTasks, error: existingError } = await supabase
        .from('tasks')
        .select('title, category, planned_date')
        .is('recurrence_type', null)
        .gte('planned_date', startDateISO)
        .lte('planned_date', endDateISO);

    if (existingError) {
        console.error('Erro ao buscar tarefas existentes no range:', existingError.message);
        return;
    }

    // 3) Busca Skips registrados no período
    const { data: skips, error: skipsError } = await supabase
        .from('routine_skips')
        .select('routine_id, skip_date')
        .eq('user_id', user.id)
        .gte('skip_date', startDateISO)
        .lte('skip_date', endDateISO);

    if (skipsError) {
        console.error('Erro ao buscar skips no range:', skipsError.message);
    }

    // Set de skips no formato "ROUTINE_ID|SKIP_DATE"
    const skipSignatures = new Set<string>();
    skips?.forEach(s => {
        skipSignatures.add(`${s.routine_id}|${s.skip_date}`);
    });

    // Criar um Set de assinaturas exclusivas das tarefas (para não duplicar instâncias ativas)
    // "TITLE|CATEGORY|PLANNED_DATE"
    const existingSignatures = new Set<string>();
    existingTasks?.forEach(t => {
        if (t.planned_date) {
            existingSignatures.add(`${t.title}|${t.category}|${t.planned_date}`);
        }
    });

    const tasksToInsert: Record<string, unknown>[] = [];
    const nowRefLocal = new Date(startDateISO);
    nowRefLocal.setHours(0, 0, 0, 0);

    const endRefLocal = new Date(endDateISO);
    endRefLocal.setHours(0, 0, 0, 0);

    // Iterar dia a dia no range
    for (let d = new Date(nowRefLocal); d <= endRefLocal; d.setDate(d.getDate() + 1)) {
        const currentDateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const currentDayOfWeek = d.getDay(); // 0-6
        const currentDayOfMonth = d.getDate(); // 1-31

        const daysInCurrentMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

        models.forEach(model => {
            let shouldGenerateForDay = false;

            if (model.recurrence_type === 'daily') {
                shouldGenerateForDay = true;
            } else if (model.recurrence_type === 'weekly' && model.recurrence_weekdays) {
                if (model.recurrence_weekdays.includes(currentDayOfWeek)) {
                    shouldGenerateForDay = true;
                }
            } else if (model.recurrence_type === 'monthly' && model.recurrence_month_day) {
                const effectiveTargetDay = model.recurrence_month_day > daysInCurrentMonth ? daysInCurrentMonth : model.recurrence_month_day;
                if (currentDayOfMonth === effectiveTargetDay) {
                    shouldGenerateForDay = true;
                }
            }

            // Checar se deve pular (skip)
            const isSkipped = skipSignatures.has(`${model.id}|${currentDateStr}`);

            if (shouldGenerateForDay && !isSkipped) {
                const signature = `${model.title}|${model.category}|${currentDateStr}`;
                // Se a assinatura AINDA NÃO EXISTE nas planilhas do usuário
                if (!existingSignatures.has(signature)) {
                    // Adicionamos para ser inserida neste loop
                    tasksToInsert.push({
                        title: model.title,
                        category: model.category,
                        user_id: user.id,
                        status: 'pending',
                        planned_date: currentDateStr, // Instância agendada para este dia
                        is_frog: false,
                        recurrence_type: null, // Instância perdeu o DNA de "Modelo" ativo
                        recurrence_parent_id: model.id, // Mas mantem amarra de linhagem para UI de "Pular"
                        last_generated_date: null
                    });

                    // Registramos no set para não duplicar caso rode dnv nessa transação
                    existingSignatures.add(signature);
                }
            }
        });
    }

    if (tasksToInsert.length > 0) {
        // Sequencial insert (Promisificado) para garantir que violações de Constraint Única (23505) não matem o lote do range inteiro
        await Promise.allSettled(
            tasksToInsert.map(async (t) => {
                const { error: insertError } = await supabase.from('tasks').insert(t);
                if (insertError && insertError.code !== '23505') {
                    console.error('Falha ao inserir rotina pre-gerada:', insertError.message);
                } else if (insertError?.code === '23505') {
                    console.log(`[DEBUG] Range Insert - Tolerada violação concorrente única 23505.`);
                }
            })
        );
    }
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

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao atualizar tarefa:', error)
        return { error: 'Falha ao atualizar a tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    }

    revalidatePath('/tasks')
    return { success: true }
}

export async function setTaskPlannedDate(taskId: string, targetDateStr: string | null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // 1) Fetch current task to check if it's frog and its current planned_date
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('planned_date, is_frog')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !task) return { error: 'Tarefa não encontrada.' }

    // 2) Check Ivy Lee Limit if we are planning for a specific date
    if (targetDateStr) {
        // Only check limit if we are moving to a NEW date
        if (task.planned_date !== targetDateStr) {
            const { count, error: countError } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('planned_date', targetDateStr)

            if (countError) return { error: 'Erro ao checar limite da data destino.' }
            if (count && count >= 6) {
                return { error: 'Limite de 6 prioridades alcançado para este dia. Desmarque uma antes de mover.' }
            }
        }
    }

    // 3) Frog Demotion Logic
    // If it is a frog, and we are moving it to a date that is NOT today (or to null/backlog), demote it.
    // The safest is to just demote it if targetDateStr !== today's date, or if it's moving at all from today.
    // To be perfectly robust, if a frog is moved to ANY other date than exactly the current local date, remove frog.
    let isFrog = task.is_frog;
    const todayStr = getTodayStrServer();

    if (isFrog && targetDateStr !== todayStr) {
        isFrog = false;
    }

    // 4) Execute Update
    const { data: updateDataResult, error: updateError } = await supabase
        .from('tasks')
        .update({
            planned_date: targetDateStr,
            is_frog: isFrog
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (updateError) return { error: 'Falha ao mover a tarefa.' }

    if (!updateDataResult || updateDataResult.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    }

    revalidatePath('/plan')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    // If it was demoted, we return a special flag so the UI can show a subtle toast
    return { success: true, wasFrogDemoted: task.is_frog && !isFrog }
}

export async function togglePlanForToday(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const todayStr = getTodayStrServer();

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
        const { data, error: updateError } = await supabase
            .from('tasks')
            .update({ planned_date: null })
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select()

        if (updateError) return { error: 'Falha ao remover do planejamento.' }
        if (!data || data.length === 0) return { error: 'Tarefa não encontrada ou permissão negada.' }
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
        const { data, error: updateError } = await supabase
            .from('tasks')
            .update({ planned_date: todayStr })
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select()

        if (updateError) return { error: 'Falha ao adicionar ao planejamento.' }
        if (!data || data.length === 0) return { error: 'Tarefa não encontrada ou permissão negada.' }
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
    const { data: setFrogData, error: setFrogError } = await supabase
        .from('tasks')
        .update({ is_frog: true })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (setFrogError) return { error: 'Falha ao definir novo Sapo.' }
    if (!setFrogData || setFrogData.length === 0) return { error: 'Tarefa não encontrada ou permissão negada.' }

    revalidatePath('/plan')
    revalidatePath('/focus')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    return { success: true }
}

export async function setFrogTime(taskId: string, timeString: string | null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // basic validation HH:MM since we'll use type="time"
    if (timeString && !/^([01]\d|2[0-3]):?([0-5]\d)$/.test(timeString)) {
        return { error: 'Horário inválido.' }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({ intended_start_time: timeString })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao definir horário do Sapo:', error)
        return { error: 'Falha ao salvar horário.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    }

    revalidatePath('/plan')
    revalidatePath('/dashboard')

    return { success: true }
}

export async function updateNorteObjective(objective: string | null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const { data, error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            norte_objective: objective
        }, { onConflict: 'user_id' })
        .select()

    if (error) {
        console.error('Falha ao atualizar Norte Escratégico:', error)
        return { error: 'Falha ao salvar seu Norte.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Falha silenciosa ao salvar seu Norte.' }
    }

    revalidatePath('/plan')

    return { success: true }
}

// Micro-PR D3: GTD Inbox Triage Actions

export async function delegateTask(
    taskId: string,
    delegatedTo?: string | null,
    delegatedNote?: string | null
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    console.log(`[DEBUG] delegateTask called for task: ${taskId}, user: ${user.id}`)

    const { data, error } = await supabase
        .from('tasks')
        .update({
            status: 'delegated',
            delegated_to: delegatedTo || null,
            delegated_note: delegatedNote || null,
            delegated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('[CRITICAL] Falha ao delegar tarefa:', error)
        return { error: 'Falha ao delegar a tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    } else {
        console.log(`[DEBUG] delegateTask successful:`, data)
    }

    revalidatePath('/tasks')
    revalidatePath('/plan')
    return { success: true }
}

export async function undelegateTask(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    console.log(`[DEBUG] undelegateTask called for task: ${taskId}, user: ${user.id}`)

    const { data, error } = await supabase
        .from('tasks')
        .update({
            status: 'pending',
            delegated_at: null,
            delegated_to: null,
            delegated_note: null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('[CRITICAL] Falha ao retomar tarefa delegada:', error)
        return { error: 'Falha ao restaurar a tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    } else {
        console.log(`[DEBUG] undelegateTask successful:`, data)
    }

    revalidatePath('/tasks')
    revalidatePath('/plan')
    return { success: true }
}

// Micro-PR C8: Skip Routines

export async function skipRoutineTask(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    console.log(`[DEBUG] skipRoutineTask called for task: ${taskId}, user: ${user.id}`)

    // Só permite 'pular' alterar status para 'skipped'
    const { data, error } = await supabase
        .from('tasks')
        .update({
            status: 'skipped'
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('[CRITICAL] Falha ao pular rotina:', error)
        return { error: 'Falha ao pular a rotina.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Tarefa não encontrada ou permissão negada.' }
    } else {
        console.log(`[DEBUG] skipRoutineTask successful:`, data)
    }

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    revalidatePath('/plan')
    return { success: true }
}

export async function softResetOverdueTasks(todayStrFromClient: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    if (!todayStrFromClient || !/^\d{4}-\d{2}-\d{2}$/.test(todayStrFromClient)) {
        return { error: 'Data inválida.' }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({ planned_date: null, is_frog: false })
        .eq('user_id', user.id)
        .lt('planned_date', todayStrFromClient)
        .in('status', ['pending', 'in_progress', 'delegated'])
        .select()

    if (error) {
        console.error('[CRITICAL] Falha no Soft Reset de tarefas vencidas:', error)
        return { error: 'Falha técnica ao executar o reset diário.' }
    }

    // Se ocorrer sucesso mas nenhuma tarefa for afetada, `data.length` será 0, 
    // o que é normal no Soft Reset (significa que o dia já estava limpo). 
    // Por contrato do Performly, enviamos success mas anotamos a quantidade.
    if (!data || data.length === 0) {
        return { success: true, updated: 0 }
    }

    console.log(`[Soft Reset] ${data.length} tarefas de ${user.id} movidas para a Inbox.`)

    // Note que delegated nós limpamos a data também para não ficar preso no painel Atrasadas.
    // O status continua como 'delegated', apenas a data vira null, efetivamente voltando ao backlog.

    revalidatePath('/plan')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    return { success: true, updated: data.length }
}

export async function setTaskScheduledDate(taskId: string, targetDateStr: string | null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    if (targetDateStr && !/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
        return { error: 'Formato de data inválido' }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({ scheduled_date: targetDateStr })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao agendar tarefa:', error.message)
        return { error: 'Falha técnica ao agendar tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Falha silenciosa ao agendar tarefa. Operação não afetou registros.' }
    }

    revalidatePath('/plan')
    revalidatePath('/dashboard')
    revalidatePath('/tasks')

    return { success: true }
}

export async function bringTaskToToday(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    const todayStr = getTodayStrServer()

    const { data, error } = await supabase
        .from('tasks')
        .update({
            planned_date: todayStr,
            scheduled_date: null // Limpa do radar quando promovida
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao promover tarefa para hoje:', error.message)
        return { error: 'Falha técnica ao mover tarefa para o dia de hoje.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Falha silenciosa ao mover tarefa. Operação não afetou registros.' }
    }

    revalidatePath('/plan')
    revalidatePath('/dashboard')
    revalidatePath('/tasks')

    return { success: true }
}

export async function setTaskArea(taskId: string, areaTag: string | null, areaColor: string | null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão inválida' }

    // Validate color payload to avoid injection or weird UI colors
    const validColors = ['slate', 'indigo', 'emerald', 'amber', 'rose']
    let finalColor = areaColor;
    let finalTag = areaTag;

    if (areaColor && !validColors.includes(areaColor)) {
        return { error: 'Cor de área inválida.' }
    }

    // Both must be provided if one is provided, or both null
    if (!areaTag || !areaColor) {
        finalTag = null;
        finalColor = null;
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            area_tag: finalTag,
            area_color: finalColor
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Falha ao definir área da tarefa:', error.message)
        return { error: 'Falha técnica ao definir a área da tarefa.' }
    }

    if (!data || data.length === 0) {
        return { error: 'Falha silenciosa ao definir área. Operação não afetou registros.' }
    }

    revalidatePath('/plan')
    revalidatePath('/tasks')
    revalidatePath('/dashboard')

    return { success: true }
}
