-- migration_recorrencia_fase_b.sql
-- Fase B: Modelos semanais com dias específicos e mensais.

-- 1) Tipo: recriar constraint com safety
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS check_recurrence_type;

ALTER TABLE public.tasks
ADD CONSTRAINT check_recurrence_type
CHECK (recurrence_type IN ('daily', 'weekly', 'monthly'));

-- 2) Colunas: idempotente
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS recurrence_weekdays integer[];

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS recurrence_month_day integer;

-- 3) Constraints: drop e recria para evitar conflito
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS check_recurrence_coherence;

ALTER TABLE public.tasks
ADD CONSTRAINT check_recurrence_coherence
CHECK (
    (recurrence_type = 'daily' AND recurrence_weekdays IS NULL AND recurrence_month_day IS NULL) OR
    (recurrence_type = 'weekly' AND recurrence_weekdays IS NOT NULL AND array_length(recurrence_weekdays, 1) > 0 AND recurrence_month_day IS NULL) OR
    (recurrence_type = 'monthly' AND recurrence_month_day IS NOT NULL AND recurrence_weekdays IS NULL) OR
    (recurrence_type IS NULL AND recurrence_weekdays IS NULL AND recurrence_month_day IS NULL)
);

ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS check_recurrence_weekdays_values;

ALTER TABLE public.tasks
ADD CONSTRAINT check_recurrence_weekdays_values
CHECK (
    recurrence_weekdays IS NULL OR
    (recurrence_weekdays <@ ARRAY[0,1,2,3,4,5,6]::integer[])
);

ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS check_recurrence_month_day;

ALTER TABLE public.tasks
ADD CONSTRAINT check_recurrence_month_day
CHECK (recurrence_month_day IS NULL OR (recurrence_month_day >= 1 AND recurrence_month_day <= 31));
