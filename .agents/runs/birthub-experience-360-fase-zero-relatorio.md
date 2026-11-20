# Relatório consolidado — Fase Zero (Operação Birthub Experience 360)
Autor: Agente 00 · 2026-11-19 · Base: HEAD 03546a77 + PR #420 · Revisão 24: PENDENTE

## 1. Decisões humanas registradas (2026-11-19)
1. DS-001: `BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 é a autoridade visual máxima. Gradiente em título permitido só onde o DL v2.0 prevê (`Gradiente de Títulos`, `Gradiente de Ação`); gradiente decorativo arbitrário segue proibido. Diff do `.claude/CLAUDE.md` em `birthub-experience-360-proposta-claude-md.md` — NÃO aplicado.
2. `npm ci` autorizado e executado. 3. Plano de ondas após fechar a Fase Zero, sem tocar arquivos dos PRs #403/#404/#412/#415/#419. 4. Acompanhar PR #420.

## 2. Gates executados (resultados reais)
| Comando | Resultado |
|---|---|
| `npm ci` | EXIT 0 (avisos de deprecação + `npm audit` com vulnerabilidades — não detalhadas; PRÉ-EXISTENTE, tratar no gate de release) |
| `npm run typecheck` | TESTADO: sem erros (saída vazia, ~66 s) |
| `npm run lint` (biome) | TESTADO: 0 erros, **1561 warnings + 2 infos** (PRÉ-EXISTENTE; amostra mostra `!important` em `globals.css` ~l.660) |
| `npm run test:unit` | **INCONCLUSIVO / NÃO CONCLUÍDO**: encerrado por timeout de 900 s (EXIT 124) com `--no-file-parallelism`; sem sumário final de arquivos/testes no log (ruído de logs de worker; as linhas "ERROR … HTTP 500" são saída esperada de testes de falha, não prova de falha). Não declarar verde nem vermelho; reexecutar por domínio com mais tempo (a cargo do 08/14). |
| `test:e2e`, `test:visual`, axe | **NÃO EXECUTADO / BLOQUEADO**: exigem `.env.test` (inexistente), Postgres + Redis e webServer `tests/e2e/e2e-server.ts`; `psql`/`redis-server`/`docker` existem no container, mas o provisionamento de DB de teste e credenciais é decisão/segredo — pedir ao 14. |
Consequência: inventário visual (desktop/mobile × light/dark) das rotas autenticadas NÃO realizado; classe de cobertura abaixo é "auditado só no código".

## 3. Inventário de rotas (VERIFICADO NO CÓDIGO — `src/App.tsx`, `src/components/layout/AppLayout.tsx`)
**Públicas (13):** `/` , `/welcome`, `/landing-new`, `/login`, `/reset-password`, `/privacy`, `/terms`, `/privacidade/dsr/verificar`, `/privacidade/dsr/acompanhamento`, `/book/:slug`, `/select-brand`(redirect), `/hub`(redirect), `*`(redirect). **Protegidas:** `/social-selling`, `/setup` (ADMIN), `/design-lab/{command-language,components-v2,home-proposals}`.
**`/app/*` (≈73 `<Route path>` em AppLayout, lazy):** home/index, dashboard, workspace, prospect, prospect/inteligente, crm, crm360, mesa-tratamento*, signals-risks (+radar, deal-risks), intelligence (+elite-agent, pending-actions), pending-actions, copiloto_ia*, companies, contacts, activities, voice-hub/*, cadence, playbooks, jornadas, processos, roteiros, chatbook, roleplay, gamification, qualification_matrix, objections_matrix, topic_training, bitrix, reports, integrations, knowledge, analytics, winloss, war-room, market-intelligence (+hub, accounts/:id, deck), propostas, commercial_intelligence*, daily-plan, sdr-diagnostic, calendar, notifications, automations, usage*(ADMIN), editor, team*, module-access*(ADMIN), settings, failover*, resilience*, forecast*, metas*, pipeline_ponderado*, settings/pillars(/:pillar), settings_{hub,market,sales,performance,predictability,ai,automation,engagement}, characters; redirects: dialer/*, outbound/*. (`*` = protegida por `RequireRole`: ADMIN, ADMIN+GESTOR, MESA_TRATAMENTO_ROLES, COPILOTO_IA_ROLES, COMMERCIAL_INTELLIGENCE_ROLES.)
Cobertura: 100% identificadas no código; 0% em execução (BLOQUEADO, §2). Contagem exata de rotas é aproximada (grep), a confirmar na Onda 0.

## 4. Matriz de ownership real (cruzando agentes × prompts)
| Escopo | Dono oficial (AGENTS.md §15 / prompts) | Observação |
|---|---|---|
| `src/App.tsx`, Sidebar, navegação, `src/components/layout/**`, dashboard, onboarding, settings | **02** | Qualquer mudança em `AppLayout.tsx` (rotas) → handoff 02 |
| `src/components/ui/**`, `src/styles/**` | **03C** (design system), 03 | #415 toca `src/components/ui/` — não editar |
| `src/lib/motion.ts` + variantes | **03D** | |
| a11y em `src/**` (somente atributos) | **03E** | |
| QA visual / baselines | **03F** + 08/14 | #419 dono dos snapshots |
| Anti-slop / Impeccable | **03G** | |
| Páginas autenticadas `src/pages/**`, orquestração de design | **03A/03B** | |
| **Landing e Login** | **intocáveis** por 03A/03G ("100% intocadas") | #412/#415 mexem em `src/features/landing/pages/` — fora de escopo para esta operação |
| `identidade-visual/**`, marca | **11** | Sincronização com paleta neon pendente (DS-002) |
| `.github/workflows/**`, `playwright.config.ts`, Docker | **08** (#404, #403 em curso) | |
| `android/**`, `capacitor.config.ts` | **09** | |
| `.agents/prompts/**`, `AGENTS.md`, `.claude/CLAUDE.md` | decisão humana | proposta apenas |
Os 7 agentes `.claude/agents/birthhub-*` (a11y-auditor, design-director, design-system-engineer, impeccable-guardian, motion-engineer, ui-ux-architect, visual-qa-inspector) mapeiam 1:1 para 03E, 03A, 03C, 03G, 03D, 03B, 03F; **não são donos de arquivos** — executam sob a propriedade do número oficial. Atenção: o prompt mestre citava o "03" genérico; na prática 03A–G herdam a restrição Landing/Login.

## 5. Skills: correção de GOV-001 e sobreposição (GOV-002)
- **GOV-001 corrigido:** as skills `birthhub-*` EXISTEM em `.agents/skills/` (accessibility, design-director, frontend-design, motion-design-engineering, shadcn-system, taste, ui-ux-pro-max, visual-qa, web-interface-guidelines — 9). **Faltam** `birthhub-impeccable` (há `impeccable` genérica em `.agents/skills` e `.claude/skills`). Não estão em `.claude/skills/`, portanto o Claude Code NÃO as carrega automaticamente (só `.claude/skills/` carrega). Decisão para humano/00: espelhar em `.claude/skills/` (mudança de config; proposta).
- **Sobreposição de candidatos externos (nenhum instalado):** `impeccable` (já presente nas duas pastas ⇒ `pbakaus/impeccable` redundante), `shadcn` (⇒ `birthhub-shadcn-system`), `frontend-design` Anthropic (já em `.claude/skills/`), WCAG skill (⇒ `accessibility`, `wcag-*`, `axe-a11y`, `birthhub-accessibility`), Tailwind (⇒ `tailwind-token-auditor`), Playwright (⇒ `playwright-*`, `agent-browser`), `design-audit`/`design-review`/`frontend-doctor` (⇒ `web-design-guidelines`, `birthhub-visual-qa`, `design-system`). **Recomendação: instalar nenhum candidato externo agora** — cobertura já existe; só reavaliar o Playwright MCP (ambiente de browser) se o 14 não entregar o harness. Auditoria de supply chain (licença/commits/scripts) NÃO realizada (sem rede ao repositório de cada candidato) — Gate Humano permanece.

## 6. Achados priorizados
| ID | Sev. | Classe | Achado | Evidência | Owner |
|---|---|---|---|---|---|
| DS-001 | P1 | inconsistência objetiva | `.claude/CLAUDE.md` descreve paleta ouro obsoleta | `globals.css`, DL v2.0 | humano (proposta pronta) |
| A11Y-001 | P2 (rebaixado; antes P1) | risco fundamentado | CORREÇÃO: o spec do DL (azul/rosa/dourado claros) dá 3,55 / 3,92 / 2,77:1, mas os tokens REAIS do tema claro (`globals.css` l.376-380) já são variantes escuras: cyan `#0369a1` 5,15:1 (passa), pink `#d91b7c` 4,14:1 e gold `#b45309` 4,36:1 (<4,5 para texto normal; ok como texto grande). Resíduo: h4–h6/texto pequeno em pink/gold; falta medir em renderização real (Agente 14) | cálculo WCAG sobre `globals.css` | 03C + 03E, decisão humana |
| DS-003 | P2 | inconsistência objetiva | Tipografia: DL v2.0 é internamente inconsistente (Font Roles: Plus Jakarta Sans; Scale: Sora/IBM Plex Mono) e diverge de CLAUDE.md (Sora+Inter) e de `globals.css` (Inter/Sora/IBM Plex Mono). Fonte governante não definida | DL §3, CLAUDE.md §1, globals.css l.373-382 | decisão humana |
| DS-002 | P2 | inconsistência objetiva | `identidade-visual/` e `.claude/CLAUDE.md` fora de sincronia | CLAUDE.md §1 | 11 |
| CSS-001 | P2 | inconsistência objetiva | `!important` em `globals.css` (ex.: l.660 `scroll-behavior`), 1561 warnings biome | saída do lint | 03C |
| GOV-003 | P2 | risco | Gates E2E/visual/axe não reproduzíveis sem `.env.test`/DB | `playwright.config.ts` l.89 | 14 |
| QA-001 | P2 | risco | `npm audit`: vulnerabilidades reportadas pelo `npm ci`, sem detalhe coletado | log npm ci | 15 + 08 |

## 7. Plano de ondas alinhado aos PRs abertos (sem tocar arquivos deles)
- **Aguardar/integrar antes:** #415 (P0 segurança design-lab/ErrorBoundary/UI), #412 (login), #419 (baselines visuais), #404/#403 (gates/testes). Qualquer onda de UI começa DEPOIS de #415 e #419 em `main`, para não gerar conflito em `src/components/ui/` e nos snapshots.
- **Onda 0 (agora):** fechar Fase Zero: (a) parecer 24 do #420; (b) aprovação humana da proposta CLAUDE.md; (c) 14 provisiona `.env.test` + DB + Playwright para inventário visual real.
- **Onda 1 (estabilização P0/P1):** A11Y-001 (tokens de título no tema claro, via 03C/03E/11), CSS-001 apenas nos `!important` ligados a a11y/motion, auditoria axe das rotas `/app/*` priorizadas (dashboard, crm, crm360, cadence, settings). Nunca Landing/Login.
- **Pré-release:** `npm audit` + varredura de segredos do diff acumulado, 08 gate de integração, parecer 24.
- Ondas 2–9: manter o quadro do prompt mestre; reavaliar após Onda 1.

## 8. Pendências e decisões humanas
1. Aprovar/ajustar a proposta do `.claude/CLAUDE.md`. 2. Decidir a política de contraste dos títulos no tema claro (A11Y-001). 3. Autorizar espelhar skills `birthhub-*` para `.claude/skills/`. 4. Autorizar o 14 a criar `.env.test` e subir Postgres/Redis locais (sem segredos reais).

## 9. Atualização pós-autorização (2026-11-19)
Autorizado pelo Orquestrador Humano: (1) diff do `.claude/CLAUDE.md` — APLICADO (paleta neon, gradiente de título restrito ao DL v2.0 §2, regra de contraste claro A11Y-001); (2) política A11Y-001: títulos no tema claro devem usar variantes escurecidas AA — implementação em tokens fica para a Onda 1, após #415 e #419 entrarem na `main` (arquivos de `src/styles`/`ui` em disputa); (3) skills `birthhub-*` espelhadas em `.claude/skills/` (9; `birthhub-impeccable` não existe na origem); (4) `.env.test`/Postgres/Redis: autorizado ao Agente 14 — NÃO provisionado nesta sessão (requer ambiente e credenciais de teste locais, sem segredos reais). Revisão do Agente 24: PENDENTE.

## 10. Fechamento da Fase Zero — matriz de candidatos externos para o Gate Humano (Seção 7.2)
Inventário local: `.agents/skills` = 440 skills; `.claude/skills` = 46 (35 + 9 `birthhub-*` espelhadas + `impeccable`, `frontend-design` etc.). Nenhum candidato foi instalado. Auditoria de supply chain (mantenedor, licença, commits, scripts, telemetria) **NÃO EXECUTADA**: exige acesso aos repositórios externos (fora do escopo de rede desta sessão) — pré-condição para qualquer instalação.
| Candidato | Sobreposição com o que já existe | Recomendação |
|---|---|---|
| `pbakaus/impeccable` | `impeccable` já em `.agents/skills` e `.claude/skills` + agentes `impeccable-*` e `birthhub-impeccable-guardian` | NÃO instalar (redundante); verificar versão da skill local |
| `cuellarfr/design-skills` | `frontend-design`, `birthhub-frontend-design`, `birthhub-taste`, `design-system` | NÃO instalar |
| `84emllc/claude-wcag-skill` | `accessibility`, `birthhub-accessibility`, `wcag-color-contrast`, `wcag-compliance-reporter`, `wcag-keyboard-navigation`, `axe-a11y`, `a11y-violation-gate` | NÃO instalar |
| skill oficial `shadcn/ui` | `birthhub-shadcn-system`, `design-system` | Avaliar só se faltar cobertura de CLI/registry; baixa prioridade |
| `TailwindCSS-Claude-Skill-Package` | `tailwind-token-auditor` + Tailwind 4 CSS-first documentado em `CLAUDE.md` | NÃO instalar |
| Anthropic `frontend-design` | `frontend-design` (já em `.claude/skills` e `anthropic-skills:frontend-design`) | NÃO instalar |
| `MikelMartinC/frontend-doctor`, `wonjyou/design-audit`, `AslanMazhidov/design-review-skill` | `web-design-guidelines`, `birthhub-visual-qa`, `birthhub-web-interface-guidelines`, `code-review`, `agent-review-gate` | NÃO instalar; revisar só se achado novo provar lacuna |
| Anthropic TypeScript LSP plugin | `npm run typecheck` já verde; sem LSP configurado (nenhum `.mcp.json`) | Opcional; baixo valor |
| Anthropic PR Review Toolkit | `code-review` skill + Agente 24 (§40) | NÃO instalar (duplica o papel do 24) |
| Microsoft Playwright MCP/plugin | `agent-browser`, `playwright-*`, `@playwright/test` 1.63 local | Único candidato com ganho potencial (browser interativo); só se o 14 não destravar o harness (handoff `00-para-14`) |
Pedido ao Gate Humano: aprovar "instalar nenhum agora" e reavaliar apenas Playwright MCP após o retorno do 14.

## 11. Gates executados nesta etapa (sem baseline visual)
| Comando | Resultado |
|---|---|
| `npm run test:architecture` | TESTADO: EXIT 0 (depcruise + coverage + hotspots + baseline-freshness: 70 violações conhecidas conferem) |
| `npm run typecheck` / `npm run lint` | TESTADO (ver §2): sem erros / 0 erros e 1561 warnings PRÉ-EXISTENTES |
| `test:unit` (`npx vitest run -c vitest.unit.config.ts --reporter=dot`, paralelo) | TESTADO: EXIT 0 — 921 arquivos passed (921); 7366 testes passed, 1 skipped (7367). Substitui a execução inconclusiva de §2 (timeout de 900 s com `--no-file-parallelism`). Nota: usei execução paralela, não o script exato `npm run test:unit`. |

## 12. Achado de CI (QA-002, P2, risco fundamentado)
`visual-regression.yml` → job `Detectar escopo visual`: `git diff BASE_SHA...HEAD` sobre o merge ref inclui arquivos que entraram na `main` depois da base do PR (observado: `src/features/crm/application/LeadUseCases.ts` na lista do PR #420), marcando `relevant=true` e disparando Visual Regression em PR documental. Dono: 08 (`.github/workflows/**`). Handoff a abrir pelo 08/00; não editado aqui. Correção do que afirmei no comentário do PR: o PR altera só docs/`.claude`, mas o gatilho do Visual Regression vem de arquivos da `main`.

## 13. Atualização (2026-11-19, pós #419)
`test:unit` verde (ver §11). #419 mergeado; branch do PR #420 atualizada com a `main` (102db1fb); `Visual Regression` passou a `skipped` nessa revisão (escopo visual não inclui mais arquivos de `src/` da `main` desalinhados). Agente 14: `auth.spec.ts` 4/4 e `accessibility.spec.ts` 34/34 locais (`14-harness-playwright-local-20261119.md`); inventário visual das rotas `/app/*` e `mobile-sweep` seguem NÃO EXECUTADOS. Agente 24: parecer APROVADO apenas para 73dcc992; nova revisão solicitada para a revisão final.

## 14. Inventário visual real (Agente 14, 2026-11-19) — ver `.agents/runs/14-inventario-visual-app-20261119.md`
70 rotas `/app/*` em 4 variantes (1280x800/390x844 × claro/escuro), usuário ADMIN: 0 overflow a 390px; carga ≤ 2,2 s; 10 redirects (aliases); 5 rotas com erro de console/rede (`characters` 500 real; 3 rotas 404 em endpoints de agente a confirmar; `editor` 429 artefato de carga); axe crítico/sério em 19 de 70 rotas (51 limpas): labels/select-name em settings de pilares, `button-name` em gamification, `color-contrast` em 7 rotas. **A11Y-001 medido em renderização real:** 444 de 445 títulos h1–h4 passam no tema claro (padrão `rgb(3,105,161)`, 5,52:1); falha apenas o H1 de `/app/characters` (ouro `#FFC107` sobre `#F4F7FB`, 1,52:1). Reexecução: `auth` 4/4, `accessibility` 34/34, `mobile-sweep` 1/1. NÃO EXECUTADO: testes visuais com snapshots, papéis não-ADMIN, interações além do carregamento, Meilisearch; screenshots só no scratchpad (não versionadas). Parecer do 24 sobre este relatório: PENDENTE.
