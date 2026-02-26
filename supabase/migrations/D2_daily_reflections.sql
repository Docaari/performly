-- Phase J: D2_daily_reflections.sql

-- 1) Create daily_reflections table
CREATE TABLE public.daily_reflections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_date date NOT NULL,
    rating text NOT NULL CHECK (rating IN ('bad', 'ok', 'great')),
    note text NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, reflection_date)
);

-- 2) Enable RLS
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily reflections"
    ON public.daily_reflections FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
