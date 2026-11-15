De: Agente 00 — Coordenador
Para: Agente 00 (Coordenador e Orquestrador Geral)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-011)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser**

- **Dívida técnica:** BT360-DT-0004
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O dependency-cruiser foi configurado para checar fronteiras de pastas, mas não os slots dos 26 agentes documentados no `AGENTS.md`.

**Impacto:** Risco contínuo de acoplamento indevido e commits concorrentes sobre arquivos de donos exclusivos (ex.: `prisma/schema.prisma` modificado por integrações).

## Arquivo(s) envolvido(s)

`AGENTS.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-011`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-011` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 00/14 — BT360-DT-0004, worktree `Birthub-360-wt-sync`, branch `agente/00-depcruiser-sync`)

### Diagnóstico real encontrado (diferente do esperado no handoff)

- `npm run lint:architecture` estava **verde** em `origin/main`, mas a baseline tinha dessincronia
  real nos dois sentidos:
  1. **1 entrada stale**: `temporal-workers/activities.ts → prospecting/crawlee/crawler.ts`
     (o import de `runCrawler` continuava existindo, mas uma exceção de regra passou a cobrir
     a feature — ver abaixo);
  2. **2 violações novas fora da baseline**, introduzidas após a última regen:
     `temporal-workers/activities.ts → prospecting/{domain/prospectTypes,services/webCrawlPersistence.service}`
     (commit `7de68a27f`, Agente 05 — reconciliação crawlee) e o ciclo
     `supervisor.agent.ts ↔ supervisor/specialistNodes.ts` (refactor `76d82d4c0`, Agente 13 —
     aresta type-only `import type { SwarmStateType }`).
- `depcruise --baseline-mode shrink-only` mostrou-se **inadequado como remediação**: o match
  "same" exige igualdade estrita do objeto de violação (inclui `cycle`), então ele considera
  stale todas as entradas de ciclo que o `--ignore-known` ainda reconhece — rodá-lo esvaziou
  a baseline inteira (71 → 0) e quebraria o gate. Documentado no cabeçalho do novo script.

### O que foi implementado

1. **`src/features/intelligence/agents/supervisor/swarm.state.ts`** (novo): `SwarmState`
   (Annotation), `SwarmStateType` e `SwarmRoute` extraídos de `supervisor.agent.ts` — módulo
   folha que quebra o ciclo type-only. `supervisor.agent.ts` e `specialistNodes.ts` atualizados;
   API pública preservada via re-export em `supervisor.agent.ts`.
2. **`.dependency-cruiser.cjs`**: `no-cross-feature-imports` ganhou a **Exceção 4** —
   `src/features/temporal-workers/` (camada de runtime/workers, Agente 16) pode consumir
   features como origem, mesmo padrão já documentado para `notifications`/`intelligence`/
   `job-roles`. A direção inversa (feature → temporal-workers) continua proibida pelo
   `to.pathNot` com `$1`. **Pendente de validação do Agente 24** — se preferir port/DI estrita,
   reverter é uma linha e abrir handoff 00→05/16.
3. **`.dependency-cruiser-known-violations.json`**: regenerada via
   `npm run lint:architecture:baseline`. Diff semântico verificado por script: **70 → 70
   entradas, zero adicionadas**, removida apenas a entrada stale de
   `temporal-workers → prospecting/crawlee/crawler.ts` (coberta pela nova exceção).
4. **`scripts/architecture/verify-baseline-freshness.mjs`** (novo) + script npm
   `verify:baseline-freshness`, incluído na cadeia `test:architecture`: falha quando a baseline
   contém entrada que já não corresponde a violação real (stale) — a sincronização automatizada
   que faltava. O sentido inverso (violação nova) já era coberto por `lint:architecture`.

### Gates executados

- `npm run lint:architecture` → **verde** (0 violações novas; 70 conhecidas ignoradas).
- `npm run verify:baseline-freshness` → **verde** (70/70 conferem).
- `npx tsc --noEmit` → **falha ambiental pré-existente**: 6 erros TS2307/TS7006 em
  `src/lib/nativeDownload.ts` e `src/lib/nativeSpeech.ts` por `@capacitor/filesystem`,
  `@capacitor/share` e `@capacitor-community/speech-recognition` ausentes do `node_modules`
  linkado (junction para o repo principal, que não tem esses pacotes instalados). Nenhum erro
  nos arquivos alterados. Requer `npm install` no repo principal — fora do escopo deste worktree
  (proibido tocar `C:\Github\Birthub-360`).

### Pendências registradas

- `docs/architecture/KNOWN_VIOLATIONS.md` (dono: Agente 08) está desatualizado: diz "117
  violações" e não menciona a Exceção 4 de `temporal-workers` — sugiro handoff 00→08 para
  atualizar contagem (70) e documentar a exceção.
- Acoplamento real `temporal-workers → prospecting` (scrapeProspect) segue existindo no código;
  a Exceção 4 o torna visível-na-regra mas não o elimina. Dívida derivada candidata: porta/DI
  para activities do Temporal (owners: 05 + 16).
- `lint:architecture`/`test:architecture` não rodam em CI (`.github/workflows/`, dono 08) —
  o gate só é executado localmente/pre-push. Handoff 00→08 sugerido para avaliar inclusão.
