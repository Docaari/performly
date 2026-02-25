# Product Requirements Document (PRD) - Performly

## 1. Visão do Produto

### 1.1. O que é o Performly
O Performly não é apenas um gerenciador de tarefas. É um sistema operacional pessoal focado inteiramente em performance e produtividade contínua. Ele organiza o ciclo completo do usuário: da captura de demandas até a execução com foco absoluto, fechando o ciclo com métricas simples e recompensas que incentivam a constância.

### 1.2. O Núcleo do Produto
Tudo no Performly deriva do seguinte núcleo: **Clareza Radical que gera Execução Consistente**. 

Nós acreditamos que a falta de execução raramente é preguiça; é falta de clareza. O Performly força o sistema e o usuário a definirem exatamente o que importa primeiro, removendo o ruído para que a execução se torne um caminho sem atrito.

---

## 2. O Problema e a Oportunidade

### 2.1. O Contexto Atual
Muitas ferramentas de produtividade atuais são repositórios sem fim. O usuário joga informações nelas, mas ganha de volta paralisia por análise e uma lista interminável e despriorizada.

### 2.2. A Dor Principal a ser resolvida
Sobrecarga cognitiva e fadiga de decisão na hora de agir. O usuário gasta mais tempo tentando se organizar – ou sentindo-se culpado pelas 40 coisas que *não* fez – do que focando nas coisas que realmente moveriam o ponteiro do seu sucesso.

### 2.3. O que o Performly não é (Anti-visão)
- Não é um canivete suíço complexo para gestão de projetos de longo prazo.
- Não é focado em colaboração ou times. 
- Não é uma ferramenta estritamente "técnica" ou para nerds de produtividade que amam microgerenciamento.

---

## 3. Perfil do Usuário (Persona)

### 3.1. Quem é "O Profissional Afogado"
É o criador de conteúdo, freelancer, estudante focado ou empreendedor (faixa dos 25 a 40 anos) que lida com múltiplos contextos simultâneos dia após dia e sente que a carga de trabalho nunca zera.

### 3.2. Suas dores diárias
Fica paralisado diante de listas gigantes. Trabalha por horas, mas frequentemente chega ao final do dia com a sensação de "corri muito, mas não saí do lugar" por não ter completado o que era realmente vital.

### 3.3. O que ele espera da ferramenta
Redução drástica do ruído. Ele não quer criar um sistema do zero. Ele quer que o aplicativo o pegue pela mão, reduza suas opções e diga com clareza o que ele precisa atacar agora. 

---

## 4. Escopo do Produto (MVP)

O Minimum Viable Product do Performly contém apenas 5 pilares, focados em transformar ruído em ação.

### 4.1. Central de Tarefas 
O repositório universal "Caixa de Entrada". Tudo o que o usuário precisa lembrar é jogado aqui inicialmente, livre de fricção e com zero preocupação de organização inicial, apenas para esvaziar a mente.

### 4.2. Metodologia Ivy Lee (Top 6)
A peneira da clareza. Diariamente, o sistema restringe o usuário a selecionar e ordenar um máximo absoluto de 6 tarefas da Central para se tornarem a sua única lista do dia seguinte. Todas as outras tarefas ficam ocultas para preservar o foco.

### 4.3. Metodologia Sapo do Dia (Eat the Frog)
Dentre as Top 6 tarefas diárias, uma, obrigatoriamente, deve ser coroada como "O Sapo" – a principal e mais difícil missão. É a prioridade número 1 indiscutível do dia.

### 4.4. Motor de Execução (Pomodoro)
Para resolver a última barreira (a procrastinação no momento de iniciar), o aplicativo integra um cronômetro Pomodoro nativo focado puramente na tarefa escolhida (ex: ciclos de 25 min trabalho / 5 min pausa).

### 4.5. Dashboard Simples
Um painel limpo com métricas e gráficos básicos que celebram a conclusão das entregas diárias, estimulando a gamificação positiva e visualização do progresso.

---

## 5. Jornada e Fluxo do Usuário

### 5.1. Fluxo de Captura
O usuário tem uma ideia ou lembrança -> Adiciona à Central de Tarefas com 1 clique.

### 5.2. Fluxo de Priorização
Ao fim do dia ou de manhã -> Abre a lista diária vazia -> Puxa 6 itens da Central (Ivy Lee) -> Define qual deles é O Sapo. A lista do dia está pronta.

### 5.3. Fluxo de Execução
Ao começar a trabalhar -> O sistema oculta a Central de Tarefas -> O usuário vê apenas seu Sapo no topo -> Ele aciona o botão de Foco e o Pomodoro se inicia para a tarefa coroada. 

### 5.4. Fluxo de Conclusão e Recompensa
Pomodoro finalizado -> Tarefa e Sapo concluídos -> Confetes visuais / som de completude -> Dashboard é atualizado positivamente. O sentimento de progresso é tangível.

---

## 6. Regras de Experiência do Usuário (UX)

### 6.1. Simplicidade e Redução de Atrito
ZERO fricção entre abrir o app e começar a adicionar, planejar ou trabalhar. Se levar mais de três cliques para definir e começar a executar O Sapo do dia, falhamos. A lógica deve ser à prova de intuição.

### 6.2. Princípios de Design 
Espaços em branco abundantes, tipografia limpa e hierarquia de cores direcionada pontualmente (foco guiado). A clareza visual deve preceder a ação do usuário. Nada deve competir por atenção com a tarefa que está rodando o Pomodoro.

---

## 7. Requisitos de Plataforma 

### 7.1. Mobile e Desktop Universal
As dores da persona (O Profissional Afogado) ocorrem em movimento (celular) e na base de operação (desktop). O Performly será responsivo e entregará experiência contínua em ambas as plataformas de forma equivalente desde o dia 1. Onde a visualização mobile seja mais desafiadora (Dashboard e Central com centenas de itens), adaptações elegantes de UX devem ocorrer. Funcionalidades base não serão exclusivas a uma plataforma.

---

## 8. Métricas de Sucesso

### 8.1. Métrica Norteadora (North Star Metric): Frog-Eating Streak
A métrica não é a quantidade de tarefas concluídas, mas sim a **Constância na execução da prioridade máxima**. Dias consecutivos em que o usuário com o seu Sapo do Dia inteiro. Um *streak* alto significa sucesso duplo: o Performly proporcionou a Clareza Radical e o usuário manteve a Execução Consistente.

### 8.2. Outros Critérios de Sucesso
- Altas taxas de ativação (usuários configurando as 6 tarefas diárias com fluidez na primeira sessão).
- Sessões completas de Pomodoros atrelados ao Sapo do dia por dia/usuário ativo.

---

## 9. Restrições e Limitações do MVP

### 9.1. Fora do Escopo Atual
- Metodologias complexas como o GTD avançado.
- "Time blocking" clássico ou integrações super complexas com calendários nativos em bloco no primeiro momento. 
- Gerenciamento de projetos estruturados em grande escala, com times multilocais, permissões ou níveis infinitos de sub-tarefas.

### 9.2. Regras Inegociáveis (Processo)
1. Plano primeiro. Documentação é a base, nenhum código passa em branco.
2. A branch `main` será blindada; iterações no core funcional ocorrerão na isolamento seguro de `dev` e outras branches.

---

## 10. Visão de Futuro (Roadmap pós-MVP)

Após provarmos no MVP a aderência do "Frog-Eating Streak", a ferramenta poderá evoluir para integrações mais orgânicas de reflexão e análise passiva de dados da rotina do usuário, otimização automática de estimativas de rotinas, além da ampliação da camada leve de gamificação de recompensas visuais. O objetivo principal do roadmap é manter o North Star crescendo, sem nunca adicionar novas features de produtividade que traiam o núcleo de Clareza e Simplicidade original.
