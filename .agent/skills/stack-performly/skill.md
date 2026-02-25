---
name: stack-performly
description: Regras e convenções da Stack Tecnológica do MVP do Performly
---

# stack-performly

**Objetivo:**
Garantir o uso consistente do ecossistema Next.js, da base de dados Supabase e do TailwindCSS, focando em simplicidade, manutenibilidade para um dev solo e clareza estrutural acima de tudo.

**Regras Obrigatórias:**
- **Core Stack:** Desenvolver estritamente usando Next.js (com o paradigma de App Router) + TypeScript.
- **Estilização Visual:** Todo o design deve usar obrigatoriamente TailwindCSS. Não criar ou gerenciar arquivos CSS avulsos/puristas exceto o global base.
- **Banco de Dados:** Utilizar Supabase (PostgreSQL) para garantir a integridade dos atributos comportamentais rígidos (Top 6 e Sapo).
- **Autenticação:** Supabase Auth (Integrado via Google e Magic Link) – visando a menor barreira de entrada da persona.
- **Deploy Automático:** Todo código fundido em `main` deve estar com *lint* passando para o Vercel fazer o *deploy* impecável.
- **Convenção de Pastas/Nomes:** Manter os nomes de pastas e rotas em minúsculo (kebab-case), componentes em PascalCase, e métodos/variáveis em camelCase.
- **Linguagem Cidadã:** Comentários no código e nomes de funções/atributos que tangem regras de negócio puras (ex: "Frog", "Streak") devem ser mantidos semânticos à regra do produto.

**Checklist "Antes de Entregar":**
- [ ] O componente novo utiliza estritamente Tailwind ou importei biblioteca não-oficial de estilo?
- [ ] As tipagens no TypeScript refletem com exatidão as tabelas do Supabase?
- [ ] O componente respeita a separação entre Client Components (`"use client"`) e Server Components no Next.js App Router?

**Anti-padrões (O que evitar):**
- Criar APIs no Next.js para fazer o que o frontend poderia fazer consumindo o Supabase Client nativamente (ex: *over-fetching* desnecessário).
- Instalar bibliotecas pesadas de interface gráfica inteiras quando o Tailwind é capaz de estilizar um botão idêntico.
- Criar regras complexas de banco de dados no frontend em vez de usar *Row Level Security* (RLS) ou tabelas claras no Supabase.
