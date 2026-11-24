# Parecer Silas (Agente 09) — Agente 48 Jade · Deduplicação CRM (SQUAD40-48-DEDUP)

- **Demanda:** DEM-20261123-001
- **Data:** 2026-11-24
- **Revisor:** Agente 09 — Silas (Auditoria Independente e Gate Final), terceira instância paralela
- **Escopo auditado:** `agente/48-crm-dedup-s40` @ SHA congelado `ed5742f00e248127a8b0ad0d511aec3f6dc44048`
- **Base real do diff:** `abbc4601ad` (= `integracao/squad-40` convergido, contém merges aprovados dos Agentes 46 e 47)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-40/wt-48`
- **Run doc:** `.agents/runs/squads/squad-40-run-48.md` · **Handoff:** `.agents/handoffs/squad-40/48-para-40-dedup-score-e-merge-plan.md`

## Veredito: **APROVADO**

## 1. Diff e aditividade

`git diff abbc4601ad..ed5742f00` → **732 inserções, 0 deleções** em 5 arquivos:

| Arquivo | +/- |
|---|---|
| `src/features/crm/deduplication/dedup.service.ts` | +349 / −0 |
| `src/features/crm/deduplication/__tests__/dedup.service.test.ts` | +213 / −0 (novo) |
| `.agents/runs/squads/squad-40-run-48.md` | +92 / −0 (novo) |
| `.agents/handoffs/squad-40/48-para-40-dedup-score-e-merge-plan.md` | +72 / −0 (novo) |
| `.agents/runs/leases/squad-40-wt48.lease` | +6 / −0 (novo) |

**Aditividade confirmada:** a função legada `detectDuplicateCrmContacts` está integralmente preservada (todas as adições são append após a linha 122). O único consumidor existente (`tests/unit/onda4And5Complete.test.tsx`) passa sem alteração — regressão verificada abaixo. Nenhum arquivo fora do ownership `crm/deduplication/**` + artefatos `.agents/` foi tocado. Nenhum schema, rota, worker ou migration — escopo congelado respeitado.

## 2. Verificações executadas (reproduzidas nesta auditoria)

| Verificação | Comando | Resultado |
|---|---|---|
| Testes do escopo | `npx vitest run -c vitest.unit.config.ts src/features/crm/deduplication/__tests__/dedup.service.test.ts` | ✅ **17/17** (124 ms) |
| Regressão do consumidor | `npx vitest run -c vitest.unit.config.ts tests/unit/onda4And5Complete.test.tsx` | ✅ **14/14** (519 ms) |
| TypeScript | `npx tsc --noEmit` | ✅ **exit 0** |
| Lint | `npx biome lint src/features/crm/deduplication` | ✅ **0 erros**, 3 warnings `noNonNullAssertion` nas linhas 95/103/111 — todos na função legada `detectDuplicateCrmContacts`, pré-existentes e não tocadas (P3 respeitado) |

Claims do run doc **reproduzidos integralmente** — nenhuma divergência.

## 3. Análise de correção

### 3.1 Tenant-safety — ✅ correto
- `detectScoredDuplicates`: todas as chaves de mapa (`byEmail`, `byPhone`, `byDocument`, `byPhonetic`) são prefixadas por `organizationId` via `tenantKey(org, value)`; o bucket fuzzy usa `org|inicial`. É **estruturalmente impossível** casar contatos de tenants diferentes — não depende de disciplina do chamador.
- `planContactMerge`: lança `Error` em `primary.organizationId !== duplicate.organizationId` e em auto-merge (`primary.id === duplicate.id`). Guarda dupla e explícita.
- `ScoredCrmContact.organizationId` é obrigatório no tipo — o compilador força o escopo.

### 3.2 Jaro-Winkler — ✅ implementação correta
- Match distance `floor(max(len)/2) − 1`, janela `[i−d, i+d+1)`, dedup de matches via flags, transposições `/2`, fórmula Jaro padrão `(m/|a| + m/|b| + (m−t)/m)/3`, boost de prefixo `p·0.1·(1−jaro)` limitado a 4 caracteres. Semântica idêntica à referência.
- Uso restrito a sinal fraco (`FUZZY_NAME`, threshold default 0.92, só quando nenhuma chave exata bate, bucket limitado por inicial+tenant → O(n²) bounded documentado). Nunca critério único de merge — correto.

### 3.3 Merge planner — ✅ dry-run seguro
- `planContactMerge` é função pura, zero I/O, zero escrita, zero delete. Retorna plano + payload `audit` (`CRM_CONTACT_MERGE_PLAN` com `organizationId`, survivor/duplicate, `conflictCount`, `filledFromDuplicate`).
- Resolução de campos sem perda silenciosa: vazio do sobrevivente é resgatado (`source:'duplicate'`); divergência mantém o sobrevivente e marca `conflict:true` + entrada em `conflicts[]`; ordem alfabética determinística.
- **Risco de execução real: nulo** — não há executor ligado; o pior caso é um plano incorreto que ninguém persiste.

### 3.4 Detecção pontuada — ✅ lógica sadia
- Múltiplas razões por par são coletadas (EMAIL+PHONE+DOCUMENT+PHONETIC) — melhor auditoria que short-circuit.
- Contato casado não entra nos mapas → duplicatas subsequentes casam contra o primeiro visto (star topology), comportamento determinístico e adequado para preview.
- `normalizeDocument` aceita só 11/14 dígitos (CPF/CNPJ); validação de dígito verificador explicitamente fora de escopo — documentado, correto para camada de detecção.
- Edge cases cobertos pelos 17 testes (cross-tenant, fuzzy threshold, resgate de campo, conflito auditado, auto-merge).

## 4. Avaliações de escopo

### 4.1 Base `abbc4601ad` em vez de `integracao/onda-3-dem20261123` — **ACEITÁVEL**
- `abbc4601ad` é descendente da Onda 3 congelada e contém os merges **já aprovados** dos Agentes 46 (forecast, `fbe307efc`) e 47 (routing, `dec247af4`) — ambos com parecer Silas favorável no histórico da branch `agente/09-audit-onda3` (commit `727f13e72a`).
- O diff do 48 toca **apenas** `crm/deduplication/**` — interseção zero com forecast/routing. Ramificar da base convergida evita retrabalho de rebase e segue o padrão vigente dos executores 46/47. Desvio justificado no run doc e tecnicamente correto.

### 4.2 Funções sem caller em `src/` — **ACEITÁVEL como fundação**
- `detectScoredDuplicates`/`planContactMerge` não têm consumidor — verificado por grep: únicos arquivos que as referenciam são o service e o teste.
- A integração natural (`LeadDedupController`, `leadDedup.routes.ts`, `deduplication.worker.ts`) está **fora do ownership** do Agente 48 — forçar wiring violaria P15/propriedade. Entregar fundação pura + testes + handoff de integração é a menor fatia de valor correta neste modelo de ownership.
- Complementaridade real: o `deduplication.worker.ts` existente só agrupa por `emailIndex`/`phoneIndex` via RLS e **não mescla**; `LeadDeduplicationService` faz merge real mas de Leads, não de Contacts. Não há duplicação de funcionalidade (P34 respeitada).

### 4.3 Gap de ownership `crm/application|routes|jobs/**` — **confirmado, escalado**
- O inventário do handoff é preciso: services de merge Lead/Company e rotas/painéis de dedup são funcionais mas sem dono formal na MATRIZ do Squad 40 (legado "Agente 04 — CRM e BI" local). Pende de decisão do Agente 00/Astra — mesmo padrão dos gaps `calendar/**` e `integrations/**`.

## 5. Pendências repassadas ao Agente 00 (Astra/Ravi)

1. **Designar consumidor** de `detectScoredDuplicates` + `planContactMerge` (preview enriquecido no `LeadDedupController` ou score/fuzzy no `deduplication.worker.ts`) — requer owner de `crm/application|routes|jobs/**`.
2. **Escalonar gap de ownership** de `crm/application|routes|jobs/**` (sem dono formal na MATRIZ) — decisão humana/Astra.
3. **Opcional/futuro:** fuzzy em escala no worker pode exigir `pg_trgm`/índice no banco — handoff squad-10 se necessário (não bloqueante; preview atual é O(n²) bounded por bucket).

## 6. Observações menores (não bloqueantes)

- `detectScoredDuplicates` exige `phonetic` não-nulo também para o caminho fuzzy (além de `normalizedName.length >= 4`) — conservador, documentado; nomes sem chave fonética computável nunca casam por fuzzy. Aceitável.
- `planContactMerge` não inclui `id`/`organizationId` dentro de `fields` — correto (são metadados do plano, não campos mescláveis); chamador futuro deve garantir que `fields` carrega apenas colunas mescláveis.
- Sem execução de `test:architecture`/`test:integration`/`test:e2e` — mudança aditiva e pura sem rota/schema/worker novo; dispensa razoável, registrada.

## 7. Conclusão

Entrega cirúrgica, aditiva, testada e verificada de forma independente. Claims 100% reproduzidos. Lógica tenant-safe estruturalmente, merge planner dry-run sem risco de execução, governança de ownership respeitada com handoff correto. **APROVADO** para integração via `integracao/squad-40` → Onda 3.

---
*Auditoria independente — Silas (Agente 09), DEM-20261123-001, 2026-11-24.*
