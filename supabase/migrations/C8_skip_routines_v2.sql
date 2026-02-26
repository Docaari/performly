-- Phase L: C8_skip_routines_v2.sql

-- Try to drop the existing check constraint on status safely
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Re-add the check constraint with the new 'skipped' state
-- Including the existing ones (pending, in_progress, completed, archived, delegated) + skipped
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'archived', 'delegated', 'skipped'));
