# Handoff — CTA "Acessar Célula Comercial" invisível no Hub de IA (tema light)

- De: 00 — Coordenador
- Para: 02 — Produto e UX
- Onda: vr-regressao-20261111
- Status: aberto
- Prioridade: alto
- Sprint destino: ciclo atual (não atualizar baseline light do Hub de IA até corrigir)

## Problema

No Hub de Inteligência (`/app/intelligence`), tema **light**, o botão
"Acessar Célula Comercial" do banner flagship renderiza como um
**retângulo sólido sem texto visível**. O mesmo CTA no tema **dark**
mostra o rótulo e o ícone normalmente.

Isso foi encontrado no diagnóstico só-leitura das 88 falhas pré-existentes
de regressão visual Playwright (11 telas × 2 temas × 4 viewports) contra
a `main`. Não é flakiness (0 flaky; retries de CI também falham; o mesmo
88/88 se repetiu nos PRs #220, #221 e #222). Também não é mismatch
darwin/win vs linux: as 88 baselines oficiais já são `*-linux.png`.

A diferença percebida pelo Playwright no tema light chega a **ratio
0,20–0,26** (até 255 320 pixels no desktop light), em grande parte
pelo redesenho do chrome (rail de módulos + `ModuleAgentWidget`) **e**
pela falha de contraste/rótulo do CTA no banner, que no baseline era um
botão azul com texto visível sobre um hero escuro.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/components/IntelligenceHub.tsx` (CTA por volta
  da linha 626; banner flagship com `bg-brand` + `text-on-brand` e
  `bg-gradient-to-r` sem stops `from-`/`to-`)
- Tokens de marca: `src/styles/globals.css`, `src/styles/official-identity.css`
  (`--brand` / `--on-brand` / `text-on-brand`)
- Recortes de evidência (anexos deste handoff):
  - `.agents/handoffs/evidencias-vr-20261111/hub-ia-light-desktop-expected.png`
  - `.agents/handoffs/evidencias-vr-20261111/hub-ia-light-desktop-actual.png`
  - `.agents/handoffs/evidencias-vr-20261111/hub-ia-light-desktop-diff.png`
  - `.agents/handoffs/evidencias-vr-20261111/hub-ia-dark-desktop-actual.png`
    (controle: no dark o rótulo "Acessar Célula Comercial →" está visível)

## Evidência

- Run de CI (ubuntu-latest, Node 22, Playwright 1.63.0, só Chromium),
  PR #222 (reencrypt, sem mudança de UI) sobre a main de então
  (`prBaseHash` `5d75ffa99`):
  https://github.com/marcelinhomarkss-rgb/Birthub-360/actions/runs/42980628002
  (11/11/2026, ~04:35–04:59 America/Sao_Paulo).
- Artefato baixado em `/workspace/vr-artifacts/run-42980628002`
  (report HTML + actual/expected/diff). Análise agregada em
  `/workspace/vr-artifacts/analysis.json`. Recortes em
  `/workspace/vr-artifacts/review-images/` e cópias versionadas neste
  diretório de evidências.
- Confirmação visual (desktop/laptop/tablet light): o botão aparece como
  bloco azul-escuro vazio. No dark, o mesmo botão é ciano com texto
  legível. Medidas Playwright (tema light): desktop 255 320 px (ratio
  0,20), laptop 227 754 (0,22), tablet 198 204 (0,26).
- Hipótese não vinculante (verificar): conflito de tokens `--brand` /
  `--on-brand` no tema light (ex. texto escuro sobre fundo `#0369a1`)
  ou estilo do `Button` cobrindo `text-on-brand`. O dark não reproduz
  o problema.

![Baseline (expected) — Hub de IA light desktop](evidencias-vr-20261111/hub-ia-light-desktop-expected.png)

![Actual CI — Hub de IA light desktop, CTA sem texto](evidencias-vr-20261111/hub-ia-light-desktop-actual.png)

![Diff Playwright — Hub de IA light desktop](evidencias-vr-20261111/hub-ia-light-desktop-diff.png)

![Controle — Hub de IA dark desktop, CTA visível](evidencias-vr-20261111/hub-ia-dark-desktop-actual.png)

## Alteração necessária

- Restaurar contraste e visibilidade do rótulo "Acessar Célula Comercial"
  (e do ícone) no tema light, no desktop e nos breakpoints menores,
  sem quebrar o dark (que hoje está correto).
- Validar o par `bg-brand` + `text-on-brand` no tema light (WCAG AA).
- **Não** atualizar as baselines light do Hub de IA (`intelligence-light-*-linux.png`)
  até o CTA estar visível. Também **não** mexer em Login, na landing
  nem nos CSS do PR #214.

## Teste esperado

- Tema light, viewports desktop/laptop/tablet (e conferir mobile): o CTA
  exibe "Acessar Célula Comercial" com contraste adequado.
- Tema dark: o CTA continua visível, sem regressão.
- Clique no CTA continua abrindo a Célula Comercial (`handleOpenTool('commercial_cell')`).
- Depois da correção, a suíte `npm run test:visual` pode receber update
  **somente** das baselines `intelligence-light-*` (não deste PR de docs).

## Contexto adicional

- A suíte visual está em `visual-regression/visual.spec.ts` /
  `playwright.visual.config.ts`. `maxDiffPixels` já é 1300; não aumentar
  threshold nem pular/desativar testes.
- As outras falhas das 88 (chrome global, Workspace, CRM, Dashboard, etc.)
  seguem em lotes separados de baseline; Login/landing ficam retidos
  por causa do #214.
- Este handoff é só documentação + evidência. Nenhuma linha de produto
  foi alterada aqui.

## Resolução

Resolvido pelo Agente 02 em 2026-11-14 (branch `agente/02-onda2-produto`,
worktree `Birthub-360-wt-o2-02`).

Causa raiz: em `src/features/intelligence/components/IntelligenceHub.tsx`
(~linha 351, único CTA `commercial_cell` da página) a classe
`bg-gradient-to-r` estava incompleta — sem `from-*`/`to-*` ela gera um
`background-image` de gradiente inválido que neutralizava o `bg-brand`
explícito; as classes manuais `bg-brand`/`hover:bg-brand-hover` ainda
por cima mascaravam a variante `default` do `Button`, que já provê um
gradiente real com paradas (`from-[#0369a1] to-[#075985]` no light,
`from-[#00b4d8] to-[#0284c7]` no dark) e `text-on-brand`.

Correção: removidas as classes quebradas/redundantes
(`bg-gradient-to-r bg-brand hover:bg-brand-hover`). O botão passa a usar
integralmente a variante `default` do `Button` (design system), mantendo
`size="lg"`, o rótulo "Acessar Célula Comercial", o ícone `ArrowRight` e
o `onClick={() => handleOpenTool('commercial_cell')}` — comportamento de
clique inalterado.

Contraste (WCAG AA): texto `text-on-brand` (#f8fafc no light) sobre o
gradiente #0369a1→#075985 — contraste ≥ ~4.5:1 mesmo no extremo mais
claro do gradiente; dark mantém o par cyan/`on-brand` da variante, sem
regressão (o dark já estava correto e continua usando o mesmo variant).

Gates executados:
- `npx tsc --noEmit`: limpo (foi preciso `npx prisma generate` antes — o
  worktree não tinha o Prisma Client gerado, o que produzia ~532 erros
  ambientais pré-existentes em `@prisma/client`, nenhum nos arquivos
  tocados).
- `npx biome check` nos arquivos tocados: 0 erros; 16 warnings
  pré-existentes não relacionados (a11y/exhaustive-deps em Landing360 e
  ProspectingHub, linhas não alteradas).
- `npx vitest run -c vitest.unit.config.ts` nos testes novos do pacote:
  10/10 passando.

Pendente honesto: a validação visual Playwright do CTA light
(`npm run test:visual`) não foi executada nesta sessão. **As baselines
`intelligence-light-*` NÃO foram atualizadas** — devem ser regeneradas
somente após um run visual confirmar o CTA visível, conforme o próprio
handoff determina. Recomenda-se ao Agente 08/QA rodar a suíte visual
antes do update de baseline.
