# RUN — Agente 48 (Jade) — SQUAD40-48-DEDUP

- Agente: 48 — Jade (Deduplicação e Higienização de CRM, Squad 40)
- Demanda: DEM-20261123-001
- Data: 2026-11-24
- Runtime: Devin (subagente)
- Branch: `agente/48-crm-dedup-s40`
- Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-40/wt-48`
- Base: `integracao/squad-40` @ `abbc4601ad` (tip convergido do squad — inclui
  merges dos agentes 46 e 47; linhagem `coord/squad-40` → Onda 3 `93e82c220`).
  Desvio justificado: a missão citava `integracao/onda-3-dem20261123`, mas o
  padrão vigente dos executores 46/47 é ramificar da base convergida do squad
  para evitar retrabalho; `abbc4601ad` é descendente da Onda 3 congelada.
- Lease: `.agents/runs/leases/squad-40-wt48.lease` (portas 22400–22499)
- node_modules: junction → `C:\Github\Birthub-360\node_modules`
  (criada com `cmd //c mklink /J` — `cmd /c` simples não produz o junction
  neste shell; registrado como aprendizado de ambiente).

## 1. Inventário (esqueleto vs funcional)

| Artefato | Estado |
|---|---|
| `src/features/crm/deduplication/dedup.service.ts` | Esqueleto útil: `detectDuplicateCrmContacts` puro (match exato email/telefone E.164/phonetic), `normalizePhoneToE164`, `computePhoneticKeyPtBr`. Sem score, sem documento, sem escopo de tenant, sem merge. Único consumidor: `tests/unit/onda4And5Complete.test.tsx` (smoke). |
| `src/features/crm/application/LeadDeduplicationService.ts` | FUNCIONAL (fora do ownership): merge real de Leads por `contactId`, reatribuição de ~19 FKs, soft-delete via client estendido + AuditLog, preview dry-run. Callers: `crm/routes/leadDedup.routes.ts`, `LeadDedupPanel.tsx`. |
| `src/features/crm/application/CompanyDeduplicationService.ts` | FUNCIONAL (fora do ownership): merge de `Company` por CNPJ/`tradeName`, sobrevivente por enriquecimento, limpeza de Account Intelligence. |
| `src/features/crm/jobs/deduplication.worker.ts` | FUNCIONAL: varredura BullMQ dominical, `Contact.groupBy` por `emailIndex`/`phoneIndex` escopado por tenant via RLS — só detecta/loga, não mescla. |
| `crm/presentation/*DedupController.ts`, `crm/routes/*Dedup.routes.ts`, `settings/components/*DedupPanel.tsx` | FUNCIONAIS — fora do ownership do 48. |

Conclusão: execução de merge já existia em `crm/application/**` (sem dono
formal na MATRIZ — gap já escalado). Lacuna real em `deduplication/**`:
camada de detecção pontuada + planejamento de merge auditável.

## 2. Implementação (menor fatia de valor — funções puras em `dedup.service.ts`)

- `ScoredCrmContact`: candidato + `organizationId` (obrigatório) + `document`.
- `normalizeDocument`: dígitos puros; só 11 (CPF) ou 14 (CNPJ) dígitos.
- `jaroWinklerSimilarity`: similaridade 0..1 sobre nomes normalizados.
- `detectScoredDuplicates(contacts, { fuzzyNameThreshold = 0.92 })`:
  pares `{ primaryId, duplicateId, organizationId, score, reasons[] }`;
  razões `EMAIL | PHONE_E164 | DOCUMENT | PHONETIC_NAME | FUZZY_NAME`;
  todas as chaves exatas que batem são registradas (auditoria); fuzzy só roda
  quando nenhuma chave exata bate, limitado por bucket de inicial por tenant.
  **Tenancy**: chaves de mapa prefixadas por `organizationId` — impossível
  casar cross-tenant.
- `planContactMerge(primary, duplicate)` — dry-run, zero I/O:
  união de campos; vazio do sobrevivente é resgatado do duplicado
  (`source: 'duplicate'`); divergência mantém o sobrevivente e gera
  `conflict` + entrada em `audit` (`CRM_CONTACT_MERGE_PLAN` com
  `conflictCount` e `filledFromDuplicate`) — nunca perda silenciosa.
  Lança erro em cross-tenant ou auto-merge.
- `detectDuplicateCrmContacts` original preservada integralmente (P3).

`detectScoredDuplicates`/`planContactMerge` ainda não têm caller em `src/` —
integração sugerida em handoff (preview do `LeadDedupController` ou
`deduplication.worker.ts`, ambos fora do ownership).

## 3. Gates executados

| Gate | Comando | Resultado |
|---|---|---|
| Testes do escopo | `npx vitest run -c vitest.unit.config.ts src/features/crm/deduplication/__tests__/dedup.service.test.ts` | ✅ 17/17 |
| Regressão do consumidor | `npx vitest run -c vitest.unit.config.ts tests/unit/onda4And5Complete.test.tsx` | ✅ 14/14 |
| TypeScript | `npm run typecheck` (`tsc --noEmit`) | ✅ exit 0 |
| Lint | `npx biome lint src/features/crm/deduplication` | ✅ 0 erros; 3 warnings `noNonNullAssertion` PRÉ-EXISTENTES em `detectDuplicateCrmContacts` (linhas 95/103/111 — função legada não tocada, P3) |

Não executados (registrar para Silas decidir): `test:architecture`,
`test:unit` completo, `test:integration`, `test:e2e` — mudança aditiva e pura,
sem rota/worker/schema novo.

## 4. Arquivos alterados/criados

- `src/features/crm/deduplication/dedup.service.ts` (modificado — aditivo)
- `src/features/crm/deduplication/__tests__/dedup.service.test.ts` (novo)
- `.agents/runs/leases/squad-40-wt48.lease` (novo)
- `.agents/handoffs/squad-40/48-para-40-dedup-score-e-merge-plan.md` (novo)
- `.agents/runs/squads/squad-40-run-48.md` (este arquivo)

## 5. Handoffs / pendências

- Handoff ao coordenador:
  `.agents/handoffs/squad-40/48-para-40-dedup-score-e-merge-plan.md` —
  inventário completo, sugestão de consumidor para o planejador e gap de
  ownership de `crm/application|routes|jobs` (candidato a escalonamento Astra,
  mesmo padrão dos gaps `calendar/**` e `integrations/**`).
- Sem push, sem PR, sem escrita fora do ownership + artefatos `.agents/` da
  missão.

## 6. SHA congelado para Silas

- Commit único sobre `integracao/squad-40` @ `abbc4601ad`, branch
  `agente/48-crm-dedup-s40`. O SHA congelado é o HEAD desta branch após o
  commit — obter com `git rev-parse HEAD` no worktree `wt-48`. Sem push.
