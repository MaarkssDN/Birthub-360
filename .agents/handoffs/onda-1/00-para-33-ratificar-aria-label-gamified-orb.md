De: 00 (Astra)
Para: 33 (Célia) — Design System e Componentes Base
Onda: 1
Status: aberto
Prioridade: normal
Bloqueador-ref: —
Sprint destino: Onda 1

## Problema
O PR #463 alterou `src/components/ui/Gamified3DOrb.tsx` (propriedade do Agente 33, AGENTS.md §15 / `.agents/MATRIZ_PROPRIEDADE.md:51`) sem handoff prévio. Os handoffs da Onda 1 citavam "dono 03", numeração do roster antigo (03A–03G = agentes `birthhub-*`, sem propriedade de arquivo); no roster atual o 03 é Nina (testes unitários).

## Arquivo(s) envolvido(s)
- `src/components/ui/Gamified3DOrb.tsx` — `aria-label` no botão: "Interagir com o cristal de energia 3D" (interativo) / "Cristal de energia 3D" (não interativo). Corrige violação axe `button-name` em `/app/gamification`.
- `src/styles/official-identity.css` — regras de piso de contraste (sem dono na matriz; lacuna de governança).

## Evidência
Parecer do Agente 09 para #463 (`.agents/reviews/09-pr463-contraste-orb-20261120.md`): APROVADO com ressalva de propriedade (DECISÃO HUMANA). Contraste não revalidado por axe: NÃO EXECUTADO.

## Alteração necessária
1. Ratificar (ou ajustar) o `aria-label` aplicado.
2. Indicar o dono de `src/styles/**` e `official-identity.css` para a matriz.

## Teste esperado
axe em `/app/gamification` sem `button-name`; teste de componente do orb com nome acessível nos dois estados.

## Contexto adicional
Autorizado pelo Orquestrador Humano em 2026-11-20. Nenhum merge de #463 antes da ratificação, salvo decisão humana em contrário.

## Resolução (Agente 33)
Data: 2026-11-20 · Revisão: origin/agente/03-onda1-contraste (feb08a746) vs origin/main · Status: resolvido (ratificação); pendências abaixo.

**Decisão: RATIFICADO COM AJUSTES** (nenhum ajuste bloqueia; dois são recomendações para o dono do PR #463 / Agente 03).

### (a) aria-label em `Gamified3DOrb.tsx`
- O `<button>` recebe `disabled={!interactive}`; não interativo = botão desabilitado. O nome acessível existe nos dois estados e é coerente: "Interagir com o cristal de energia 3D" (ação) / "Cristal de energia 3D" (rótulo). Corrige `button-name` (o botão só contém `<canvas>`). IMPLEMENTADO / lido no diff.
- `title` (só interativo) tem texto diferente do aria-label; vira descrição acessível, não duplicação de nome. Aceitável.
- Ajuste opcional (OPCIONAL, não bloqueia): no estado não interativo o orb é decorativo/informativo e um botão disabled é semântica pobre; ideal futuro é `role="img"` + `aria-label` sem `<button>`. Fora do escopo do PR.

### (b) Cobertura de teste
- `tests/unit/components/ui/Gamified3DOrb.test.tsx` e `GamificationWidget.test.tsx` existem, mas NENHUM asserta o nome acessível do orb (usam `getByRole('button')` sem `name`).
- Teste mínimo recomendado (a incluir no PR #463 pelo Agente 03/Nina; não editei):
  `render(<Gamified3DOrb interactive />)` → `getByRole('button', { name: 'Interagir com o cristal de energia 3D' })`; `render(<Gamified3DOrb interactive={false} />)` → `getByRole('button', { name: 'Cristal de energia 3D' })` e `toBeDisabled()`.
- E2E/axe `button-name` em `/app/gamification`: NÃO EXECUTADO (sem navegador/servidor neste worktree).

### (c) Dono de `src/styles/**` / `official-identity.css`
- `.agents/MATRIZ_PROPRIEDADE.md` só lista `33 → src/components/ui/**, tailwind.config.js` (linha 51); nada para `src/styles/**` (lacuna confirmada). O handoff `.agents/handoffs/onda-ui-1/00-para-03-design-system-onda-b.md` já atribui `src/components/ui/**, src/styles/**` ao design system.
- **Recomendação: dono = Agente 33 (Célia)** para `src/styles/**` (tokens, `globals.css`, `official-identity.css`), pois tokens/contraste são parte do design system; Agente 34 (Ari) revisor obrigatório de mudanças de contraste/a11y. Proposta de linha para a matriz (edição é do 00): `33 | src/components/ui/**, src/styles/**`. Retroativamente, as regras do #463 ficam ratificadas pela 33 (ver abaixo).

### (d) Conferência com `.claude/CLAUDE.md` / `DESIGN.md`
- `.bg-brand.text-white { color: var(--on-brand) }` implementa literalmente a regra "branco sobre superfície sólida de marca é proibido; bg-brand com text-on-brand". OK.
- `html:not(.dark) .bg-warning-active { color: var(--on-brand) }` idem. OK.
- Remaps `text-emerald-500/amber-500/indigo-400/slate-500`, teal e critical apontam para tokens existentes (`--color-ok-solid`, `--color-warning-solid` em globals.css:868/884, `--iris`, `--ink-2`, `--critical`); seguem o padrão dos remaps anteriores. Ressalva (DECISÃO de dívida): são patches CSS globais por classe crua; o próprio comentário reconhece migração definitiva para `text-ok-active/text-warn-active/text-ink-2` (handoffs 03→04/12/13). Aceitos como piso transitório, sem novos remaps.
- Razões de contraste (4.5:1) das novas regras: NÃO EXECUTADO (sem axe/medição); o PR deve anexar medição antes de merge.

### Evidências (comando → resultado)
- `git diff origin/main...origin/agente/03-onda1-contraste -- Gamified3DOrb.tsx official-identity.css` → +1 linha TSX, +34 linhas CSS, sem outras alterações nesses arquivos.
- `npx vitest run tests/unit/components/ui/Gamified3DOrb.test.tsx tests/unit/components/ui/GamificationWidget.test.tsx` (worktree /tmp, branch do #463) → 2 arquivos, 8 testes passados (não cobrem o nome acessível).
- `npx biome format src/components/ui/Gamified3DOrb.tsx src/styles/official-identity.css` → "Checked 2 files, No fixes applied".
- axe `/app/gamification`, `tsc`, `lint`, `test:e2e`: NÃO EXECUTADO.

### Pendências
1. Agente 03 (Nina): adicionar o teste mínimo acima ao PR #463.
2. Agente 00: decidir/registrar dono de `src/styles/**` na matriz (recomendado 33, com 34 revisor).
3. axe e medição de contraste antes do merge (Agente 05/34).
4. Parecer de 09 (Silas) sobre a revisão exata permanece necessário; esta ratificação não substitui §40.
