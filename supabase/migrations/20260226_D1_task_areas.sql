-- Migration: 20260226_D1_task_areas
-- Adiciona colunas para áreas visuais opcionais e silenciosas

ALTER TABLE public.tasks ADD COLUMN area_tag text;
ALTER TABLE public.tasks ADD COLUMN area_color text;
