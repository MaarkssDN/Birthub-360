# Handoff — `RUN_ID` literal (não interpolado) em `tests/integration/voicehub-persistence.test.ts`

```
De: 12 — Voz e Telefonia
Para: 08 — QA e Release
Onda: saneamento-handoffs-20261117
Status: resolvido
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: a definir
```

## Problema

`tests/integration/voicehub-persistence.test.ts` L5-6:

```ts
const RUN_ID = "${Date.now()}-${Math.random().toString(36).slice(2, 8)}";
const ORG_A = "test-voicehub-org-a-${RUN_ID}";
```

As aspas duplas fazem de `${...}` um literal — `RUN_ID`/`ORG_A` são strings
constantes idênticas em toda execução (o arquivo irmão
`voice-transcript-encryption.test.ts` L17-18 usa template literal correta com
backticks). Consequência: o `beforeAll` (`organization.createMany`) colide por
unique constraint se uma execução anterior não chegou ao `afterAll` (crash/timeout),
e duas execuções concorrentes no mesmo banco de teste disputam a mesma org.

## Arquivo(s) envolvido(s)

- `tests/integration/voicehub-persistence.test.ts` (dono: Agente 08 — `tests/AGENTS.md`)

## Evidência

Leitura direta do arquivo em `main@414a0ca5f` (2026-11-17). Não executado — sem
Docker/`.env.test` no worktree do Agente 12.

## Alteração necessária

Trocar as aspas duplas por template literals (backticks) nas linhas 5-6, mesmo
padrão de `voice-transcript-encryption.test.ts`.

## Teste esperado

`npm run test:integration` verde; duas execuções seguidas sem resíduo de org.

## Contexto adicional

Encontrado durante a revisão para o handoff
`onda-3/00-para-12-voicehub-teste-integracao-rls.md` (spec novo
`tests/integration/voice-hub-rls.test.ts` usa `randomUUID()` para unicidade).
Fora da propriedade do Agente 12 — registrado via handoff conforme AGENTS.md §16.

## Resolução (Agente 08, 2026-11-18)

- **Correção:** `tests/integration/voicehub-persistence.test.ts` L5-6 corrigido para template literals com backticks:
  ```ts
  const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ORG_A = `test-voicehub-org-a-${RUN_ID}`;
  ```
- **Teste de Regressão:** Criado `tests/unit/lib/voice-hub/voicehub-persistence-runid.test.ts` cobrindo:
  1. Verificação AST/estática contra reintrodução de strings literais un-interpolated `"${Date.now()}"` ou `"${RUN_ID}"`.
  2. Validação de geração de identificadores dinâmicos únicos sem colisão.
- **Evidência:**
  - `npx vitest run tests/unit/lib/voice-hub/voicehub-persistence-runid.test.ts` → 2/2 testes aprovados (17ms).
- **Status:** resolvido.
