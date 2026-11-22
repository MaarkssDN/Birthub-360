# 13 — Plano de Execução por Ondas
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## Estado prévio (reconciliação)

- Fase Zero anterior (2026-11-19): concluída — inventário de rotas, ownership, achados DS-001/A11Y-001/CSS-001/GOV-003/QA-001/QA-002.
- WaveF mergeada: ux05a (auth morta), ux09 (perfil editável), pii-detection, scanner-real.
- Ondas 1-5 de dívidas técnicas: concluídas segundo `.agents/ESTADO_ATUAL.md`.
- **Bloqueio de escopo:** Landing e Login intocáveis; `src/components/ui/**`+`src/styles/**` → Agente 03; `layout/**` → Agente 02; implementações exigem parecer Agente 09.

## ONDA 0 — Baseline e Inventário ✅ (esta operação)

Entregue: 16 documentos em `docs/audits/experience-360/`. Pendências de baseline: `test:visual` nunca rodado (rodar antes de qualquer mudança visual); sweep axe por papel não-ADMIN.

## ONDA 1 — Correções P1 cirúrgicas (baixo risco, alto impacto)

| Item | Dono | Esforço |
|---|---|---|
| A11Y-002: `KanbanBoard.tsx:19` role/tabIndex sem handler (1 linha) | 04 | P |
| A11Y-001: `/app/characters` contraste + decisão de tema da página | 03/feature | P |
| REND-001: `useMemo` nos value de 5 providers | 03/02 | P |
| PERF-001: AbortController + race-guard + refetch silencioso no useFetch | hooks owner | M |
| UX-007: SignalsAndRisksHub erro≠empty | módulo | P |
| VoiceHubView `alert()` → toast | voice-hub owner | P |
| A11Y-003: TableRow role condicional | voice-hub owner | P |

Gate: typecheck + lint + unit + axe das telas tocadas + parecer 09.

## ONDA 2 — Navegação e higiene de rotas

| Item | Dono |
|---|---|
| UX-002 rotas órfãs: redirect canônico ou TabType próprio (war-room, failover/resilience, elite-agent, pending-actions, characters) | 02 |
| UX-001 voice-hub 503: aplicar redirect ou reabrir gate (decisão produto) | 02 + backend |
| UX-003 palette filtra por papel + remove settings_* legadas | 02/03 |
| UX-004/013 unificar nomes market-intelligence; renomear quick actions | 02 |
| UX-005 entrada de nav p/ settings/pillars | 02 |
| UX-006 home empty state + active-state `/app` | 02/30 |
| UX-009/OPP-02 menu de conta + logout mobile | 02 |
| UX-010 fonte única de navegabilidade (moduleRegistry canônico) | 02 |

Gate: E2E navegação + redirects + axe + mobile-sweep + parecer 09.

## ONDA 3 — Design System: tokens e CSS de produto

| Item | Dono |
|---|---|
| Revisão DL v2.0 pelo humano (fontes, radius, light tones, display) — pré-requisito | humano |
| DS-001 documentar precedência globals×official-identity (ou fundir) | 03 |
| DS-004 tokens `--space-*`; DS-005 breakpoints nomeados | 03 |
| CSS-003 unificar mecanismo de tema (hub-orbit → tokens) | 03 |
| CSS-004 resolver 3 autoridades de cor de título | 03 |
| CSS-007 escala `--z-*`; CSS-008 hex→tokens (#00E5FF etc.) | 03 |
| CSS-002 verificar e remover `index.css`/`luxury-tokens.css` mortos | 03 |
| DS-010/012 depreciar Vancouver/coolors e duplicações `.bh-*`/`.badge-*`/`.text-gradient-*` | 03 |
| DS-007 unificar motion (motion.ts × CSS tokens) | 03D |
| RSP-001 max-w nos modais voice-hub | voice-hub owner |
| PERF-002 Workbox globIgnores p/ chunks sob demanda | 08 |

Gate: `test:visual` antes/depois + axe + budgets + parecer 09. **Landing intocável — CSS-001 vira handoff separado.**

## ONDA 4 — Jornadas críticas e módulos

| Item | Dono |
|---|---|
| OPP-01 criação manual de lead (DEC-UX-01) | 04+21+02 |
| DEC-UX-02 settings pilar: persistir ou remover abas | 02/17 |
| DEC-UX-04 fallback DEAL_COLUMNS (regra API-only) | 04 |
| OPP-05 erro≠empty transversal (padrão + varredura) | 03E + módulos |
| UX-08 residual settings pilar + títulos duplicados UX-008 | módulos |
| Virtualização de tabelas prioritárias (REND-003) | módulos |

## ONDA 5 — Módulos (aplicação coordenada)

Por módulo, na ordem de uso: crm/crm360 → cadence/sales-orchestration → voice-hub → intelligence/copiloto → market-intelligence → settings → demais. Cada módulo: estados empty/error, títulos, responsividade, a11y labels.

## ONDA 6 — Experiência avançada (pós-validação)

OPP-03 recentes/favoritos · OPP-07 virtualização restante · OPP-09 ações de escrita na palette · OPP-10 onboarding por papel · OPP-08 densidade (se demandada).

## ONDA 7 — Responsividade e Acessibilidade completa

Sweep por papel não-ADMIN · mobile-sweep estendido · reflow 320px/zoom 200% · touch targets · screen reader roteiro crítico · axe full.

## ONDA 8 — Performance e polimento

Lighthouse CI por rota · CWV baseline · RUM · split Landing360 (login) · imagens lazy · font-faces.

## ONDA 9 — Regressão e homologação

Matriz completa (14-TEST-MATRIX) + parecer 09 + gate de release.

## Dependências críticas

- **Decisões humanas bloqueiam:** DL revisão (Onda 3), DEC-UX-01/02/03/04, voice-hub gate.
- **Ordem rígida:** Onda 1 antes de 2-5 (correções P1 evitam retrabalho); `test:visual` baseline antes de qualquer onda visual.
- **Proibições:** landing/login intocáveis; não editar arquivos de outros donos sem handoff; não mergear sem parecer 09.
