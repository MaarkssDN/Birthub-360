# Relatório de Execução — Agente 37 · Suri

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 3 — Experiência
**Branch:** `agente/37-suri-onboarding-v2` (base: `agente/36-leo-landing-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. `OnboardingChecklist` v1 já persiste em localStorage por tenant+user — v2 reutiliza `buildOnboardingStorageKey` para compatibilidade total de dados.
2. Marcar checklist é preferência de UI, não confirmação de integração — regra do AGENTS de onboarding respeitada e documentada no componente.
3. `SetupWizard.tsx` (222 linhas, fluxo ADMIN) não foi reescrito — os primitivos v2 (`WizardStepsV2`, `OnboardingChecklistV2`) são as peças para a próxima iteração do wizard.

## Plano executado

- **Etapa 1 — Auditoria:** Checklist v1 (68 linhas) e SetupWizard mapeados.
- **Etapa 2 — Componentes v2:**
  - `OnboardingChecklistV2` — card premium, contador mono, `role="progressbar"` real, checks custom com `peer-focus-visible` (checkbox sr-only mantém anel de foco visível), strike-through em etapas concluídas, mesma persistência do v1.
  - `WizardStepsV2` — indicador de etapas `<ol>` semântico com `aria-current="step"`, gold para concluído/ativo, conectores.
- **Etapa 3 — Adoção:** drop-in por props idênticas; flag `design.newOnboarding` reservada para seções de onboarding inteiras.
- **Etapa 4 — Acessibilidade:** progressbar com aria-valuenow/min/max, labels reais, focus-visible no controle custom, sr-only com estado de cada etapa.
- **Etapa 5 — TTV:** progresso percentual visível acelera time-to-value percebido; steps sugerem próximas ações (labels vêm do consumidor).

## Arquivos alterados

- `src/components/onboarding/v2/{OnboardingChecklistV2,WizardStepsV2,index}.tsx/ts` (novos)
- `.agents/runs/37-suri-onboarding-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo.
- `npx biome lint src/components/onboarding/` → limpo.

## Testes

- Typecheck/lint verdes.

## Evidências

- Checkbox `sr-only` + `peer-focus-visible:ring-2 ring-gold-500` — foco visível WCAG 2.4.7 preservado com visual custom.
- `role="progressbar"` com valores ARIA completos — leitor de tela anuncia % de ativação.

## Problemas fora do escopo

- Reescrita visual do `SetupWizard` (fluxo ADMIN) e do `OnboardingTour` — iteração futura usando `WizardStepsV2`.

## Handoffs abertos

- Para quem consome `OnboardingChecklist`: trocar import para `components/onboarding/v2` quando a flag `design.newOnboarding` estiver ativa.
- Para Agente 34: incluir checklist/wizard v2 na rodada axe-core.

## Aprendizados reutilizáveis

- `peer-focus-visible` resolve foco visível em controles custom baseados em input sr-only — padrão reutilizável.

## Pendências

- Adoção nas telas de onboarding reais (SetupWizard, tour).
- Testes unitários dos componentes v2.

## Riscos

- Baixo: código novo isolado; storage key compartilhado garante mesma fonte de verdade.
