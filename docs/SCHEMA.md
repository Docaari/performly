# Schema do Banco de Dados (Supabase/PostgreSQL) - Performly MVP

## A) Explicação do Modelo (Sem Jargão)
A estrutura do MVP prioriza a **Tarefa** (`tasks`) como elemento central de tudo, eliminando qualquer duplicação de dados e evitando tabelas complexas para gerenciar o estado diário.
1. **Top 6 e o Sapo (O Reset Diário Natural)**: O Top 6 não é uma tabela nova. Quando você escolhe o seu Top 6, o sistema simplesmente preenche a data de hoje no campo `planned_date` da tarefa. O Sapo do dia é o mesmo campo com o botão `is_frog` ligado. Se a tarefa não for cumprida hoje, a data expira naturalmente amanhã. Ao virar o dia, o sistema não precisa "deletar" nada: a tarefa simplesmente volta a aparecer como atrasada ou pendente na Central Geral, pois a data de planejamento dela ficou no passado.
2. **Ciclos de Foco (`pomodoros`)**: Como uma única tarefa exigente pode precisar de 3 pomodoros diferentes, eles têm uma tabela própria de histórico. Isso permite contar no Dashboard: "Você fez 5 pomodoros hoje, espalhados em 2 tarefas".
3. **Streak Seguro (Frog-Eating)**: O seu 'Streak' de sapos não é um número cego. Ele é matematicamente validado olhando para o passado: o sistema conta quantos dias consecutivos você teve uma tarefa marcada como Sapo (`is_frog`) e que foi concluída (`status = 'completed'`) exatamente na data em que foi planejada.

---

## B) SQL de Criação (Para rodar no Supabase SQL Editor)

### Tabela 1: Tarefas (Central, Top 6 e Sapo)
```sql
-- Habilita o uso de UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    planned_date DATE, -- Se preenchido com a data de "hoje", a tarefa está no Top 6
    is_frog BOOLEAN NOT NULL DEFAULT false, -- Se TRUE, é a prioridade máxima do dia planejado
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

### Regra de Integridade do Sapo (1 por Dia)
```sql
-- Garante que o usuário só possa coroar UM sapo por dia planejado (se is_frog for falso, ele ignora)
CREATE UNIQUE INDEX idx_one_frog_per_day 
ON tasks (user_id, planned_date) 
WHERE is_frog = true;
```

### Tabela 2: Histórico de Pomodoros
```sql
CREATE TABLE pomodoros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL DEFAULT 25,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices de Performance adicionais
```sql
-- Acelera a busca pelas tarefas do dia atual do usuário
CREATE INDEX idx_tasks_user_date ON tasks (user_id, planned_date);
-- Acelera a filtragem pelo status e ordenação cronológica
CREATE INDEX idx_tasks_status ON tasks (status);
-- Acelera a contagem de pomodoros no histórico diário do usuário
CREATE INDEX idx_pomodoros_user_date ON pomodoros (user_id, DATE(completed_at));
```

---

## C) Queries Reais de Validação do Modelo

Estas consultas provam como o aplicativo vai buscar os dados no "mundo real" respeitando as regras de "Reset Diário" (vencimento flexível de data) e a North Star Metric.

**1. Selecionar o Top 6 do Dia de Hoje**
*(Busca as tarefas não concluídas que foram planejadas para a data atual, limitando a 6).*
```sql
SELECT * FROM tasks
WHERE user_id = 'id-do-usuario'
  AND status = 'pending'
  AND planned_date = CURRENT_DATE
ORDER BY is_frog DESC, created_at ASC
LIMIT 6;
```

**2. Encontrar o Sapo do Dia atual**
*(Mesmo que a de cima, mas exige o selo oficial de Sapo para exibir o grande botão central).*
```sql
SELECT * FROM tasks
WHERE user_id = 'id-do-usuario'
  AND status = 'pending'
  AND planned_date = CURRENT_DATE
  AND is_frog = true
LIMIT 1;
```

**3. Total de Pomodoros completados "Hoje" pelo usuário**
*(Alimenta a gamificação secundária do Dashboard ao final do dia).*
```sql
SELECT COUNT(*) as total_pomodoros_today
FROM pomodoros
WHERE user_id = 'id-do-usuario'
  AND DATE(completed_at) = CURRENT_DATE;
```

**4. O Ruído: Tarefas na Central Geral Pending (Que não são do Top 6 atual)**
*(Pega qualquer tarefa que nunca foi planejada, ou que foi planejada para um dia que já PASSOU e fracassou, forçando um novo planejamento).*
```sql
SELECT * FROM tasks
WHERE user_id = 'id-do-usuario'
  AND status = 'pending'
  AND (planned_date IS NULL OR planned_date < CURRENT_DATE)
ORDER BY created_at DESC;
```

**5. Histórico e Streak de Sapos Concluídos (A Auditoria da North Star)**
*(Traz todas as vitórias documentadas do usuário. O aplicativo frontend pode ler essa lista contígua de datas e calcular visualmente o 'Streak' inquebrável, como o app do Duolingo faria).*
```sql
SELECT planned_date as frog_victory_date, completed_at
FROM tasks
WHERE user_id = 'id-do-usuario'
  AND is_frog = true
  AND status = 'completed'
  -- Confirma que o sapo foi morto no mesmo dia em que estava planejado
  AND DATE(completed_at) = planned_date 
ORDER BY planned_date DESC;
```

---

## D) Melhorias e Prevenção de Bugs (Evolução do Schema)

Após revisão minuciosa, algumas lacunas foram identificadas e fechadas para proteger o sistema no longo prazo (evitar estados impossíveis), sem adicionar escopo desnecessário.

**Lista de Mudanças Implementadas:**
1. **Flexibilização do Status Enum**: A restrição original verificava apenas (`'pending'`, `'completed'`). Expandimos para permitir `'in_progress'` (útil quando o Sapo estiver rodando no Pomodoro) e `'archived'` (para limpeza visual pós-MVP mantendo histórico).
2. **Obrigatoriedade de Data para o Sapo**: No schema original, o banco permitia (teoricamente) que uma tarefa fosse marcada como Sapo (`is_frog=true`) mesmo com a data nula. Modificamos para proibir isso nativamente. Todo Sapo precisa existir em um dia de Top 6.
3. **Índices Compostos e Precisos**: Todas as consultas do Dashboard buscarão pelo `user_id` E o `status` ao mesmo tempo. A adição de índices compostos melhora significativamente a performance inicial.

### SQL de Migração (Aplicações para o Supabase)

**1. Expansão Inteligente do Status (Mantendo retrocompatibilidade)**
```sql
-- Remove a trava engessada antiga
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;

-- Adiciona a nova trava mais flexível para suportar o motor Pomodoro
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'archived'));
```

**2. Integridade Absoluta (Sapo Obriga Data)**
```sql
-- O banco barra qualquer inserção de Sapo sem data estipulada
ALTER TABLE tasks ADD CONSTRAINT chk_frog_requires_date 
CHECK (
  (is_frog = false) OR 
  (is_frog = true AND planned_date IS NOT NULL)
);
```

**3. Índices Compostos para Velocidade Real**
```sql
-- Otimiza a abertura do Dashboard (busca por usuário E status do dia simultaneamente)
CREATE INDEX idx_tasks_user_status_date ON tasks (user_id, status, planned_date);

-- Otimiza especificamente a varredura do histórico da North Star Metric
CREATE INDEX idx_tasks_streak_audit ON tasks (user_id, is_frog, status) 
WHERE is_frog = true;
```
