# Decisões Técnicas e Arquiteturais (MVP) - Performly

Este documento registra as decisões fundamentais, mínimas e reversíveis, necessárias para guiar o início do desenvolvimento seguro do MVP do Performly, mantendo o alinhamento total com o princípio de "Clareza Radical → Execução Consistente".

## 1. Plataforma: Web app responsivo (Desktop + Mobile)
**A Decisão:** O Performly será desenvolvido desde o primeiro dia como uma aplicação web responsiva (acessível via navegador, adaptável e perfeitamente funcional em telas pequenas e grandes).
**O Por Quê:** Porque a dor do usuário acontece em múltiplos contextos (anotar ideias rápidas na rua pelo celular, executar trabalho focado na mesa pelo notebook) e um web app garante acesso imediato aos dois mundos com uma única base de código, sem atrito de instalação.

## 2. Abordagem de UI: Separação Estrita (Modo Clareza vs Modo Ação)
**A Decisão:** A interface de usuário (UI) terá dois "modos" distintos que nunca dividem a mesma tela ao mesmo tempo: O Modo Clareza (planejamento amplo da Central de Tarefas) e o Modo Ação (foco restrito no Top 6 e no Pomodoro).
**O Por Quê:** Porque misturar a visão geral de tudo o que há para fazer com a tela de foco na tarefa atual gera ansiedade, quebrando a regra de ouro de focar em uma coisa por vez.

## 3. Estratégia de Dados: Tudo nasce de Task e seus estados
**A Decisão:** No banco de dados, existirá apenas o conceito de "Tarefa" (Task). Ser parte do "Top 6 do dia" ou ser coroado como o "Sapo do Dia" serão apenas etiquetas (atributos/status) atreladas àquela mesma Tarefa única. Não haverá tabelas separadas para isso.
**O Por Quê:** Porque duplicar a mesma tarefa em várias tabelas diferentes cria bugs de sincronização e aumenta a complexidade de atualização do banco de dados desnecessariamente.

## 4. Estratégia de Métricas (North Star & Secundárias)
**A Decisão:** O sistema rastreará e destacará o *Frog-Eating Streak* (dias seguidos vencendo o Sapo) como a nossa *North Star Metric* (Métrica Norteadora principal). Como apoio diário, rastreará métricas secundárias como o número de Pomodoros completados e tarefas concluídas no dia.
**O Por Quê:** Porque o Streak principal garante e mede o verdadeiro sucesso de longo prazo do usuário (fazer a coisa certa consistentemente), enquanto as métricas secundárias garantem a recompensa tátil e rápida de curto prazo durante a jornada do dia.

## 5. Estratégia de Versionamento: Branch Protection e Revisão
**A Decisão:** O código fonte principal (a branch `main`) será rigorosamente protegida. O desenvolvimento de funcionalidades vai acontecer na branch `dev` e todo código novo passará por Pull Request (PR) contendo revisão antes de ir ao ar na `main`.
**O Por Quê:** Porque essa barreira de segurança garante que a versão oficial do produto nunca seja "quebrada" por um erro acidental num ambiente de desenvolvimento, preservando a confiança do usuário.

## 6. Política de Escopo: Blindagem Absoluta do MVP
**A Decisão:** O Escopo do MVP está perfeitamente delimitado no PRD; qualquer nova ideia, sugestão de "feature rápida" ou funcionalidade complexa fora do escopo original será imediatamente movida para o backlog (lista de ideias/roadmap futuro) e não será desenvolvida agora.
**O Por Quê:** Porque focar no núcleo essencial e lançar rápido é a única forma de provar o valor real do produto (o "Clareza Radical → Execução"), protegendo o projeto contra a paralisia do inchaço de funcionalidades (feature creep).

## 7. Stack Tecnológica (MVP) — Decisão Fechada
- **Frontend/Backend:** Next.js (React) + TypeScript — Unifica visual e servidor, garantindo produtividade e velocidade para desenvolvimento solo.
- **UI:** TailwindCSS — Permite criar componentes responsivos e bonitos rapidamente sem gerenciar arquivos CSS avulsos.
- **Banco de Dados:** Supabase (PostgreSQL) — Mantém as regras "Clareza RadicaI" (Top 6, Sapo) íntegras e centralizadas num banco relacional de confiança.
- **Auth:** Supabase Auth (Google + Magic Link por e-mail) — Fluxo rápido e indolor para não afastar a persona que quer zero atrito.
- **Deploy:** Vercel — Hospedagem simples que escala junto, subindo a aplicação automaticamente a cada nova atualização na main.
- **Observação:** O MVP prioriza simplicidade e integridade de dados; todas as decisões aqui podem ser revisadas no longo prazo pós-MVP sem medo.

---

## Decisões Pendentes (Próximos Passos)
O que ainda não decidimos e precisaremos definir antes de escrever a primeira linha de código estrutural:

- **A Stack Tecnológica**: Qual tecnologia exata usaremos para o Frontend (React, Vue, etc.), Backend e Banco de Dados.
- **Identidade Visual**: A paleta de cores (ex: como dar destaque ao "Sapo" com elegância) e esquema de tipografia.
- **Autenticação**: Como o usuário fará o seu cadastro e login inicial.
- **Hospedagem / Deploy**: Onde a aplicação ficará rodando no ar (Vercel, Netlify, AWS, etc.).
