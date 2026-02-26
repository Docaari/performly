-- HOTFIX C8.2: SQL para checar e corrigir a Policy RLS de DELETE e UPDATE na tabela tasks

-- 1. Garante que o RLS está ativado
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Recria a policy unificada para todas as operações (ALL) baseada no user_id
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;

CREATE POLICY "Users can manage their own tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
