- De: Agente 14 (Ambiente de Execução e Test Harness)
- Para: Agente 08 (QA e Release)
- Onda: 6
- Status: resolvido
- Prioridade: normal

## Problema
`tests/e2e/visual.spec.ts` está em `describe.skip` porque as únicas baselines commitadas em
`tests/e2e/visual.spec.ts-snapshots/` são `*-chromium-win32.png` (geradas no Windows). Playwright
inclui a plataforma no nome do arquivo de baseline, então o CI (`ubuntu-latest`) sempre procuraria
`*-chromium-linux.png`, que nunca existiu — todo teste falharia com "A snapshot doesn't exist", não
por regressão visual real.

Confirmei nesta onda que **não é seguro gerar essa baseline localmente**, mesmo tendo Docker/Postgres
de pé aqui: o Chromium provisionado neste ambiente de agente é `chromium-1194`
(`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), enquanto `npx playwright install
--with-deps chromium` — o que o CI de fato instala — resolveu `chromium_headless_shell-1228` quando
tentei rodar sem a variável `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Builds diferentes de Chromium rasterizam
fonte/anti-aliasing de forma sutilmente diferente, o que é exatamente a classe de falso
positivo/negativo que uma suíte de regressão visual pixel-a-pixel não pode tolerar. Por isso não
gerei/commitei PNG nenhum a partir deste ambiente.

## Arquivo(s) envolvido(s)
- `tests/e2e/visual.spec.ts` (comentário do skip atualizado nesta onda para explicar a causa correta)
- `tests/e2e/visual.spec.ts-snapshots/*-chromium-win32.png` (baseline existente, Windows)
- `.github/workflows/ci.yml` (fora do meu escopo — pertence ao 08)

## Alteração necessária
Adicionar um job (ou step dedicado, rodando uma vez) no `ci.yml`, no mesmo runner/imagem
`ubuntu-latest` que já roda `test:e2e`, que:
1. sobe a stack de serviços igual ao job de e2e normal (postgres/redis/meilisearch);
2. roda `npx playwright test tests/e2e/visual.spec.ts --update-snapshots` (com o `describe.skip`
   temporariamente removido, ou passando o teste explicitamente já que `--update-snapshots` ainda
   respeita `.skip`);
3. produz os PNGs `*-chromium-linux.png` em `tests/e2e/visual.spec.ts-snapshots/`;
4. alguém baixa esses artefatos do job e commita junto com a remoção do `describe.skip`.

Este passo é essencialmente manual/único (não precisa virar job permanente) — só precisa rodar
dentro do CI uma vez para estabelecer a baseline Linux real.

## Teste esperado
Depois de commitados os PNGs `*-chromium-linux.png` e removido o `describe.skip`:
`npm run test:e2e` (ou só `npx playwright test tests/e2e/visual.spec.ts`) roda os 5 testes de
`visual.spec.ts` no CI e fecha verde sem depender de retry.

## Contexto adicional
Baseline Windows preservada (não removi `*-chromium-win32.png`) — sem instrução do usuário para
descartar histórico de referência, e não custa nada mantê-la junto da baseline Linux nova.

## Resolução (Agente 08, remediação pós-Onda 6)

Implementado exatamente como pedido: `.github/workflows/ci.yml` ganhou `workflow_dispatch:` no
`on:` e um novo job `visual-baselines` (`if: github.event_name == 'workflow_dispatch'`, não roda
em push/PR), que:

1. sobe a mesma stack de serviços do job `build-and-test` (postgres/redis — o job `build-and-test`
   não sobe um container dedicado de Meilisearch apesar de `MEILI_HOST`/`MEILI_MASTER_KEY`
   estarem no `env`, então o job novo espelha esse comportamento real em vez do que o handoff
   descrevia; `visual.spec.ts` não depende de busca);
2. remove o `describe.skip` só no checkout efêmero do job (`sed` num arquivo do runner, nunca
   commitado) e roda `npm run test:e2e -- tests/e2e/visual.spec.ts --update-snapshots`;
3. publica os PNGs `*-chromium-linux.png` resultantes como artifact (`visual-snapshots-linux`).

**Não foi possível gerar os PNGs de verdade neste ambiente** — confirmando exatamente o
diagnóstico deste handoff (Chromium local incompatível com o que o CI instala) — então
`tests/e2e/visual.spec.ts` **continua em `describe.skip`** neste commit. Isso ainda depende de
ação humana real:

1. Abrir Actions → CI → "Run workflow" no GitHub (branch `agente/08-ci-deploy-audit` ou `main`
   depois do merge) para disparar o `workflow_dispatch`.
2. Baixar o artifact `visual-snapshots-linux` do job `visual-baselines`.
3. Extrair os PNGs em `tests/e2e/visual.spec.ts-snapshots/` (mantendo as `*-chromium-win32.png`
   já commitadas).
4. Remover o `describe.skip` real de `tests/e2e/visual.spec.ts` (linha ~30) e commitar junto com
   os PNGs novos.

Depois desse passo manual, `npm run test:e2e` no job `build-and-test` volta a cobrir
`visual.spec.ts` normalmente em todo push/PR — sem exigir mudança adicional no `ci.yml`.
`docs/deploy/RELEASE_CHECKLIST.md` (novo, seção 3) documenta a verificação manual a fazer
enquanto a baseline não existir.

## Resolução final (2026-08-21)

Passo manual executado: `gh workflow run ci.yml --ref main` disparou o `workflow_dispatch`
(run `32521483569`), job `visual-baselines` concluído com sucesso, artifact
`visual-snapshots-linux` baixado e os 5 PNGs `*-chromium-linux.png` extraídos para
`tests/e2e/visual.spec.ts-snapshots/` ao lado das `*-chromium-win32.png` existentes.
`describe.skip` removido de `tests/e2e/visual.spec.ts`. Commit `33dbb851`.

Nota à parte, fora do escopo deste handoff: o disparo do workflow também rodou o job
`secret-scan` (Gitleaks) do mesmo `ci.yml`, que reportou 47 leaks no histórico do repositório
(público). Os dois achados de credencial real (chave Gemini em `test-gemini.ts` e
`test-gemini-quota.ts`, commits de 2026-07-17) foram confirmados pelo usuário como já
inválidos/rotacionados. Os demais 4 achados (`phase-12-manifest.json`) são falso-positivo —
hashes SHA-256 de conteúdo de arquivo, não segredo. Nenhuma ação de remediação de histórico
(reescrita/força) foi tomada — não fazia parte do escopo autorizado nesta rodada.

## Resolução (Agente 08 — mecanismo permanente de regeneração, Onda 6/remediação)

Decisão do usuário: em vez do fluxo manual de baixar artifact e commitar à mão, criar um
mecanismo que gera `--update-snapshots` **dentro do runner Linux** e commita os PNGs
automaticamente.

Criado `.github/workflows/visual-baseline-update.yml` (`workflow_dispatch` apenas,
`permissions: contents: write` restrito a este arquivo — nenhum outro workflow ganhou
permissão de escrita). O job `update-visual-baselines` (ubuntu-latest, timeout 60min):

1. sobe a mesma stack de serviços do `visual-regression.yml`/`ci.yml` (postgres pgvector,
   redis, meilisearch) e replica env/bootstrap/`.env.test`/`prisma generate`/`migrate deploy`;
2. instala Chromium via `npx playwright install --with-deps chromium` (mesmo binário do CI
   de comparação — requisito crítico, ver diagnóstico original deste handoff);
3. remove `visual.spec.ts` do `testIgnore` do `playwright.config.ts` **somente no checkout
   efêmero do runner** (sed; a alteração nunca é commitada) e roda
   `npx dotenv-cli -e .env.test -- playwright test tests/e2e/visual.spec.ts --update-snapshots`,
   que grava `tests/e2e/visual.spec.ts-snapshots/*-chromium-linux.png` (path nativo do
   snapshotPathTemplate default — nenhuma cópia manual necessária);
4. roda também `npm run test:visual:update` (`playwright.visual.config.ts --update-snapshots`)
   para regenerar `visual-regression/baselines/**`, que é a suíte do check obrigatório
   "Visual Regression" (`visual-regression.yml` → `npm run test:visual`,
   `updateSnapshots: 'none'`) — sem esse passo o mecanismo não cobriria o check que motivou
   o handoff;
5. commita os PNGs alterados em `tests/e2e/visual.spec.ts-snapshots/` e
   `visual-regression/baselines/` na branch `ci/visual-baselines-linux` (criada a partir do
   ref disparado) e faz `git push origin HEAD:refs/heads/ci/visual-baselines-linux` como
   `github-actions[bot]`. Se nada mudou, não commita nem falha.

**Como operar:**

```bash
gh workflow run visual-baseline-update.yml --ref <branch-ou-main>
```

(o mesmo efeito pela UI: Actions → "Visual Baseline Update" → Run workflow.) Disparar no
ref que contém a mudança visual que originou a necessidade de baseline nova. O workflow
commita sobre o próprio ref disparado — baselines sempre refletem a UI daquele commit.

**Passo seguinte (humano, uma vez por geração):** abrir PR de `ci/visual-baselines-linux`
para `main`. Se a branch protection exigir checks que não rodaram nessa branch de bot,
usar `--admin` no merge **uma única vez** por baseline (decisão do usuário já registrada).

**Verificação:** YAML validado localmente (`yaml.parse` OK) e o `sed` do `testIgnore`
testado contra a linha real do `playwright.config.ts`. O workflow **não foi disparado**
pelo agente (sem `gh` auth de Actions neste ambiente) — fica pronto para disparo manual.

**Pendências/observações:**

- `tests/e2e/e2e-server.ts`/`E2E_BITRIX_MOCK` citados no briefing da missão **não existem**
  neste estado do repositório: `start:e2e` é `tsx server.ts` com `.env.test`, e
  `playwright.config.ts` usa `npm run start:e2e` no webServer (sem migrate inline — o
  workflow roda `prisma migrate deploy` como step próprio). Se a main avançar e mudar isso,
  revalidar o webServer do `playwright.config.ts` antes de confiar no workflow.
- `tests/e2e/visual.spec.ts` continua fora do `test:e2e` normal (testIgnore proposital —
  suíte visual roda só via configs dedicadas); este workflow não altera isso.
- Baselines `*-chromium-win32.png` são preservadas (o `--update-snapshots` no Linux não as
  toca; `git add` restrito aos dois diretórios de baseline).
