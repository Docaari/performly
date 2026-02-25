---
name: ux-responsive
description: Diretrizes de Experiência do Usuário (UX) e Responsividade do Performly
---

# ux-responsive

**Objetivo:**
Garantir que a interface do Performly seja absurdamente simples, responsiva (adaptando-se graciosamente entre Desktop e Mobile), acessível e focada em reduzir qualquer atrito entre o pensamento do usuário e a execução da tarefa.

**Regras Obrigatórias:**
- **Layout Desktop:** Usar um modelo de *Sidebar* (barra lateral) limpa para navegação principal e configurações, deixando o centro livre para o foco.
- **Layout Mobile:** Substituir a barra lateral por uma *Bottom Navigation* (barra inferior) fixa e ergonômica, facilitando o uso com uma mão só.
- **A Regra do "Zero Atrito":** O usuário nunca pode dar mais de 3 cliques (ou toques na tela) do momento em que abre o app até iniciar um Pomodoro para seu 'Sapo do Dia'.
- **Estados Vazios (Empty States) Construtivos:** Quando não houver tarefas na Central ou o Top 6 não estiver definido, a tela não pode ser um buraco em branco; deve conter um CTA (Call to Action) amigável que ensine e convide o usuário ao planejamento.
- **Acessibilidade Básica:** Contrastes adequados de texto e foco visual visível para navegação por teclado (Tabs) precisam vir como padrão usando os utilitários do Tailwind (ex: `focus:ring`).

**Checklist "Antes de Entregar":**
- [ ] O componente principal (ex: o timer Pomodoro) continua funcionando e legível em uma tela da largura de um iPhone SE?
- [ ] Reduzi pelo menos 1 clique desnecessário neste novo fluxo em comparação com a ideia inicial?
- [ ] A cor de destaque (ex: marcação do Sapo) distrai o usuário do resto das tarefas importantes ou o guia como deveria?

**Anti-padrões (O que evitar):**
- Criar formulários enormes ou modais invasivos (pop-ups rotineiros) que interrompem o *flow* diário.
- Esconder botões frequentemente usados (*Play*, *Concluir*, *Adicionar*) atrás de menus hambúrgueres no Mobile.
- Deixar links e botões pequenos demais, frustrando o "Fat Finger" dos usuários em telas de toque.
