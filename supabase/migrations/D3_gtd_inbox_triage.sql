-- Phase K: D3_gtd_inbox_triage.sql

-- 1) Add new GTD triage fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS delegated_to text NULL,
ADD COLUMN IF NOT EXISTS delegated_note text NULL,
ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS delegated_at timestamptz NULL;

-- 2) Try to drop the existing check constraint on status safely
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 3) Re-add the check constraint with the new states
-- Including the existing ones (pending, in_progress, completed) + archived (was there on typescript) + delegated
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'archived', 'delegated'));
