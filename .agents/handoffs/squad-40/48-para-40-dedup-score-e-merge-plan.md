# Handoff 48 → 40 — Detecção pontuada + planejador de merge de contatos entregue

- De: 48 — Jade (Deduplicação e Higienização de CRM — Squad 40)
- Para: 40 — Ravi (Coordenador Squad 40)
- Onda/Demanda: DEM-20261123-001 (`SQUAD40-48-DEDUP`)
- Data: 2026-11-24
- Status: entregue para revisão/auditoria (SHA congelado no run doc)
- Prioridade: médio
- Ownership: `src/features/crm/deduplication/**`

## Inventário (esqueleto vs funcional)

| Artefato | Estado |
|---|---|
| `src/features/crm/deduplication/dedup.service.ts` | Era esqueleto útil: `detectDuplicateCrmContacts` (puro, exato) + `normalizePhoneToE164` + `computePhoneticKeyPtBr`. Único consumidor: `tests/unit/onda4And5Complete.test.tsx` (smoke). Sem score, sem documento, sem tenant, sem merge. |
| `src/features/crm/application/LeadDeduplicationService.ts` | FUNCIONAL e robusto (fora do ownership do 48): merge real de Leads por `contactId`, reatribuição de ~19 FKs, soft-delete via client estendido + AuditLog, preview dry-run. Callers: `crm/routes/leadDedup.routes.ts` + `LeadDedupPanel.tsx`. |
| `src/features/crm/application/CompanyDeduplicationService.ts` | FUNCIONAL (fora do ownership): merge de `Company` por CNPJ/`tradeName`, critérios de sobrevivente por enriquecimento. |
| `src/features/crm/jobs/deduplication.worker.ts` | FUNCIONAL: varredura Sunday BullMQ, agrupa `Contact` por `emailIndex`/`phoneIndex` por tenant via RLS — mas só DETECTA/loga, não mescla. |
| `crm/presentation/*DedupController.ts`, `crm/routes/*Dedup.routes.ts`, `settings/components/*DedupPanel.tsx` | FUNCIONAIS, consomem os services de `application/` — fora do ownership do 48. |

Conclusão: a execução de merge já existia em `crm/application/**` (propriedade do
legado "Agente 04 — CRM e BI" local / não listada na MATRIZ do Squad 40). A lacuna
real em `deduplication/**` era a camada de DETECÇÃO/PLANEJAMENTO: score de
similaridade, documento (CPF/CNPJ), isolamento de tenant e plano de merge auditável.

## Entrega (menor fatia de valor, tudo função pura em `dedup.service.ts`)

- `ScoredCrmContact` — candidato estendido com `organizationId` (obrigatório) e
  `document` (CPF/CNPJ).
- `normalizeDocument` — dígitos puros; válido só com 11 (CPF) ou 14 (CNPJ).
- `jaroWinklerSimilarity` — similaridade 0..1 para nomes normalizados.
- `detectScoredDuplicates(contacts, { fuzzyNameThreshold })` — pares com `score` +
  `reasons[]` (`EMAIL`, `PHONE_E164`, `DOCUMENT`, `PHONETIC_NAME`, `FUZZY_NAME`).
  Chaves prefixadas por `organizationId` → **nunca cruza tenants**. Fuzzy limitado
  por bucket de inicial do nome por tenant (O(n²) bounded, documentado).
- `planContactMerge(primary, duplicate)` — planejador dry-run: resolve campos por
  união (vazio do sobrevivente é resgatado do duplicado; conflito divergente mantém
  o sobrevivente e é auditado — nunca perda silenciosa). Retorna `audit` payload
  (`CRM_CONTACT_MERGE_PLAN`) pronto para persistência. **Lança erro em merge
  cross-tenant ou auto-merge.**
- `detectDuplicateCrmContacts` original mantida intacta (compat com
  `tests/unit/onda4And5Complete.test.tsx`).

Testes: `src/features/crm/deduplication/__tests__/dedup.service.test.ts` — 17 casos
(chaves exatas, múltiplas razões, isolamento cross-tenant, fonético/fuzzy/threshold,
planejador: resgate, conflito auditado, igualdade sem conflito, bloqueio
cross-tenant e auto-merge).

## Gates

- `npx vitest run -c vitest.unit.config.ts src/features/crm/deduplication/__tests__/dedup.service.test.ts` → 17/17 ✅
- `npx vitest run -c vitest.unit.config.ts tests/unit/onda4And5Complete.test.tsx` → 14/14 ✅ (regressão do consumidor)
- `npm run typecheck` (`tsc --noEmit`) → limpo ✅
- `npx biome lint src/features/crm/deduplication` → 0 erros; 3 warnings
  `noNonNullAssertion` PRÉ-EXISTENTES em `detectDuplicateCrmContacts` (não tocados,
  P3).

## Pendências / handoffs sugeridos (fora do ownership do 48)

1. **Consumidor do planejador**: `planContactMerge` + `detectScoredDuplicates` ainda
   não têm caller em `src/`. Integração natural seria em
   `LeadDedupController`/`leadDedup.routes.ts` (preview enriquecido) ou no
   `deduplication.worker.ts` (hoje só detecta por índice cego, sem score/fuzzy) —
   ambos fora de `crm/deduplication/**`. Sugerir ao coordenador/designar owner de
   `crm/application|routes|jobs` (legado Agente 04?) ou missão futura.
2. **`crm/application/**` sem dono formal na MATRIZ**: os services de merge
   (Lead/Company) e rotas/painéis de dedup são funcionais mas não constam em nenhum
   slot do Squad 40 nem do Squad 50 — mesmo gap de ownership já escalado pelo 41
   (`calendar/**`, `integrations/**`). Registrar para o Astra.
3. Detecção fuzzy usa Jaro-Winkler simples (sem PG trigram/`pg_trgm`) — suficiente
   para preview; se o worker precisar de fuzzy em escala, considerar índice no
   banco (handoff squad-10 se necessário).
