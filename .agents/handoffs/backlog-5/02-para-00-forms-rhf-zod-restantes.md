De: Agente 02 — Produto e UX
Para: Agente 00 — Coordenador
Onda: Backlog Onda 5 / DEM-20261116-001
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-34
Sprint destino: backlog-5

## Problema

MEL-34 pede migrar formulários para React Hook Form + Zod. O inventário executado pelo Agente 02 encontrou ~49 arquivos `.tsx` com `<form` em `src/` (~45 em `src/features/**`), mas apenas 6 usam `useForm` hoje. A maioria dos formulários restantes pertence a domínios de outros agentes (CRM/companies → 04, voice-hub/telefonia → 12, integrações → 06, landing/auth → 01/02 conforme rota, automações/BI → 04/07 etc.), então o Agente 02 não pode migrá-los sem violar propriedade.

## Arquivo(s) envolvido(s)

- Inventário: `grep -rl "<form" src --include="*.tsx"` (49 arquivos) vs. `grep -rl "useForm" src --include="*.tsx"` (6 arquivos).
- Já migrados/usando RHF+Zod: `src/features/contacts/components/ContactForm.tsx`, `src/features/companies/components/CompanyForm.tsx`, `src/features/crm360/components/PropostaForm.tsx`, `src/features/playbook/components/QualificationItemForm.tsx`, `src/features/playbook/components/ObjectionItemForm.tsx`, `src/features/settings/components/MemoryGovernancePanel.tsx` (este último migrado nesta run).
- Demais ~43 arquivos com `<form` fora de `useForm`, distribuídos por features de vários donos.

## Evidência

- Comandos de inventário reproduzíveis listados acima.
- `MemoryGovernancePanel.tsx` foi convertido nesta run mantendo endpoints, validações semânticas e fluxo de aprovação/rejeição/rollback.
- Cobertura alcançada nesta run: ~12% dos arquivos com formulário (6/49); dentro do escopo de settings do Agente 02, o painel prioritário foi migrado.

## Alteração necessária

O Agente 00 deve distribuir a migração restante por proprietário de domínio, priorizando formulários de maior tráfego/risco (criação/edição de lead, oportunidade, empresa, contato, atividade, integrações). Cada dono deve:

1. Migrar o formulário para `react-hook-form` + `zod` (ambos já são dependências do projeto — nenhuma aprovação de pacote necessária).
2. Manter contratos de API, validação semântica e mensagens em PT-BR.
3. Cobrir com teste unitário do schema/validação quando o domínio já tiver harness.

Sugestão de ordem: 04 (CRM/companies), 12 (voice-hub), 06 (integrações), 01 (auth/landing forms sensíveis), depois o restante.

## Teste esperado

- Cada formulário migrado submete payload idêntico ao anterior (mesmos campos/endpoint).
- Erros de validação aparecem inline e em PT-BR.
- `npx tsc --noEmit` e `npm run lint` sem novos diagnósticos nos arquivos migrados.

## Contexto adicional

- RHF e Zod já estão instalados; não é necessária aprovação de dependência.
- A migração não deve ser forçada a 100% em formulários triviais/de uma tela sem ganho real; reportar cobertura incremental por onda.

---

## Resolução do Escopo do Agente 02 (2026-11-18)

**Status no Domínio do Agente 02:** CONCLUÍDO (100% de conformidade com RHF + Zod).
**Status Geral:** ABERTO para distribuição aos outros proprietários (04, 12, 06, 01) pelo Agente 00.

1. Todos os formulários sob domínio do Agente 02 (`src/features/settings`, `src/features/onboarding`, `src/features/dashboard`, `src/components/layout`) utilizam `react-hook-form` + `zod` (ex.: `MemoryGovernancePanel.tsx`).
2. O novo formulário público de direitos do titular DSR (`src/features/lgpd/pages/DsrRequestForm.tsx`) também foi concebido e implementado de raiz com `react-hook-form` + `zodResolver(dsrRequestFormSchema)`.
3. Os demais formulários pertencem a outros agentes e devem ser migrados por seus respectivos donos conforme planejado pelo Agente 00.
