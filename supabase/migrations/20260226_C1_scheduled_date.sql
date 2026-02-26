-- Migration: 20260226_C1_scheduled_date
-- Adiciona a coluna scheduled_date para tarefas únicas marcadas no radar (sem entrar no Today automaticamente)

ALTER TABLE public.tasks
ADD COLUMN scheduled_date date;

CREATE INDEX idx_tasks_scheduled_date ON public.tasks(scheduled_date) WHERE scheduled_date IS NOT NULL;
