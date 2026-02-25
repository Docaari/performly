---
name: system-guardrails
description: Regras fundamentais e inegociáveis do produto Performly
---

# system-guardrails

**Objetivo:**
Garantir que todas as decisões tecnológicas, de UI e de arquitetura do Performly obedeçam à sua filosofia central de simplicidade, clareza e ação focada.

**Regras Obrigatórias:**
- **Plan-first sempre:** Nenhuma linha de código ou novo componente deve ser criado sem antes ter sido discutido e aprovado pela documentação/PRD.
- **MVP Fechado:** O escopo do MVP é absoluto. Qualquer nova feature sugerida (ex: tags, calendários, colaboração) deve ser movida automaticamente para o `Backlog / Roadmap` e não implementada agora.
- **Núcleo de Produto:** Todas as funcionalidades nascem para servir à premissa: *Clareza Radical → Execução Consistente*.
- **Separação de UI:** O aplicativo possui dois modos estritos. "Modo Clareza" (visão ampla) e "Modo Ação" (execução do Top 6/Sapo). Nunca misture ferramentas de planejamento na mesma tela de foco e execução.
- **Métrica North Star:** O sucesso máximo do usuário e do app é medido pelo *Frog-Eating Streak* (dias seguidos executando o Sapo do Dia).

**Checklist "Antes de Entregar":**
- [ ] A funcionalidade recém-criada viola ou polui o "Modo Ação"?
- [ ] Inserimos alguma complexidade técnica desnecessária para suportar o MVP?
- [ ] A interface criada exige explicação ou quebra a barreira do "zero atrito"?

**Anti-padrões (O que evitar):**
- Começar a codificar logo após ler um *prompt*, antes de validar o escopo.
- Sugerir proativamente a adição de features que competem com o Sapo do Dia.
- Adicionar tabelas ou estruturas de dados que antecipam um crescimento de 5 anos do produto (YAGNI).
