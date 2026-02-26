-- Migration E1: Purge do Status 'skipped'
-- Risco Mitigado: Para podermos alterar a constraint com segurança, precisamos garantir
-- que não existam registros violando a nova regra. Por decisão de produto,
-- instâncias antigas cujo status era 'skipped' (equivalente a "Pular" / não fazer)
-- são agora deletadas fisicamente, alinhando com a nova mecânica de `deleteTask()` do MVP.

BEGIN;

-- 1. Hard-delete preventivo nas tarefas que ainda possuem o status morto.
DELETE FROM tasks WHERE status = 'skipped';

-- 2. Derrubar a constraint atual.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 3. Recriar a constraint apenas com os status ativos e permitidos.
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'delegated'));

COMMIT;
