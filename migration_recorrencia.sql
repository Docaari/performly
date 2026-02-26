-- migration_recorrencia.sql
-- Fase A: Tarefas Rotineiras

-- Adiciona a coluna recurrence_type iterando apenas se necessário
ALTER TABLE public.tasks 
ADD COLUMN recurrence_type text;

-- Restringe para aceitar apenas nulo, 'daily' ou 'weekly'
ALTER TABLE public.tasks 
ADD CONSTRAINT check_recurrence_type 
CHECK (recurrence_type IN ('daily', 'weekly'));

-- Adiciona a coluna para controlar quando foi a última geração da recorrência
ALTER TABLE public.tasks 
ADD COLUMN last_generated_date date;
