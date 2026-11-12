# Handoff — Bugs do Quality Gate de código novo (Sonar)

De: 15 — Segurança Aplicada
Para: 02 — Produto e UX (layout/nav e superfície do Copiloto); 03 — Design e Acessibilidade (landing, em cópia)
Onda: Quality Gate da main `94f95097` (período de código novo desde 2026-10-27T21:30:30Z, `previous_version`)
Status: aberto
Prioridade: alto (bloqueia `new_reliability_rating` — nota C, limiar A)

## Problema

O Quality Gate do SonarCloud (`MarksNN_Birthub-360`, branch `main`) está em ERROR:
`new_reliability_rating=3` (C) com **5 bugs MAJOR** no período de código novo
(`api/issues/search?createdAfter=2026-10-27T21:30:30+0000&types=BUG`). Nenhum
está em `src/features/settings` (o commit `75dee1ab` não é a origem destes
bugs). Correção mínima abaixo; o 15 não alterou esses arquivos (domínio de
outro dono).

## Bugs

1. **typescript:S3923** (MAJOR) — `src/features/copiloto-ia/components/CopilotoIaPanel.tsx:66`
   - Mensagem: *This conditional operation returns the same value whether the condition is "true" or "false".*
   - Código: `` className={`flex gap-1 border-b border-line ${embedded ? '' : ''}`} ``
   - Commit: `d95624cc` (2026-11-10 23:11 America/Sao_Paulo) `feat(copiloto): painel do assistente integrado ao dock de assistentes`, autor `marcelinhomarkss-rgb`.
   - Dono: módulo Copiloto IA (`src/features/copiloto-ia/AGENTS.md` não fixa um número do roster; a superfície/nav foi trabalho do Agente 02).
   - Correção sugerida: remover o ternário inútil, deixando `className="flex gap-1 border-b border-line"`.

2. **typescript:S9383** (MAJOR) — `src/components/layout/ModuleRail.tsx:77`
   - Mensagem: *Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.*
   - Código: `navigate('/app');` dentro de `goHome`.
   - Commit: `f0af157b` (2026-11-10 23:11 America/Sao_Paulo) `feat(nav): navegacao modular — rail de modulos + painel contextual`, autor `marcelinhomarkss-rgb`.
   - Dono: Agente 02 — Produto e UX (`src/components/layout/AGENTS.md`).
   - Correção sugerida: `void navigate('/app');` (react-router devolve Promise).

3. **typescript:S9383** (MAJOR) — `src/components/layout/ModuleRail.tsx:88`
   - Mesma regra/mensagem/commit/dono do item 2.
   - Código: `if (module.home) navigate(module.home);`
   - Correção sugerida: `if (module.home) void navigate(module.home);`

4. **typescript:S3923** (MAJOR) — `src/features/landing/components/pillars/viewers/OrquestracaoViewer.tsx:61`
   - Mensagem: mesmo valor nos dois ramos do condicional.
   - Código: `` className={`text-[10px] block font-sans ${isDark ? 'text-slate-500' : 'text-slate-500'}`} ``
   - Commit: `e647887a` (2026-11-10 10:08 America/Sao_Paulo) `feat(core): saneamento integral de handoffs, modularizacao de pilares e enxame de agentes`, autor `marcelinhomarkss-rgb`.
   - Dono: Agente 02 — Produto e UX / Agente 03 — Design e Acessibilidade (landing; mesmo recorte da exceção de `PillarRegistry.tsx`).
   - Correção sugerida: `className="text-[10px] block font-sans text-slate-500"`.

5. **typescript:S9383** (MAJOR) — `src/features/landing/components/PillarDetailModal.tsx:44`
   - Mensagem: Promise de `navigate` sem `void`/`.catch`.
   - Código: `navigate(pillar.route);`
   - Commit: `afc6571d` (2026-11-07 14:27 America/Sao_Paulo) `feat(landing): reconstrucao dos 8 modais comerciais...`, autor `marcelinhomarkss-rgb`.
   - Dono: Agente 02 / Agente 03 (landing).
   - Correção sugerida: `void navigate(pillar.route);` (já existe teste em `tests/unit/features/landing/PillarDetailModal.test.tsx`).

## Teste esperado

- Os 5 issues deixam de aparecer em `types=BUG` no período de código novo.
- `npx tsc --noEmit`, `npm run lint:ci` e os testes de ModuleRail / Copiloto / landing já existentes continuam verdes.
- Não relaxar Quality Gate nem exclusões do Sonar.

## Resolução

(preenchido pelo destinatário ao resolver)
