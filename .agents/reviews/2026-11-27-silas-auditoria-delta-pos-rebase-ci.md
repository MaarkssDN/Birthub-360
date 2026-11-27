# Parecer Silas — Auditoria do Delta pós-rebase e estabilização de CI

- **Data:** 2026-11-27
- **Auditor:** Agente 09 — Silas (auditor independente, runtime distinto do autor)
- **SHA auditado (HEAD):** `2954b7605627985c904a2a083a44390d75675993`
- **Branch/worktree:** `agente/00-recuperacao-onda-consolidacao-20261124` em `D:\Github\Birthub-360-wt-recuperacao`
- **Base do delta:** SHA aprovado anteriormente `a2574dddc1` (parecer em `.agents/reviews/2026-11-26-silas-auditoria-recuperacao-onda-consolidacao.md`), rebaseado sobre `origin/main` `9dbb4445c9`
- **Veredito:** **APROVADO**

## Escopo revisado

Delta desde o parecer anterior, em 3 blocos:

1. Rebase dos 10 commits da onda sobre `origin/main` `9dbb4445c9` (a main avançou ~36 commits);
2. Três commits novos de estabilização: `766049933b` (biome format), `89611255c0` (alinhamento de testes de integração), `2954b76056` (flags design v2 opt-in + `NODE_ENV=production` no build do CI).

Nota de escopo: a missão citava 11 SHAs rebaseados incluindo `9dbb4445c9`, mas esse SHA é o merge-commit de sincronização com `origin/main` (nova base do rebase), não um commit rebaseado. O range-diff real é `9a3c2182b2..9d23775982` → `9dbb4445c9..e40f7941ac` = **10 commits**.

## Evidências por item

### 1. Preservação do rebase — CONFIRMADO

`git range-diff 9a3c2182b2..9d23775982 9dbb4445c9..e40f7941ac` retornou `=` (idêntico) para os 10 pares:

| Pré-rebase | Pós-rebase | Subject |
|---|---|---|
| `5ff321f111` | `aefac1700e` | fix(tests): neutralizar REDIS_URL nos workers do Vitest |
| `665c645f20` | `d2708cf3de` | refactor(landing): modularizar Landing360… |
| `32a6ed49db` | `3c3f3ec49f` | refactor(crm): extrair secoes do LeadDetailDrawer… |
| `c0c28258ef` | `67adbe4355` | refactor(prospecting): modularizar rotas de leads e prospect |
| `498efbb413` | `0a5747d2f4` | refactor(bitrix): modularizar extraction.ts… |
| `3d380ef64c` | `2683f7a0ba` | refactor(voice-hub): extrair design-system… |
| `e6073ddfc2` | `ee7db126fb` | refactor(intelligence): extrair report.routes… |
| `a2574dddc1` | `9633b85895` | chore(arch): remover exceções de hotspot… |
| `d3a1962121` | `55d416e260` | chore(governance): parecer Silas (APROVADO)… |
| `9d23775982` | `e40f7941ac` | docs(review): completar parecer Silas… |

`=` em range-diff significa patch-id estável idêntico — nenhum conteúdo foi perdido, reordenado ou alterado semanticamente pelo rebase. Os SHAs antigos permanecem alcançáveis via reflog (`HEAD@{2026-11-26/27}`), confirmando a proveniência. O SHA aprovado `a2574dddc1` corresponde exatamente a `9633b85895` no novo histórico.

### 2. Commit `766049933b` — formatação exclusiva — CONFIRMADO

O commit toca 36 arquivos (a mensagem diz 35; o stat real é 36 — divergência cosmética na mensagem). Verificação forte executada: para cada um dos 36 arquivos, o conteúdo do parent (`766049933b^`) foi re-formatado com o próprio `biome format` do repositório (`@biomejs/biome` 2.6.8, `--stdin-file-path`) e comparado byte a byte com o conteúdo commitado — **todos idênticos** (após normalizar CRLF→LF do stdout). Amostragem manual dos diffs (`src/App.tsx`, `src/config/feature-flags.ts`, `src/lib/motion-v2.ts`, `src/components/ui/v2/Button.tsx`, `cookie-security.ts`, teste `stageTransitions`, `prospect.routes.ts`) mostra apenas troca de aspas, re-quebra de linha e trailing commas. Gate `npx biome format src` executado nesta auditoria: **2691 arquivos, 0 fixes pendentes** (warning informativo de schema 2.5.11 vs CLI 2.6.8, pré-existente).

### 3. Commit `89611255c0` — alinhamento de testes ao contrato vigente — CONFIRMADO

**(a) `prospecting-rls.test.ts` — remoção do DELETE em AuditLog: correta.**
- A migration `prisma/migrations/20261114160000_auditlog_append_only_immutability/migration.sql` instala `auditlog_no_mutation` (BEFORE UPDATE OR DELETE FOR EACH ROW) e `auditlog_no_truncate` — bloqueia mutação para qualquer role, inclusive owner. O DELETE anterior falharia de qualquer forma; removê-lo é a correção certa.
- `AuditLog.tenantId` é `String` simples, sem relação/FK para `Organization` (`prisma/schema.prisma` L880-895) — as linhas residuais não impedem `organization.deleteMany` e ficam confinadas aos tenants sintéticos ORG_A/ORG_B do arquivo. Cleanup residual seguro.

**(b) Testes POS3-42 — asserts não enfraquecidos; mudança reflete contrato real de produção.**
- Guarda vigente confirmada em `src/features/crm360/infra/PrismaCrm360Repository.ts` L429-441 (introduzida pelo commit `6069e6ae31`, presente no histórico): `updateLeadStage` compara `stage.pipeline.entity` com o `LeadFunnel` do registro e lança `AppError(..., 400)` com a mensagem "Transição de estágio inválida" quando divergem.
- `crm-stage-transitions.test.ts`: o teste cross-entity foi **invertido** — antes assertava o comportamento bugado (Negócio movido para etapa Lead virava `funnel=Lead`, "sumindo" dos boards); agora espera `rejects.toThrow(/Transição de estágio inválida/)` e verifica que nada foi persistido (`funnel` permanece `Negocio`, `pipelineStageId`/`status` inalterados). Isso é alinhamento ao contrato novo, não afrouxamento — o assert ficou mais estrito.
- `dealClosureGate.test.ts`: `seedLead` ganhou parâmetro `funnel` opcional; os 3 testes do módulo CRM360 passam `'Negocio'` porque movem para etapas do pipeline Negócio (`ganho`, `nova-oportunidade`) — coerente com a guarda, já que o default do schema é `funnel=Lead`.
- `rbac-e2e-crm-operations.test.ts`: helper generalizado para `firstStageId(entity)`; o teste "move de verdade (200)" agora usa etapa do pipeline **Lead** (o `LeadFactory` cria `funnel=Lead` por default — `Lead.funnel @default(Lead)`, schema L622) e mantém asserts fortes (`status 200`, `pipelineStageId` gravado). O teste do VISUALIZADOR continua usando `firstDealStageId` apenas pelo efeito colateral documentado (`attachLegacyRecords`) e espera 403 do `requireRole` antes de qualquer validação de estágio — correto.

### 4. Commit `2954b76056` — flags v2 opt-in + NODE_ENV do build — CONFIRMADO

**(a) `src/config/feature-flags.ts`:** `isDesignV2Enabled` agora é `localStorage.getItem(flag) === 'true'` em todos os ambientes; o atalho `import.meta.env.DEV → true` foi removido. Callers auditados:
- `src/App.tsx` L76/129/133 — `landingV2` governa `/` e `/welcome` (Landing360 vs Landing360V2);
- `src/components/layout/MainLayout.tsx` L41 — `navigationV2`;
- `src/lib/motion-v2.ts` L37 — `useMotionV2`.
Resultado: **v1 em todo ambiente por default; v2 somente com opt-in explícito** via localStorage. Isso corrige a causa-raiz documentada (Vite 6 deriva `DEV` de `NODE_ENV==='production'`; builds de teste compilavam `DEV=true`). Rotas `/design-lab/*` (`App.tsx` L106-122) são montadas incondicionalmente e não dependem das flags — o design-lab continua acessível. Nenhum fluxo legítimo quebrado; o toggle `toggleDesignV2Flag` volta a funcionar em dev (antes o atalho ignorava o valor gravado).
- Ressalva menor: `localStorage` é acessado sem guarda `typeof window` — seguro no SPA client-side e em jsdom; se algum dia houver SSR/Node importando o módulo, lançaria ReferenceError. Comportamento pré-existente para o caminho de produção, não regressão.

**(b) `.github/workflows/ci.yml`:** o env `NODE_ENV: production` foi adicionado **apenas** ao step "Run Build" (L349-353). Verificado que não contamina etapas posteriores:
- Smoke test do build: env próprio `NODE_ENV: test` (L360);
- E2E: `playwright.config.ts` L94 seta `NODE_ENV: process.env.NODE_ENV ?? 'test'` no webServer (`tests/e2e/e2e-server.ts`), e o job E2E separado (L511+) tem `NODE_ENV: test` no nível do job;
- `verify:pwa-precache` roda dentro de `npm run build` herdando `NODE_ENV=production`, mas o script (`scripts/pwa/verify-precache.ts`) não referencia `NODE_ENV` — sem dependência;
- O job visual-baselines (L566+) não roda `npm run build`, usa o webServer do Playwright.
O bundle E2E agora é o artefato real de produção (React prod, `PROD=true`), coerente com o objetivo do commit.

### 5. Worktree limpa — CONFIRMADO

`git status --porcelain` não retorna nenhuma linha: zero alterações não commitadas, zero untracked relevantes.

## Gates executados nesta auditoria

- `git range-diff` pré/pós-rebase: 10/10 idênticos;
- Re-formatação dos 36 arquivos do commit de format com biome 2.6.8 do repo: byte-idênticos ao commitado;
- `npx biome format src`: 2691 arquivos, 0 pendências;
- `npx tsc --noEmit`: exit 0, sem erros;
- Inspeção estática dos diffs e do código de produção/contratos citados.

Testes de integração/E2E não foram re-executados nesta auditoria de delta (exigem Postgres/RLS/Redis efêmeros); a validação foi por inspeção de contrato — a guarda POS3-42 e o trigger append-only foram confirmados no código e na migration vigentes. Recomenda-se que o gate de integração do CI cubra esses 4 arquivos na próxima execução.

## Ressalvas

1. Mensagem do commit `766049933b` diz "35 arquivos"; o diff real toca 36 — cosmético, sem impacto.
2. `isDesignV2Enabled` acessa `localStorage` sem guarda de ambiente — seguro hoje (SPA client-only, testes em jsdom); registrar se surgir SSR.
3. Linhas residuais de `AuditLog` de testes acumularão por tenant de teste (sem FK, sem delete possível por design append-only) — volume desprezível; se um dia o banco de teste precisar de reset total, tratar via `TRUNCATE` com role privilegiado ou recreate do schema de teste.

## Veredito final

**APROVADO** — o rebase preservou integralmente o conteúdo aprovado, os três commits de estabilização são cirúrgicos e fiéis aos contratos de produção vigentes, e a worktree está limpa no SHA `2954b76056`.
