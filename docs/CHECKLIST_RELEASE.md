# Performly MVP - Release Checklist / Smoke Tests

Antes de aprovar e realizar o merge para `main` ou deplicar a build definitiva na Vercel (Production), execute esse rápido roteiro de QA:

- [ ] **1. Autenticação Isolada**
  - Entrar usando o formulário de login (Link Mágico no e-mail ou Magic Link teste).
  - Preencher credenciais inválidas e checar se o link exibe pop-up de falha.
  - Verificar se redireciona pro `/dashboard` após o callback do Supabase no cenário de sucesso.

- [ ] **2. Criação Súbita de Tarefas (/tasks)**
  - Tentar criar tarefas vazias (deve falhar nativo ou Server Action error).
  - Criar "Task Smoke 1" e "Task Smoke 2" e ver se caem nativamente na tela (SSR Revalidate funcionando).
  - Ativar/Desativar o círculo do *checkbox*. Se a UI não pipocar, otimismo está ok.

- [ ] **3. Gargalo do Top 6 (/plan)**
  - Tentar jogar > 6 tasks pro Top 6 para atrelar a `planned_date` a Hoje. Tem que barrar exibindo barra vermelha de erro.
  - Selecionar uma task como Sapo ("Definir Sapo"). Virar o botão para verde "Sapo Ativo".
  - Trocar o sapo para outra task. O visual na Top 6 tem que mudar o Sapo instantaneamente com 1 clique.

- [ ] **4. The Deep Work (/focus)**
  - Com o Sapo setado, acesse `/focus`. O titulo "Task Smoke X" deve estar lá em cima estampado. 
  - (Modo dev apenas): Adicione o time de `[Testar 5s]`, e clique "Iniciar Foco". Ao terminar, verificar o toast de registro do pomodoro e atualizar The Dashboard.

- [ ] **5. A North Star (/dashboard)**
  - Botão de Concluir Tarefa na raiz: Com a tarefa pendente, clique no atalho "Marcar Sapo como feito".
  - O número da *Streak* deve pular para `+1` sem refresh (Fast Refresh Next.js).
  - Os quadrados inferiores (Tarefas Concluídas e Focos Hoje) devem ser condizentes com o uso durante os últimos dois minutos.

Se todos checkboxes brilharem verde, The MVP está **Pronto para Main.**
