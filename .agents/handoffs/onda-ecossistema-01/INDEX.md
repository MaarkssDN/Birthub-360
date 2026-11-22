# Manifesto de Handoffs — Onda 01 do Ecossistema: Saneamento UI e Realismo de Agentes
**Orquestrador:** Agente 00 — Coordenador e Orquestrador Global  
**Data de Abertura:** 2026-11-09  
**Diretório:** `.agents/handoffs/onda-ecossistema-01/`  
**Referência Mestre:** `.agents/runs/00-auditoria-ecossistema-agentes-personagens-20261107.md`  
**Conformidade de Governança:** `AGENTS.md` §11, §15, §18, §19, §21 e §22  

---

## 1. Visão Geral e Objetivo da Onda
Erradicar a cenografia visual de IA identificada na auditoria forense do Agente 00, substituir temporizadores fictícios (`setInterval`) e comandos em `console.log` por conexões reais Server-Sent Events (SSE) ao `supervisor.agent.ts` (LangGraph) e rotas da Célula Comercial, garantindo acessibilidade WCAG AA e contratos OpenAPI/Zod estritos.

---

## 2. Matriz de Execução e Dependências

A ordem de integração segue rigorosamente `AGENTS.md` §19:
1. **Contratos & Tipos** (Agente 18)
2. **Runtime & Streaming** (Agente 07)
3. **Design & Acessibilidade** (Agente 03)
4. **UX & Navegação** (Agente 02)
5. **Revisão Independente & Gate** (Agente 24)

| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal | Status |
|---|---|---|---|---|---|---|
| [`00-para-18-contratos-streaming-cockpit.md`](./00-para-18-contratos-streaming-cockpit.md) | 00 | 18 | `bloqueador` | B-09 | `docs/openapi.yaml`, `src/features/intelligence/contracts/` | `resolvido` |
| [`00-para-07-backend-sse-swarm-binding.md`](./00-para-07-backend-sse-swarm-binding.md) | 00 | 07 | `bloqueador` | B-08 | `src/features/intelligence/agents/commercialCell.routes.ts`, `src/lib/agents/supervisor.agent.ts` | `resolvido` |
| [`00-para-03-ui-cockpit-estados-acessibilidade.md`](./00-para-03-ui-cockpit-estados-acessibilidade.md) | 00 | 03 | `alto` | B-06 | `src/components/ui/ModuleAgentWidget.tsx`, `src/components/intelligence/` | `resolvido` |
| [`00-para-02-integracao-cockpit-crm-layout.md`](./00-para-02-integracao-cockpit-crm-layout.md) | 00 | 02 | `alto` | B-06 | `src/App.tsx`, `src/components/layout/MainLayout.tsx` | `resolvido` |
| [`00-para-24-diretrizes-auditoria-onda-01.md`](./00-para-24-diretrizes-auditoria-onda-01.md) | 00 | 24 | `alto` | Gate | `.agents/reviews/` | `resolvido` |

---

## 3. Critérios Globais de Pronto (DoD)
- Zero `setInterval` ou `console.log` simulando esteiras de IA.
- 100% das mensagens enviadas pelo usuário trafegam por rota HTTP/SSE autenticada com tenant isolado.
- Estados explícitos de `loading`, `streaming`, `empty` e `error`.
- `npx tsc --noEmit` com código de saída 0.
- `npm run lint` sem novos erros.
- Parecer `APROVADO` do Agente 24 em `.agents/reviews/`.
