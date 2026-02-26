ALTER TABLE public.daily_reflections
ADD COLUMN sleep_quality text CHECK (sleep_quality IN ('good', 'fair', 'poor') OR sleep_quality IS NULL),
ADD COLUMN sleep_hours numeric(4,2);
