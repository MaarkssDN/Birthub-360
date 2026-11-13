# Parecer Agente 24 — Re-auditoria do delta pós-aprovação (PR #265)

- Missão/onda: W7 — gates finais + disposição de release (`plano-ondas-saneamento-birthhub360.html`)
- Auditor: Agente 24 (Revisão Independente)
- Branch: `integracao/coordenador-20261112` → PR #265 → `main`
- Revisão exata: HEAD `703eb5802` (delta `dd818d6cd..HEAD`, 5 commits)
- Data: 2026-11-13
- Parecer anterior: `24-revisao-pos-homologacao-w7-20261113.md` (APROVADO sobre `dd818d6cd`)

## 1. Motivo da re-auditoria

Após o APROVADO, o CI do PR #265 expôs 3 falhas que exigiram alterações
materiais na revisão auditada:

1. **Ciclo de dependência arquitetural** (`test:architecture`):
   `offlineSync.service.ts → encryptedOfflineStorage.service.ts → offlineSync.service.ts`.
2. **CodeQL `js/incomplete-sanitization`** em `scripts/lgpd/ropa-inventory.ts`
   (escape de `|` sem escape prévio de `\`).
3. **`Landing360.test.tsx`**: 5/16 falhas — a suíte de `main` esperava o
   contrato antigo (`/api/public/demo-requests`, `consentimentoLgpd`,
   `origem`, `varianteAb`) e a nav mobile, ausentes na versão integrada.
4. **Baseline Prisma tx-escape** ficou stale após remoção do dialer legado
   (`PrismaCrm360Repository` sem `$transaction`).
5. **Segunda rodada de CI** (run `43445741461`): `Run Unit Tests` reprovou 3
   testes de `commercial-intelligence` — causa raiz: `healthScore`/`executiveExport`
   omitiam `now` nos relatórios-base, que então liam o cache L2 Redis (só ativo no
   CI, `REDIS_URL` configurada) gravado por cenários de teste anteriores. Corrigido
   em `703eb5802` propagando o `now` original — mesmo contrato de
   `forecastCalibration`/`hiringScenario`.

## 2. Delta auditado (`dd818d6cd..f95f861b5`, 13 arquivos, +163/−629)

| Commit | Conteúdo | Avaliação |
|---|---|---|
| `4d064cd58` | Extrai `StorageAdapter`/`LocalStorageAdapter` p/ `services/offlineStorageAdapter.ts`; `offlineSync` e `encryptedOfflineStorage` importam do módulo neutro | Correto — ciclo quebrado na origem, comportamento preservado (localStorage + fallback em memória), sem mudança de API pública |
| `003afb1b9` | `ropa-inventory.ts`: escapa `\` antes de `\|` na renderização Markdown; inventário regenerado | Correto — sanitização completa, artefato `INVENTARIO_CAMPOS_PII.md` consistente (diff de 1 linha) |
| `a56b95944` | `Landing360.tsx`: porta do `origin/main` o toggle `.b360-mobile-nav-toggle`, `#b360-mobile-nav` e `isValidWhatsapp` (10–13 dígitos); testes alinhados ao contrato real `POST /api/public/lead-capture` (`consent`, honeypot `website`, copy "Solicitação Recebida!") | Correto — restaura comportamento de `main` sem regredir o endpoint real; validação client-side espelha a regra do servidor |
| `f95f861b5` | Remove 2 suítes de teste do dialer legado (`/api/dialer-3cx` removido — Cadence é o dialer canônico); limpa baseline tx-escape stale; ajusta contagens em `rls-coverage` (145→147: `PublicLeadConsent` + `MultichannelCadenceEnrollment`) e `tenant-scoping-parity` (`PublicLeadConsent` em `KNOWN_RLS_ONLY_MODELS` com justificativa RLS) | Correto — remoções proporcionais ao código já eliminado; justificativas documentadas inline |
| `703eb5802` | `CommercialIntelligenceUseCases`: `healthScore`/`executiveExport` passam a propagar o `now` original aos relatórios-base (antes omitido → com Redis L2 ativo, `now` explícito de testes/backtests lia cache de outros cenários; 3 falhas no application gate) | Correto — mesmo contrato já usado por `forecastCalibration`/`hiringScenario`; produção (`now` undefined) segue reutilizando cache L2; caminho determinístico fica determinístico de ponta a ponta |

## 3. Gates executados nesta worktree (evidência real)

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx biome check` (arquivos do delta) | PASS — 0 erros (warnings pré-existentes apenas) |
| `npm run test:architecture` (dependency-cruiser) | PASS — 0 violações, 1943 módulos / 6397 deps |
| `npm run check:hotspots` | PASS — 0 arquivos >1000 linhas sem exceção válida |
| `tests/unit/architecture/prisma-tx-escape-baseline.test.ts` | PASS (14/14) |
| `tests/unit/db/rls-coverage.test.ts` + `tenant-scoping-parity.test.ts` | PASS (22/22 combinados) |
| `tests/unit/features/landing/Landing360.test.tsx` | PASS — **16/16** (antes 11/16) |
| `src/features/commercial-intelligence/**` (24 arquivos) | PASS — **271/271** após fix `703eb5802` |

## 4. Propriedade e escopo

- Nenhum arquivo de `.agents/prompts/**`, `server.ts`, `package.json` ou lockfile tocado.
- `Landing360.tsx` pertence ao domínio landing/produto — alteração é porte
  cirúrgico de `origin/main` + validação, sem reescrita adjacente.
- Testes removidos referem-se exclusivamente a código já removido (dialer 3CX).
- Sem segredos, sem novo endpoint, sem mudança de contrato OpenAPI no delta.

## 5. Ressalvas

- O delta **não** altera a aprovação anterior sobre segurança/LGPD/tenancy do
  escopo W3–W6; as correções são de higiene de CI e paridade de testes.
- `Landing360.test.tsx` permanece sensível a copy (regexes por texto) — risco
  baixo, já mitigado por assertions de contrato (URL/payload) em paralelo.
- Merge do PR #265 segue condicionado ao CI verde do workflow
  "Central Birth Hub 360 Release" no HEAD `f95f861b5`.

## 6. Veredito

**APROVADO** — o delta `dd818d6cd..f95f861b5` é cirúrgico, corrige falhas reais
de CI sem regressão funcional, e todos os gates locais reexecutados passam.
A disposição de release permanece condicionada ao resultado do CI do PR #265.

---

## Adendo — delta `703eb5802..f1bdc70f4` (cobertura de branches)

**Escopo:** 1 commit (`f1bdc70f4`), somente arquivos de teste — zero mudança em
código de produção.

**Motivo:** o application gate do CI reprovou o threshold de branches de
`src/features/automations/**` (71.17% < 73% configurado em
`vitest.unit.config.ts`). Análise do `coverage-final.json` do run `43451602605`
mostrou 224 branches descobertos de 777 no glob; os arquivos a 0%
(`infra/N8nWebhookDispatcher.ts`, `infra/PrismaAutomationRepository.ts`) são
pré-existentes e não tocados pelo PR — o déficit é de baseline, não regressão
deste delta.

**Correção aplicada (testes apenas):**
- `automation-dry-run.service.test.ts` (+12 casos): webhook sem `method`
  (default POST), custom field sem `field`/entidade não-Lead/valor não-string,
  atividade sem owner (fallback "Não atribuído"), enrich/cadência/SDR em
  eventos de Activity com e sem `leadId`, cadência com defaults e `leadId`
  explícito, SDR com número suprimido (opt-out), notify sem título/corpo.
- `cadenceIntegration.service.test.ts` (+4 casos): `stepIndex` default,
  `pause`/`resume` sem enrollment, ação inválida → erro explícito.
- `automations-ui.test.tsx` (+5 casos): `describeAutomation` com operador
  numérico, operador desconhecido e valor array; `automationsApi.dryRun` com e
  sem `limit` (ambos os lados do ternário).

**Gates reexecutados:**

| Gate | Resultado |
|---|---|
| vitest (3 arquivos alterados) | PASS — **54/54** |
| `npx tsc --noEmit` | PASS |
| `npx biome check --write` (escopo) | PASS — 1 arquivo reordenado (imports) |

**Veredito do adendo:** **APROVADO** — delta test-only, aumenta cobertura real
de branches sem enfraquecer assertions nem alterar thresholds. A aprovação
permanece condicionada ao CI verde do PR #265 no HEAD `f1bdc70f4`.
