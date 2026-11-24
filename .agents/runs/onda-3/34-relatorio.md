# Relatório — Agente 34 · Ari (Acessibilidade WCAG 2.2 AA) — Onda 3

- MISSÃO: ONDA3-34-ACCESSIBILITY (demanda DEM-20261123-001)
- AGENTE: 34 — Ari
- BRANCH: `agente/34-accessibility-onda3`
- WORKTREE: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-34-accessibility`
- SHA INICIAL: `32d07c3750c370b63da8b720019413c9a40e0e68`
- SHA ATUAL: `ec193df7423ba283b88f320c2a704c6d341c7103` (+ commit deste relatório)
- STATUS: concluído (escopo do ownership) — adoção do SkipLink depende de handoff
- DATA: 2026-11-24

## RESULTADO

### Ownership e decisão de escopo

`.agents/MATRIZ_PROPRIEDADE.md` atribui ao Agente 34 exclusivamente
`src/components/a11y/**`. O diretório **não existia no baseline** — foi
constatado conteúdo não-rastreado (`SkipLink.tsx`, `index.ts`,
`__tests__/SkipLink.test.tsx`) criado em execução anterior desta mesma missão
(commit `ec193df74`, 12:51). Avaliação do conteúdo:

- `SkipLink` implementa WCAG 2.4.1 Bypass Blocks (nível A, obrigatório em AA):
  link oculto até o foco (`sr-only` → `not-sr-only`), `scrollIntoView()` +
  `focus({preventScroll:true})` no alvo, fallback de `tabindex="-1"`, hash no
  histórico. Tokens e padrão de anel de foco idênticos aos de `ui/Button.tsx`.
- **Gap real confirmado**: `grep -rni "skip|pular para|bypass" src` → zero
  ocorrências; `<main>` em `MainLayout.tsx:68` não tem `id` nem `tabIndex`.
  Ou seja, o app não possui nenhum mecanismo de bypass de blocos — o componente
  é necessário, não especulativo.
- Decisão: manter e commitar o componente (já commitado em `ec193df74`),
  validado com 6/6 testes verdes. **Nenhum outro componente novo criado** —
  P2 (simplicidade): sem consumidor comprovado, `VisuallyHidden`/`LiveRegion`
  seriam abstrações especulativas; o projeto já usa `sr-only`/`aria-live` inline.

### Inventário de débito de acessibilidade

Ferramenta: `npx biome lint src` (config `biome.json`, regras `lint/a11y/*` em
`warn`). Total no repositório: **58 diagnósticos a11y**, distribuídos:

| Dono provável | Path | Ocorrências | Regras principais |
|---|---|---|---|
| 36 (landing) | `features/landing/pages/Landing360*.tsx`, `components/B360DataStreamCursor.tsx` | 27 | useButtonType ×14, noLabelWithoutControl ×8, useValidAnchor ×6, useSemanticElements ×3, useAriaPropsSupportedByRole ×2, noAriaHiddenOnFocusable ×1 |
| 60/65 (voice-hub) | `features/voice-hub/**` | 18 | useSemanticElements ×13, useMediaCaption ×3, useAriaPropsSupportedByRole ×1 |
| 40/42 (crm) | `features/crm/components/KanbanBoard.tsx` | 3 | role="button" sem ativação, tabindex em região |
| 38 (charts) | `components/charts/RevenueChart.tsx` | 2 | useSemanticElements (role="listitem" em div) |
| Sem dono na matriz | `features/home`, `features/dashboard`, `features/copilot`, `features/mobile`, `contexts/__tests__` | 8 | div onClick sem teclado, labels órfãs, media caption, useButtonType |

Observação: `docs/audits/experience-360/07-ACCESSIBILITY-AUDIT.md` citado na
missão **não existe neste baseline** — o inventário acima (biome lint + grep)
é a evidência primária. O spec E2E `tests/e2e/accessibility.spec.ts` (axe-core,
critical/serious) já cobre login/dashboard/pipeline/settings.

### Correções commitadas

- `src/components/a11y/SkipLink.tsx` + `index.ts` + `__tests__/SkipLink.test.tsx`
  (commit `ec193df74`, herdado de execução anterior desta missão — revisado e
  validado nesta sessão: testes 6/6, tokens conferidos contra
  `src/styles/globals.css`, convenções idênticas a `ui/Button.tsx`).

### Handoffs gerados (`.agents/handoffs/onda-3/`)

1. `34-para-30-skiplink-adocao-layout.md` (já existia, commit `ec193df74`) —
   adoção do SkipLink + `id="main-content"`/`tabIndex={-1}` no `<main>` de
   `MainLayout.tsx`. Prioridade alta; WCAG 2.4.1 nível A. Conflito de propriedade
   layout (31 vs AGENTS local "02") escalado ao coordenador 30.
2. `34-para-36-landing-a11y-debt.md` — 27 ocorrências em landing (dono: 36).
3. `34-para-60-voicehub-a11y-debt.md` — 18 ocorrências em voice-hub; paths sem
   dono nominal na matriz → coordenador 60 designa executor (65 para `ui/**`).
4. `34-para-40-crm-kanbanboard-a11y.md` — `crm/components/KanbanBoard.tsx` é
   stub com `role="button"` sem ativação; provável código morto (versão real em
   `crm/pipelines/`).
5. `34-para-38-charts-a11y.md` — `RevenueChart.tsx` roles de lista não semânticos.
6. `34-para-30-a11y-paths-sem-owner.md` — 8 achados em paths ausentes da matriz
   (home, dashboard, copilot, mobile, teste de contexto) para roteamento.

## ARQUIVOS ALTERADOS

- `src/components/a11y/SkipLink.tsx` (novo, commit ec193df74)
- `src/components/a11y/index.ts` (novo, commit ec193df74)
- `src/components/a11y/__tests__/SkipLink.test.tsx` (novo, commit ec193df74)
- `.agents/handoffs/onda-3/34-para-30-skiplink-adocao-layout.md` (commit ec193df74)
- `.agents/handoffs/onda-3/34-para-36-landing-a11y-debt.md` (novo)
- `.agents/handoffs/onda-3/34-para-60-voicehub-a11y-debt.md` (novo)
- `.agents/handoffs/onda-3/34-para-40-crm-kanbanboard-a11y.md` (novo)
- `.agents/handoffs/onda-3/34-para-38-charts-a11y.md` (novo)
- `.agents/handoffs/onda-3/34-para-30-a11y-paths-sem-owner.md` (novo)
- `.agents/runs/onda-3/34-relatorio.md` (este arquivo)

Nenhum arquivo de produto (`src/features/**`, `src/components/ui/**`,
`src/components/layout/**`) foi alterado — todos são somente leitura para o 34.

## TESTES EXECUTADOS

- `npx vitest run -c vitest.unit.config.ts src/components/a11y/__tests__/SkipLink.test.tsx`
  → **6/6 aprovados** (22.8s).
- `npx tsc --noEmit -p tsconfig.json` → **exit 0** (sem erros; nenhum erro em
  `src/components/a11y`).
- `npx biome lint src/components/a11y` → **limpo** (3 arquivos, 0 diagnósticos).
- `npx biome lint src --max-diagnostics=3000` → exit 0; 1517 warnings totais
  (pré-existentes), dos quais 58 `lint/a11y/*` inventariados acima.

## TESTES APROVADOS

6/6 unitários do SkipLink; typecheck global; lint do diretório de ownership.

## TESTES FALHOS

Nenhum.

## EVIDÊNCIAS

- Inventário a11y completo: saída de `biome lint` com 58 diagnósticos
  `lint/a11y/*` (lista arquivo:linha:regra em `.agents/handoffs/onda-3/` e
  reproduzível via `npx biome lint src | grep "lint/a11y/"`).
- Gap WCAG 2.4.1: ausência total de skip link e de `id`/`tabIndex` no `<main>`
  (`src/components/layout/MainLayout.tsx:68`).
- Skills lidas: `.agents/skills/accessibility/SKILL.md`,
  `birthhub-accessibility`, `wcag-keyboard-navigation`.

## DEPENDÊNCIAS

- Adoção do SkipLink no shell depende do handoff `34-para-30-…` (executor:
  dono de `src/components/layout/**` — 31 ou 02, a designar pelo 30).
- `tests/e2e/accessibility.spec.ts` não foi executado nesta sessão (E2E pesado;
  nenhuma tela foi alterada — SkipLink ainda não está montado em nenhuma
  superfície, logo o spec não é afetado).

## BLOQUEIOS

Nenhum bloqueio no escopo do 34. Pendências são de outros domínios via handoffs.

## SOLICITAÇÃO AO AGENTE 00

1. Designar executor para adoção do SkipLink (handoff 34→30 aberto, prioridade
   alta — WCAG 2.4.1 nível A sem mecanismo atual no app).
2. Roteamento dos handoffs 34→36, 34→60, 34→40, 34→38 e 34→30 (paths sem dono
   nominal na matriz: `features/home`, `features/dashboard`, `features/copilot`,
   `features/mobile`, `features/crm/components`, `contexts/__tests__`).
3. Alinhar `.agents/MATRIZ_PROPRIEDADE.md` vs AGENTS.md locais divergentes:
   `voice-hub/**` (local diz "Agente 12" legado; matriz diz 60-69/65),
   `landing/**` (matriz 36 vs local "Agente 02"), `layout/**` (matriz 31 vs
   local "Agente 02").
4. Auditor independente (Agente 09/Silas) para parecer do SHA final da branch.
