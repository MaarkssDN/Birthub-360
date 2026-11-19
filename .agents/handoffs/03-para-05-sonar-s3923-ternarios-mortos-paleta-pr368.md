# Handoff — Bugs Sonar S3923 (ternários mortos) criados pela migração de paleta — PR #368

De: 03 — Design e Acessibilidade
Para: 05 — Prospecção
Onda: PR #368 (`agente/00-paleta-oficial-migracao`, paleta oficial hex→var())
Status: aberto
Prioridade: alto (bloqueia `new_reliability_rating` do Quality Gate Sonar — nota C, limiar A)
Bloqueador-ref: Quality Gate SonarCloud PR 368 (análise de 2026-11-19)

## Problema

A migração hex→`var()` (commit `6ac3cf098`) substituiu **dois hex diferentes** por
**o mesmo token** nos dois ramos de ternários `isDark ? … : …`, gerando código
morto que o Sonar reprova como BUG (`typescript:S3923` — "conditional returns the
same value whether the condition is true or false"). O comportamento renderizado
é idêntico nos dois temas porque os tokens já reagem a tema
(`--pink`: `#db2777` claro / `#ff4fa3` escuro; `--orbit-blue`: `#1677ff` ambos),
então a correção é apenas colapsar o ternário — **zero mudança visual**.

Não editei os arquivos por pertencerem ao Agente 05 (AGENTS.md §16). A correção
sugerida abaixo é cirúrgica e pode ser aplicada pelo 05 ou pelo 00.

## Arquivo(s) envolvido(s) — 3 issues, todos `typescript:S3923` MAJOR

### 1. `src/features/prospecting/outbound/components/UserKanbanBoard.tsx:169`

Antes: `isDark ? 'text-[#FF2D9B]' : 'text-[#E6007A]'` → depois da migração:

```tsx
<h3 className={`font-bold ${isDark ? 'text-[var(--pink)]' : 'text-[var(--pink)]'}`}>
```

Correção sugerida:

```tsx
<h3 className="font-bold text-[var(--pink)]">
```

### 2. `src/features/prospecting/outbound/components/lead-card/LeadNewsDossierSection.tsx:29`

```tsx
className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--orbit-blue)]' : 'text-[var(--orbit-blue)]'}`}
```

Correção sugerida:

```tsx
className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-blue)]"
```

### 3. `src/features/prospecting/outbound/components/lead-card/LeadOutreachSection.tsx:416`

```tsx
className={`text-xs font-mono whitespace-pre-wrap leading-relaxed select-text ${
  isDark ? 'text-[var(--orbit-blue)]' : 'text-[var(--orbit-blue)]'
}`}
```

Correção sugerida:

```tsx
className="text-xs font-mono whitespace-pre-wrap leading-relaxed select-text text-[var(--orbit-blue)]"
```

## Evidência

- `api/issues/search?componentKeys=MarksNN_Birthub-360&pullRequest=368&types=BUG`
  retorna exatamente estes 3 issues (criação 2026-11-15, update 2026-11-19).
- `new_reliability_rating = 3 (C)`; aceitável ≤ 1 (A).
- Diff da migração: `git diff origin/main...HEAD -- <arquivo>` mostra os dois
  hex distintos colapsados no mesmo `var()`.

## Alteração necessária

Aplicar as 3 simplificações acima (ou equivalentes). Não alterar valores de cor.

## Teste esperado

- `npx tsc --noEmit`, `npm run lint:ci` verdes.
- Suíte unitária de prospecting (`tests/unit/features/prospecting/**`) verde.
- Próxima análise Sonar do PR 368 sem `typescript:S3923` em código novo.

## Contexto adicional

- Os tokens `--pink`/`--orbit-blue` já são theme-aware em `src/styles/globals.css`
  (`:root` vs `.dark`), então remover o `isDark` desses três pontos não muda o
  pixel renderizado em nenhum tema.
- Outros ternários `isDark ? 'var(--x)' : 'var(--x)'` podem existir no restante
  do diff do PR sem ter sido flagados ainda (Sonar só lista estes 3 no período
  de código novo) — vale uma varredura `rg "isDark \? 'text-\[var" src/features/prospecting`.
