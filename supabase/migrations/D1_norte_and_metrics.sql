-- Phase I: D1_norte_and_metrics.sql 

-- 1) Create user_settings table
CREATE TABLE public.user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    norte_objective text NULL,
    updated_at timestamptz DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
