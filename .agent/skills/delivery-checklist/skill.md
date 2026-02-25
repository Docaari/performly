---
name: delivery-checklist
description: Regras de Entrega e Commit do Agente Performly
---

# delivery-checklist

**Objetivo:**
Garantir que todas as entregas do agente sejam pequenas, seguras, reversíveis e sempre documentadas em linguagem simples para o usuário não técnico.

**Regras Obrigatórias:**
- **Entregas Atômicas:** Trabalhar sempre focado em concluir uma única pequena tarefa ou Pull Request (PR) por vez. Não acumule 15 arquivos modificados antes de fazer um commit estrutural.
- **Linguagem Humana:** Ao concluir uma etapa ou commit, as mensagens e explicações enviadas ao usuário devem ser claras, livres de jargões arquiteturais densos. Diga o que mudou no fluxo ou na regra de negócio, não o nome da variável.
- **Proteção da Main:** Nunca, sob nenhuma circunstância, o agente deve alterar código diretamente na branch `main`. Todo o trabalho ocorre na branch `dev` (ou em branches de *feature* que nascem e morrem nela).
- **Validação Contínua:** Se o projeto possuir scripts de verificação (ex: `npm run lint`, `npm run build`, ou testes), eles devem ser executados e aprovados pelo agente antes de reportar a tarefa como concluída.

**Checklist "Antes de Entregar":**
- [ ] O commit/PR atual cobre apenas o escopo da tarefa isolada que eu estava executando agora?
- [ ] Minha explicação para o usuário foca no "por que e o que" mudou, ao invés do "como escrevi a linha 44"?
- [ ] O código quebra a compilação atual (build) do projeto em `dev`?
- [ ] Evitei "Refactors Gigantes" que reescrevem arquivos inteiros só por estilo ou capricho?

**Anti-padrões (O que evitar):**
- Fazer *commits* enormes chamados "Update geral no sistema" com 40 arquivos.
- Enviar pedaços de código complexos no chat do usuário exigindo que ele copie e cole.
- Começar um *refactor* monumental de componentes perfeitamente funcionais sem o aval explícito do usuário.
