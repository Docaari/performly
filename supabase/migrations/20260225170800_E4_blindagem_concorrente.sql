-- Limpeza preventiva de possíveis duplicatas por corrida transacional
-- Mantém a linha com o ID mais antigo (via CTID ou min(id)) e remove os "gêmeos" da mesma data.
DELETE FROM tasks
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, recurrence_parent_id, planned_date
                   ORDER BY created_at ASC
               ) as rn
        FROM tasks
        WHERE recurrence_parent_id IS NOT NULL
    ) t
    WHERE t.rn > 1
);

-- Criação do índice único parcial
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_unique_routine_instance 
ON tasks (user_id, recurrence_parent_id, planned_date) 
WHERE recurrence_parent_id IS NOT NULL;
