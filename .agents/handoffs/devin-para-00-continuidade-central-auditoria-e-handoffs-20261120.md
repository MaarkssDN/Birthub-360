# HANDOFF — devin → 00

- **Origem:** sessão Devin Desktop (continuidade da thread "release-readiness-audit" + evolução da Central)
- **Responsável:** Devin (sessão interativa)
- **Data:** 2026-11-20
- **Status:** Parcial

## 1. Missão

Duas frentes encadeadas:

1. **Auditoria forense release-readiness do Birthub-360** (Marco 1 concluído — veredito NO-GO, revisado pelo Agente 24).
2. **Construção e evolução da Central de Auditoria e Handoffs** — app React+Express em `C:\Github\Central-de-Auditoria-e-Handoffs` que vive FORA do repo auditado, com handoffs .md versionados, dispatch multiagente e (em andamento por outra sessão) Fases 1–3 do plano de evolução.

Escopo desta sessão: criar a central externa, o dashboard, o design system, commitar/mergear/pushar, e iniciar a Fase 1 do plano de evolução.

## 2. O que foi feito

### Central externa (Desktop → migrada para o repo da central)
- `C:\Users\Marcelo\Desktop\Central-Auditoria-BirthHub\` criada com `ondas/release-readiness-2026-11-18/` (auditoria/ + handoffs/ + revisoes/), `decisoes/PENDENTES.md` (D-01..D-07), `estado/`, `agents/`, `COORDENADOR.md`, `TEMPLATE-HANDOFF.md`.
- Artefatos da auditoria recuperados de `stash@{0}` do Birthub-360 (o working tree havia mudado para `agente/00-correcao-p0-auditoria @ d8317c9d1` com ~505 arquivos alterados — outra sessão ativa).
- Dashboard React standalone em `Desktop\Central-Auditoria-BirthHub\app` (Vite, porta 5199) — **superseded** pelo app principal abaixo.

### App Central-de-Auditoria-e-Handoffs (repo próprio, GitHub MaarkssDN)
- **Bug de causa raiz corrigido:** `.gitignore` tinha `data/` que ignorava `src/data/` — o clone nunca teve `agentsRoster.ts`/`seedWorkspace.ts`/`agentDirectives.ts` (app não compilava). Recriei os 3 arquivos (26 agentes, personas, matriz §6.3, 14 bloqueadores B-01..B-14, 2 diretivas/agente, seed workspace). Exceção `!src/data/` adicionada ao .gitignore.
- **Backend `/api/central`**: `server/centralStore.ts` (scan/parse de handoffs .md, update de Status+Resolução, buildDispatchPrompt, queueDispatch, detectAgents) + `server/centralApi.ts` (rotas state/doc/handoffs-status/dispatch/agents/prompt). CENTRAL_DIR configurável via env, default `./central`.
- **`central/`**: 47 arquivos copiados do Desktop — 19 handoffs, dossiês, decisões, registry de agentes.
- **UI**: nova aba "Central de Auditoria" (`CentralAuditView.tsx`) — 6 visões (Geral, Handoffs, Decisões, Ondas, Dossiês, Agentes), filtros, despacho por agente/worktree, transições de status.
- **Design system "Blueprint de Guerra"** aplicado no app inteiro: `src/index.css` (tokens ink/paper/signal, blueprint-grid, panel/chip/btn/input/led, remap slate→escuro p/ views legadas), Sidebar/TopBar/App reescritos, headers eyebrow+display em todas as views, `DESIGN.md` criado. Fontes: Space Grotesk + Inter + JetBrains Mono.
- **Plano de evolução HTML** salvo no Desktop: `PLANO-EVOLUCAO-CENTRAL-AUDITORIA.html` (Fases 0–4, prompts, API, riscos, decisões).

### Git
- Branch `feat/central-auditoria-real` → **PR #1 mergeado em main** (`a599fc5`), 70 arquivos +8.331 linhas.
- Detectado que **outra sessão evoluiu o repo**: PRs #2–#4 mergeados (`eea55a8` sala de comando, `90fbc3a` file browser, etc.).

## 3. O que falta fazer

### Na Central-de-Auditoria-e-Handoffs (CRÍTICO — trabalho não commitado em risco)
- **18 itens não commitados** na working tree (ver seção 6): 4 handoffs atualizados p/ EM_EXECUÇÃO, 4 prompts de review-24 em `estado/fila/`, 4 locks em `estado/locks/`, `worktrees.json` modificado, `CHECKLIST-HANDOFFS-RELEASE-READINESS.html` novo.
- **Verificação de testes interrompida**: `npx tsc --noEmit` limpo; `tsx --test` rodou centralReport (3/3), centralStore (4/4), coordinator (3/3) e foi **interrompido em persistence.test.ts** — restam taskQueue, waveOnboarding, phase1/*, adapters, executions, locks, stateMachine.
- Fase 1 do plano: locks/stateMachine/executions/adapters/worktree **já existem** em `server/phase1/` + módulos (`coordinator.ts`, `providers.ts`, `taskQueue.ts`, `persistence.ts`, `db.ts`, `auth.ts`, `fsApi.ts`, `centralGithub.ts`, `centralMetrics.ts`, `centralNotify.ts`, `centralReport.ts`, `centralEvents.ts`). Implementados por outra sessão — **não revisei a fundo**.

### Estado da execução real (central/estado)
- 19 handoffs: **4 AGUARDANDO_24** (09-mobile, 10-infra, 01-schema, 16-workers — despachados e executados em worktrees `C:\Github\Birthub-360-wt\ag-*`), **4 EM_EXECUÇÃO** (01A-retencao, 02-ux-crm, 04-crm-integridade, 05-prospeccao — prompts devin em fila, aguardando execução real), **10 PENDENTE**, **1? CONCLUÍDO** (verificar).
- Reviews 24 enfileiradas (prompts em `estado/fila/2026-11-19T21-02-08-24-review-*.md`) mas **não executadas**.
- Worktrees reais criados: `ag-09`, `ag-10` (+ possivelmente outros) em `C:\Github\Birthub-360-wt\`.

### No Birthub-360
- Repo estava em `agente/00-correcao-p0-auditoria @ d8317c9d1` com ~505 arquivos alterados e stash com artefatos da auditoria — **estado pode ter mudado desde então; verificar antes de qualquer mutação**.
- Marco 2 da auditoria continua BLOQUEADO: decisões D-01..D-07 pendentes (envs EC2, escopo mobile/voz/IA, retenção, consentimento IA, módulos gated, estado git) + Etapa 0 (reconciliar PRs #381–#393 etc. × inventário).

## 4. Arquivos e referências

- Repo central: `C:\Github\Central-de-Auditoria-e-Handoffs` (origin: github.com/MaarkssDN/Central-de-Auditoria-e-Handoffs, main @ `6c3a529`)
- Central de dados: `central/` dentro do repo (handoffs em `central/ondas/release-readiness-2026-11-18/handoffs/`)
- Código novo relevante: `server/centralStore.ts`, `server/centralApi.ts`, `server/phase1/{locks,stateMachine,executions,adapters,worktree}.ts`, `server/coordinator.ts`, `server/providers.ts`, `src/components/CentralAuditView.tsx`, `src/data/{agentsRoster,agentDirectives,seedWorkspace}.ts`, `DESIGN.md`
- Plano: `C:\Users\Marcelo\Desktop\PLANO-EVOLUCAO-CENTRAL-AUDITORIA.html`
- Desktop legacy: `C:\Users\Marcelo\Desktop\Central-Auditoria-BirthHub\` (cópia de trabalho, app/ Vite na porta 5199)
- Auditoria original: `.agents/runs/audit-2026-11-18/` no Birthub-360 (ou stash@{0} / cópia em `central/ondas/.../auditoria/`)
- Worktrees de execução: `C:\Github\Birthub-360-wt\ag-*`

## 5. Decisões importantes

- Central vive **fora do repo auditado**, dentro do próprio repo Central-de-Auditoria-e-Handoffs (versionada em git — handoffs são fonte de verdade).
- Providers: devin=subagente/API, claude-code/codex-cli=CLI headless, antigravity/copilot=manual, generico=manual. Claude/Codex CLI **não instalados** na máquina.
- Design: mundo "Blueprint de Guerra" commitado (DESIGN.md); telas legadas herdam via remap CSS.
- Status canônico da central: PENDENTE → EM_EXECUÇÃO → AGUARDANDO_24 → CONCLUÍDO/REPROVADO_24/BLOQUEADO (diferente do modelo aberto/em-andamento/resolvido do workspace.json legado).
- Devin API key **não configurada** — adapter devin hoje gera prompt p/ execução manual/subagente.

## 6. Bloqueios e riscos

- **TRABALHO NÃO COMMITADO EM RISCO** na Central-de-Auditoria-e-Handoffs: 18 arquivos (locks, fila, handoffs modificados, worktrees.json, checklist html). Se a sessão morrer, perde-se o registro das últimas 4 execuções despachadas + 4 reviews enfileiradas. **Commitar primeiro.**
- Testes da outra sessão não totalmente verificados por mim (interrompidos em persistence.test.ts).
- Birthub-360: estado do repo desconhecido desde a última verificação (branch suja, stash, possível sessão paralela). Worktrees `ag-*` podem ter commits não mergeados.
- 4 handoffs EM_EXECUÇÃO dependem de execução real (provider devin = prompt na fila; precisa de sessão Devin ou CLI).
- Decisões humanas D-01..D-07 seguem pendentes e bloqueiam Marco 2.

## 7. Próximos passos (para o Coordenador distribuir)

1. **Commitar os 18 artefatos pendentes** na Central (locks/fila/handoffs/worktrees/checklist) — preservar estado.
2. Terminar a verificação: rodar suite completa de testes (`tsx --test server/*.test.ts server/phase1/*.test.ts`) + `tsc --noEmit` + `npm run build`.
3. Revisar código da outra sessão (Fase 1–3) antes de confiar: `server/phase1/*`, `coordinator.ts`, `providers.ts`, `taskQueue.ts`, `persistence.ts`.
4. Executar os 4 reviews 24 enfileirados (AGUARDANDO_24) e os 4 handoffs EM_EXECUÇÃO — via provider devin (subagente/sessão) ou CLI se instalado.
5. Depois: continuar lote do coordenador (`POST /api/central/coordinator/run` dryRun) para os 10 PENDENTE.
6. Paralelo: decisões humanas D-01..D-07 + Etapa 0 (reconciliar PRs × inventário) antes de qualquer mutação no Birthub-360.

## 8. Orientação ao Agente 00

- Eu não sou dono de código do Birthub-360 nesta thread — trabalhei no repo Central-de-Auditoria-e-Handoffs e na pasta Desktop. Trate este handoff como relatório de estado, não como missão de código do produto.
- O sistema de handoffs da Central (`central/ondas/.../handoffs/*.md`) é a fonte de verdade operacional — **não** confundir com `.agents/handoffs/` do repo (este arquivo).
- O coordenador da Central já rodou lotes em 2026-11-19 (ver `central/estado/coordinator-runs/` e `executions/*.jsonl`): 4 execuções concluídas→AGUARDANDO_24, 4 despachadas→EM_EXECUÇÃO, 4 reviews enfileiradas.
- Antes de despachar mais: verificar locks ativos em `central/estado/locks/` (expiração ~1h) e worktrees `ag-*` no disco.
- Servidor dev: `cd C:\Github\Central-de-Auditoria-e-Handoffs && npm run dev` → http://localhost:3000.
