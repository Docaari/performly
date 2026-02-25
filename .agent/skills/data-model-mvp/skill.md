---
name: data-model-mvp
description: Regras de Modelagem de Dados e Consistência do Performly MVP
---

# data-model-mvp

**Objetivo:**
Garantir que a estrutura do banco de dados relacional seja enxuta, fortemente centrada no conceito de "Tarefa Única", e preparada para calcular as métricas de sucesso baseada num histórico auditável, não sujeita a inconsistências de estado.

**Regras Obrigatórias:**
- **Entidade Central Única:** Tudo que precisará ser feito nasce obrigatoriamente e exclusivamente na tabela principal `Task`.
- **Top 6 e Sapo como Status Temporais:** O 'Top 6' e o 'Sapo do Dia' não são listas/tabelas separadas. Eles são atributos ou chaves estrangeiras (`is_frog`, `is_top_six`, `planned_for_date`) vinculados a uma `Task` para um dia específico.
- **A Regra do Reset Diário:** O Top 6 e o Sapo obrigatoriamente devem expirar ou ser limpos na virada do dia para a manhã seguinte, forçando o usuário a repriorizar. "Sapos antigos" não sobrevivem à noite.
- **Histórico de Pomodoro:** Sessões de Pomodoro não devem ser apenas campos "completados" numa Task. Precisam ser registrados historicamente atrelados a uma Task e um dia, para permitir extração métrica posterior.
- **Cálculo de Streak Sólido:** Os 'Streaks' (Frog-Eating Streak) devem ser deriváveis/calculáveis olhando para o histórico das tarefas completadas (`completed_at`). Não confie unicamente num campo de inteiro solto no perfil do usuário (`frog_streak = 5`) que possa dessincronizar com os dados reais.

**Checklist "Antes de Entregar":**
- [ ] O modelo proposto impede logicamente a existência de 2 "Sapos do Dia" abertos simultaneamente para um mesmo dia/usuário?
- [ ] Se o usuário não acessar o app por 3 dias seguidos, o modelo fará com que o Streak resete corretamente no re-acesso?
- [ ] Eliminei qualquer redundância de dados que poderia gerar tabelas "órfãs"?

**Anti-padrões (O que evitar):**
- Criar relacionamentos desnecessariamente polimórficos de alta complexidade.
- Armazenar o estado inteiro da aplicação localmente no frontend (ex: *localStorage*) sem validar e sincronizar instantaneamente esses status com o banco principal.
- Usar _soft deletes_ (esconder invés de deletar) de forma desnecessária caso a entidade não afete cálculos históricos de métricas.
