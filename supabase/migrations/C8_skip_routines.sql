-- Phase H: C8_skip_routines.sql (Routine Skips)

-- 1) Alter table tasks
ALTER TABLE public.tasks ADD COLUMN recurrence_parent_id uuid NULL REFERENCES public.tasks(id);

-- 2) Create routine_skips
CREATE TABLE public.routine_skips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    routine_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    skip_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, routine_id, skip_date)
);

-- 3) Enable RLS
ALTER TABLE public.routine_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own skips"
    ON public.routine_skips FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
