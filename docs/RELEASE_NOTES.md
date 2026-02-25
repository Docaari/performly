# Performly MVP - Release Notes (v0.1.0)

O Performly nasceu para ser a forma mais visceral e com zero-distração de executar tarefas na internet. 

## 🌟 O que o MVP Inclui
- **Autenticação (Magic Link e OTP)**: Setup robusto via Supabase Auth + Row-Level Security (RLS) protegendo os dados por usuário no servidor PostgreSQL.
- **Central de Tarefas (`/tasks`)**: O Backlog infinito. Adicione sua tralha mental, ative e desative tarefas otimisticamente sem engasgos.
- **Planejador Top 6 (`/plan`)**: O coração da eficácia. Traz ao mundo a metodologia de Ivy Lee, limitando seu foco ao máximo de 6 frentes do dia, movendo com 1 click entre o seu Backlog e o seu Dia atual.
- **O Sapo do Dia (`Eat The Frog`)**: Mecanismo que tranca uma — e somente uma — tarefa do Top 6 como o "Sapo" que deve ser engolido primeiro.
- **Modo Foco (`/focus`)**: Tela zen de isolamento total. Timer de 25:00 travado no seu Sapo. Conecta SSR com suas métricas diárias, registrando na tabela `pomodoros`. 
- **Dashboard e North Star Metric (`/dashboard`)**: Visões SSR imediatas da produtividade de hoje (Pomodoros, Tasks) e o troféu do aplicativo: a métrica retrospectiva contínua "Frog-Eating Streak". 

## 🚫 O que o MVP **NÃO** Inclui (Escopo Futuro)
- Gráficos visuais (ex: Recharts) do Pomodoro.
- Pausas curtas/longas dinâmicas no Pomodoro (atualmente encerra após 25:00 contínuos em prol da fundação).
- Agendamento de tarefas para dias futuros customizados (só existe a data "Hoje" vs "Backlog").
- Deleção/Edição complexas de tarefas (o status toggle resolve para arquivamento mental provisório).
- Tabelas ou gamificações pesadas (ex: Moedas, níveis, streaks de atividades sub-otimizadas).
- Multi-projetos (Performly trata sua vida como The One Project).

## 🚀 Como Rodar Localmente

Certifique-se de ter o Node.js v18+ instalado.

1. **Clone e Instale**
   ```bash
   git clone [seu-repo]
   cd performly
   npm install
   ```
2. **Setup do Supabase**
   Crie as tabelas `tasks` e `pomodoros` no dashboard SQL do seu Supabase de acordo com o `schema.sql` ou diagramas providenciados.
3. **Variáveis de Ambiente**
   Crie um `.env.local` na raiz com:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   ```
4. **Rodar o Servidor**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`
