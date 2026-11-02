# Parecer 24 — PR #152 (Agente WF1) — head `5a495b29e8b61c7a4b051b687ae689554563e0bc`

- Missão: destravar o release gate da main (formatação e lint do Biome).
- Autor: WF1. Auditor: Agente 24. Base: main `2d62f9fa`. Revisão em 2026-11-02 ~05:10 (UTC-3).
- **Veredito: BLOQUEADO** (vinculado exclusivamente ao SHA `5a495b29`).

## Escopo (`git diff origin/main...5a495b29`): 7 arquivos, +507/−1495
Commits: `83b30f6c` (formatação), `5a440a7d` (imports não usados), `5a495b29` (merge de origin/main, sem rebase/force-push).
- Os arquivos `AIPendingActionsInbox.tsx`, `aiPendingAction.service.ts` e `semanticCache.ts` são **byte a byte iguais a `biome format` (2.5.14) aplicado à versão da main**, ou seja, só formatação.
- `agentCapabilities.normalized.json`: `json.loads(main) == json.loads(PR)` → **True** (só formatação).
- `sidebarSections.ts:1`: remove `Shield` (não referenciado no arquivo). `React` continua importado como `import type` (usado na linha 20).
- `ErrorBoundary.tsx:1`: remove o import default `React`, que não é usado no arquivo. `tsconfig.json:14` usa `"jsx": "react-jsx"` (runtime automático), e o Type Check do CI passou.
- `dataSubjectErasure.unit.test.ts:16`: remove `optOutRecordCreateMock`, que é **declarado e nunca usado** (zero referências). Nenhuma asserção LGPD foi perdida, e o teste passa localmente junto com o do semanticCache (2 arquivos, 15/15).
- Propriedade: sem schema/migrations, workflows, `.github/**` ou `App.tsx`. OK.
- Conflito com #154 (`e3693ebc`): `git merge-tree` entre os dois heads está **limpo**. A linha 89 do #154 fica fora dos hunks formatados (linhas 45 e 96–105).

## Verificação local (clone `/workspace/rv154`)
- `biome format src`: 2225 arquivos, sem alterações (exit 0).
- `biome lint src`: exit 0, 642 warnings e 4 infos, sem erros.
- `vite build`: ok. `check:bundle-budget`: ok (1.917.905 / 3.145.728 B gzip). O bundle do servidor com esbuild também ficou ok.
- O integration suite não rodou localmente: ele precisa de Postgres/migrations, que não há neste ambiente.

## CI no head `5a495b29`
- Release, run **41407514396**: **failure**. Lint, Prettier check, working tree, Type Check, Architecture e OpenAPI drift passaram. **Run Unit Tests falhou** com Test Files 1 failed | 696 passed (697) e Tests **1 failed | 5531 passed | 1 skipped (5533)**. A única falha é `tests/unit/features/intelligence/commercial-v3/commercialV3.routes.test.ts:79` (`expected 400 to be 200`). AI Resilience, Migrations, **Integration, Build e E2E ficaram skipped**.
- SonarQube, run 41407514492: failure no mesmo teste (mesma contagem, 1 failed | 5531 passed).
- Visual Regression (41407514382), Bundle Budget (41407514431), CodeQL (41407514408), Trivy (41407514395) e Dependency Review (41407514418): success.

### Falha herdada × nova
A falha é **herdada**. Na main `2d62f9fa`, sem o #152, o mesmo teste falha localmente com `expected 400 to be 200` em `commercialV3.routes.test.ts:79:30`. Na CI da main (run 41406269451), a etapa Unit nem chegou a rodar, porque o job parou no Prettier. O #152 não toca em `tests/unit/features/intelligence` nem em `src/features/intelligence/commercial-v3`. É exatamente o teste que o #154 corrige. **Nenhuma falha nova foi introduzida pelo #152.**

## Decisão pelo AGENTS.md
- §40: "Somente APROVADO permite avançar. Ausência de auditor, evidência insuficiente, **teste obrigatório não executado** ou ambiente indisponível **não equivalem a aprovação**. [...] falhas pré-existentes devem ser identificadas e **não podem ser anunciadas como gate verde**."
- §30: "Nunca declarar um teste como aprovado se ele não foi executado."
- §28 (gate de integração) exige `test:unit`, `test:integration`, `test:e2e` e `build`.

Unit está vermelho, mesmo que por falha herdada, e Integration e E2E não foram executados neste SHA. O AGENTS.md não prevê exceção que aprove com falha herdada ou com etapas não executadas. O mérito do diff não tem P1, P2 ou P3, mas o veredito é **BLOQUEADO**.

## O que desbloqueia (qualquer uma das opções, sem rebase)
1. **Mergear o #154 primeiro** (ele precisa de APROVADO próprio no SHA atual) e depois fazer merge da main no branch do #152. Um novo Release precisa rodar Unit, Integration, Build e E2E verdes no novo SHA.
2. **Ou** incorporar no #152 a mudança de teste do #154 (`commercialV3.routes.test.ts`, +6/−1), com novo Release verde de ponta a ponta.

Depois disso, emito novo parecer para o novo SHA. Qualquer commit novo invalida este parecer.
