# Checkpoint — Operação Birthub Experience 360
Atualizado: 2026-11-19 · Agente 00 · Branch `claude/sleepy-hamilton-umhot9` · PR #420 (rascunho)
Estado: FASE ZERO CONCLUÍDA EM MODO LEITURA/DOCUMENTAÇÃO — pendências abaixo.

## Onde retomar (próximo ciclo)
1. Agente 24: parecer APROVADO só para 73dcc992 (`.agents/reviews/fase-zero-birthub-experience-360-pr420-73dcc992-24.md`); nova revisão da revisão final solicitada. #419 mergeado; branch atualizada com `main`.
2. #419 já em `main`; aguardar #415; então iniciar Onda 1 (A11Y-001 em `src/styles`/`ui` via 03C/03E/11; CSS-001; axe das rotas prioritárias). Arquivos dos PRs #403/#404/#412/#415/#419 não devem ser tocados antes.
3. Agente 14 executa `.agents/handoffs/onda-1/00-para-14-env-test-playwright-local.md` → só então inventário visual real (hoje 0% em execução).
4. Gate Humano: matriz de candidatos externos em `birthub-experience-360-fase-zero-relatorio.md` §10 (recomendação: instalar nenhum).

## Decisões humanas vigentes
DS-001 ratificado (DL v2.0 neon; gradiente de título só nos casos do DL §2) · CLAUDE.md atualizado (b57673bd) · skills `birthhub-*` espelhadas em `.claude/skills/` · A11Y-001 agendado como prioridade da Onda 1 · não tocar snapshots/`src/styles`/`src/components/ui` até #415 e #419 · Landing e Login intocáveis (03A/03G).

## Baseline e gates
Base HEAD 03546a77 (+ commits docs do PR #420). Stack: React 19/Vite 6/RR7 SPA, Tailwind 4 CSS-first, Biome, Vitest 4, Playwright 1.63. `npm ci` OK. `typecheck` OK; `lint` 0 erros/1561 warnings pré-existentes; `test:architecture` EXIT 0; `test:unit` TESTADO verde (921 arquivos/7366 testes passed, 1 skipped; execução paralela via vitest, não o script exato). Agente 14 provisionou harness local: auth 4/4 e accessibility 34/34 (axe) passed; visual, mobile-sweep e inventário `/app/*`: NÃO EXECUTADO.

## Cobertura de rotas
Públicas: 13 + protegidas `/social-selling`, `/setup`, `/design-lab/*` (3). `/app/*`: 73 `path=` em `AppLayout.tsx` (+ index, wildcard e 2 redirects) — lista completa no relatório §3. Execução visual: 0%.

## Ownership
Matriz em relatório §4. Agentes `.claude/agents/birthhub-*` ↔ 03A–03G (1:1), sem propriedade própria de arquivo. Landing/Login fora de escopo.

## Achados abertos
DS-001 (resolvido por decisão), A11Y-001 (P1, agendado), DS-002 (identidade-visual desatualizada, 11), CSS-001 (!important, 03C), GOV-003 (harness, 14), QA-001 (npm audit, 15+08), QA-002 (escopo do job visual, 08). GOV-001 corrigido: skills birthhub-* existem em `.agents/skills` (agora também em `.claude/skills`); falta `birthhub-impeccable`.

## Handoffs/artefatos
`.agents/handoffs/onda-1/00-para-14-env-test-playwright-local.md` (aberto) · `.agents/runs/birthub-experience-360-fase-zero-relatorio.md` · `...-proposta-claude-md.md` (aplicada).
