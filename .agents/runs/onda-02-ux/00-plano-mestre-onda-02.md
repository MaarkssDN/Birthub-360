# Onda 02 — Reconstrução Integral das Interfaces e Experiência Modular

**Coordenador:** Agente 00 — Supervisor Geral (execução Devin Desktop)
**Data de abertura:** 2026-11-12
**Branch de trabalho:** `agente/02-onda-02-ux`
**Status:** EM_EXECUCAO

## 1. Etapa Zero — Resultado da reconciliação

Fontes consultadas: `AGENTS.md` (raiz e `src/components/layout/`), `PRODUCT.md`,
`DESIGN.md` (contexto carregado via skill Impeccable), `moduleRegistry.ts`,
`src/App.tsx`, `HANDOFFS_EXECUTION_MASTER_REPORT.md` (10/11/2026), handoff
`proposta-navegacao-modulos-isolados.md`, `docs/architecture/NAVEGACAO-MODULAR.md`.

### Estado real verificado no código

- **Arquitetura modular existe e está implementada**: rail de 11 módulos +
  Hub em `src/components/layout/moduleRegistry.ts` (436 linhas), `ModuleRail`,
  `ModuleNavPanel`, `AssistantsDock` (Copiloto + Chatbook simultâneos),
  lazy loading por rota em `src/App.tsx` (75+ rotas `/app/*`).
- **11 módulos oficiais mapeados**: HUB + P01–P08 + M09–M11, com `home`,
  `items`, `extraTabs`, `extraPaths`, gates de permissão e disponibilidade
  (`m10` = mobile-only, `m11` = rota top-level `/social-selling`).
- **Personagens**: catálogo em `src/features/characters/` (catalog +
  catalogAgents + catalogPillars ≈ 29–32 entradas); avatares SVG locais
  integrados via `ModuleAgentWidget` (handoff 11→02/03 resolvido, parecer 24
  APROVADO em `.agents/reviews/`).
- **Quality gate baseline**: `npx tsc --noEmit` = **0 erros** (executado em
  2026-11-12 nesta sessão). Branch de entrada:
  `agente/14-w3-seed-compliance` com alterações não commitadas de outra frente
  (não tocadas).
- **Landing/Login**: `Landing360.tsx` (3370 linhas) é a rota real de `/`,
  `/welcome` e `/login`. `Landing360Impeccable.tsx` existe mas **não está
  roteada**.

### Conflito de governança registrado

`PRODUCT.md`/`DESIGN.md` declaram "proibido alterar Landing Page e Tela de
Login". A missão Onda 02 (ordem executiva do usuário, autoridade superior à
documentação de produto) ordena explicitamente o aprimoramento de
Landing/Login na Frente 07, com defeitos concretos listados. **Decisão:**
a ordem da missão prevalece; as alterações ficam restritas a correções de
honestidade funcional e acabamento, sem redesenho estrutural.

### Defeitos confirmados na Landing360 (evidência em código)

1. `handleLeadSubmit` (linha ~575): `setTimeout(650ms)` sem nenhuma chamada de
   rede → sucesso falso.
2. Copy de sucesso (linhas ~2044–2050): afirma "confirmação enviada" e
   "contato via WhatsApp em até 15 minutos" — nunca acontece.
3. "4 vagas remanescentes para o ciclo assistido desta semana" (linha ~2033):
   escassez fabricada, sem fonte real.
4. "Abrir Google Agenda" → `https://calendar.google.com` genérico (linha
   ~2054): não é o booking real do produto (`/book/:slug` exige slug de
   booking link por usuário — não configurado na landing).
5. Não existe endpoint público de captura de lead: rotas `/api/*` públicas são
   apenas `/api/auth/*`, `/api/calendar/book/:slug` e webhooks. O formulário
   não tinha para onde enviar.

## 2. Frente em execução nesta sessão

Devido ao isolamento obrigatório (§17 do AGENTS.md — agentes paralelos nunca
compartilham working tree) e à execução em sessão única, as frentes são
executadas **sequencialmente nesta branch**, com commits pequenos por frente.
A ordem prioriza defeitos funcionais reais sobre cosmética.

| Frente | Escopo | Status |
|---|---|---|
| F07 | Landing360: lead capture real + claims honestos | CONCLUÍDA (commit `bff84912d`, ver handoff) |
| F01 | Shell/tokens: auditoria Impeccable do design system | PARCIAL — chrome unificado em tokens (`fadae0ded`); auditoria completa dos 30 componentes e transições entre workspaces pendente |
| F02–F06 | Workspaces P01–P08, M09–M10 | PENDENTE |
| F08 | Personagens/Copiloto/Chatbook + a11y/E2E | PENDENTE |

## 4. Incidente de isolamento registrado

Durante a sessão, o HEAD do working tree compartilhado mudou **três vezes** por
checkout de outros agentes (`agente/14-w3-seed-compliance` →
`agente/02-onda-02-ux` → `agente/21-w3-consent-chain-async` →
`agente/22-w3-e2e-db-assert`), com arquivos de LGPD/Bitrix/cadence sujos de
frentes alheias. Os commits da Onda 02 caíram nas branches erradas por esse
motivo:

- `bff84912d` — Frente 07 (lead capture) sobre `agente/21-w3-consent-chain-async`
- `1b3a7c84d` — docs/handoff da Frente 07, mesma branch
- `fadae0ded` — Frente 01 (tokens do shell) sobre `agente/22-w3-e2e-db-assert`

Todos os conteúdos são isolados por arquivo e cherry-pickáveis. **Recomendação
ao Agente 00:** congelar checkouts concorrentes neste clone ou exigir worktrees
por frente (§17 do AGENTS.md) — do contrário toda a Onda 02 continuará caindo
em branches de saneamento alheias.

## 3. Handoffs previstos

- `02-para-01-lead-capture-publico.md` — se o endpoint público de captura
  exigir persistência em banco (schema é do Agente 01). Nesta sessão a
  implementação usa **e-mail via SMTP existente** (`sendEmail`), sem tabela
  nova — persistência estruturada de leads fica como handoff futuro.
- Impedimento registrado: claims de "demonstração agendada" dependem de um
  booking link público configurado por tenant — não existe slug oficial da
  marca; documentado como pendente de produto.
