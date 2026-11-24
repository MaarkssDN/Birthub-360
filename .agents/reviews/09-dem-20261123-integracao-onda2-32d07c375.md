# Parecer Consolidado — Agente 09 (Silas): integração Onda 2 @ `32d07c375`

> **Nota de reconciliação (Agente 00 — Astra, 2026-11-24):** este arquivo consolida dois pareceres independentes do Agente 09 emitidos por sessões distintas sobre o mesmo SHA `32d07c375`, com escopos de auditoria diferentes e vereditos complementares:
>
> - **Auditoria A (integridade de merge/cadeia)** — worktree `dem-20261123-onda3/wt-09-audit-onda3`: **APROVADO** quanto à mecânica de integração (patch-id idêntico, escopo, ownership).
> - **Auditoria B (gate de execução)** — worktree `dem-20261123-onda2/wt-00-integracao-o2`: **REPROVADO** quanto ao gate unitário (teste obsoleto `dataSubjectErasureCascade.test.ts`).
>
> O conflito add/add foi resolvido preservando ambos os pareceres integralmente. O veredito efetivo para homologação é o da Auditoria B (gate vermelho é bloqueador objetivo), **superado pela correção `a81c63ccc` e pelo parecer `09-dem-20261123-integracao-onda2-a81c63ccc.md` (APROVADO)**. Este documento não altera os pareceres originais — apenas os reúne.

---

# PARTE A — Auditoria de Integridade de Merge (sessão Onda 3)

Auditor (Agente 09): Silas (Agente 09 — Auditor Independente e Gate Final)
Runtime da Auditoria (Devin/Claude/etc): Devin (Cognition) — runtime independente dos autores
Agente Avaliado (ID): Integração combinada Onda 2 — DEM-20261123-001 (slots 02, 04, 90, 94, 08, 93, 99 e docs de pareceres 09)
Runtime do Avaliado: múltiplos runtimes (Claude Code / Antigravity) conforme pareceres por slot
Onda/Branch: DEM-20261123-001 / Onda 2 → baseline da Onda 3 (`integracao/onda-2-dem20261123`, mergeada na baseline)
Hash/Commit Auditado: `32d07c3750c370b63da8b720019413c9a40e0e68` (OBRIGATÓRIO - Qualquer alteração pós este hash invalida o review)
Worktree de auditoria: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-09-audit-onda3` — branch `agente/09-audit-onda3`

## Verificações de Gate
- [x] P1-P4 (Escopo e Simplicidade) respeitados? — Sim. Cada merge corresponde 1:1 a uma entrega aprovada; nenhum commit fora de escopo na cadeia `815a09305..32d07c375` (verificado via `git log --graph`: apenas 7 entregas/docs + 7 merges).
- [x] Propriedade de ficheiros respeitada (sem colisão)? — Sim. Diff `merge^1..merge` de cada merge é **patch-id idêntico** ao diff da entrega aprovada (`git patch-id --stable` comparado contra `815a09305..<SHA entrega>` para os 7 merges — todos IDENTICAL). Zero evil merges, zero resolução manual de conflito.
- [x] Regras de Segurança, LGPD (B-13) e Tenancy (B-10) seguidas? — Sim. `f2011442e` (Dora) remove `deleteMany` em `AuditLog` e passa a conservar registros por obrigação legal (Art. 16, I), preservando o gatilho `auditlog_no_mutation`; `be14797b6` (Hélio) restringe proxy `/tools|/design-lab` a `127.0.0.1` com `Cache-Control: private, no-store`; demais diffs são testes/CI/docs sem impacto em tenancy ou PII.
- [x] Evidências de sucesso/testes apresentadas? — Sim, via pareceres por slot já emitidos (f842a5ebf): cada entrega possui parecer APROVADO sobre o SHA exato mergeado.

## Escopo, Arquivos e Verificação Técnica

### 1. Correspondência merge ↔ parecer APROVADO
| Merge | 2º pai (entrega) | Agente | Arquivos | Parecer (SHA exato) | Decisão |
|---|---|---|---|---|---|
| `547cc9e1c` | `d776c8f8f` | 02 Bento | `scripts/test/prepare-integration-env.js`, `tests/helpers/{factories,integration-setup}.ts` | `09-dem-20261123-slot2-02-d776c8f8f.md` | APROVADO |
| `eb57c61f5` | `0d87b8adf` | 04 Teo | `tests/integration/*.test.ts` (6 arquivos) | `09-dem-20261123-slot3-04-0d87b8adf.md` | APROVADO |
| `1f34c4010` | `be14797b6` | 90 Hélio | `nginx/birthhub360.conf` | `09-dem-20261123-slot4-90-be14797b6.md` | APROVADO |
| `ba22add47` | `f9196627d` | 94 Tess | `.github/workflows/visual-baseline-update.yml` | `09-dem-20261123-slot5-94-f9196627d.md` | APROVADO |
| `a97849de6` | `f2011442e` | 08 Dora | `src/shared/services/dataSubjectErasure.service.ts` | `09-dem-20261123-slot6-08-f2011442e.md` | APROVADO |
| `0e5d17665` | `1074ee1a2` | 93 Max | `docs/security/AUDITORIA_DOCKER_P007_ONDA2_20261123.md` | `09-dem-20261123-slot7-93-1074ee1a2.md` | APROVADO |
| `32d07c375` | `f842a5ebf` | 09 Silas | 7 pareceres de slot + `09-dem-20261123-integracao-onda1-815a09305.md` | (este documento) | docs-only |

Baseline pré-merge dos 7 merges: `54d10014a` (entrega Agente 99 Vito — `docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md`, parecer `09-dem-20261123-slot1-99-54d10014a.md` APROVADO). Todas as 6 entregas de código/docs têm pai `815a09305` (baseline integrada Onda 1, parecer `integracao-onda1` APROVADO).

### 2. Integridade da árvore
- `git status`: working tree limpo; HEAD = `a32fd0fe5` (commit docs de checklist pós-baseline, fora do escopo auditado — ver §4).
- Nenhum marcador de conflito (`<<<<<<<`/`>>>>>>>`) introduzido pela Onda 2. Ocorrência pré-existente em `.agents/audits/technical-debt/2026-11-19/CHECKLIST_RESOLUCAO_ONDAS.md:92,96` já presente em `815a09305` (baseline Onda 1) — **dívida pré-existente, fora do escopo desta integração; registrada para handoff**.
- Nenhum arquivo `.env` real, `.orig`, `.rej` ou diretório de worktree vazado rastreado (`git ls-files` verificado; apenas `.env.example`/`.env.test.example` legítimos).
- Commits no range `815a09305..32d07c375`: exatamente 6 entregas + 1 doc Trivy + 2 commits de pareceres + 7 merges — nenhum commit fora de escopo.

### 3. Ownership compliance
- `tests/integration/**` → Agente 04 (matriz §10): conforme.
- `.github/workflows/**` → Agente 94 (matriz §136): conforme.
- `nginx/birthhub360.conf`, `tests/helpers/**`, `scripts/test/**`, `src/shared/services/**`, `docs/security/**`: fora das linhas literais da `MATRIZ_PROPRIEDADE.md`, mas cobertos pela divisão de slots da ordem `DEM-20261123-001`, ratificada nos pareceres por slot (cada um declara auditoria estrita do caminho atribuído). Sem colisão entre slots — conjuntos de arquivos disjuntos.
- `.agents/reviews/**` → Agente 09: conforme (propriedade exclusiva).

### 4. Observações (não bloqueantes)
- HEAD do worktree é `a32fd0fe5` (`docs(onda-3): checklist de auditoria independente Silas`), commit posterior à baseline auditada. Este parecer cobre exclusivamente `32d07c375`.
- Marcadores de conflito pré-existentes em `CHECKLIST_RESOLUCAO_ONDAS.md` (ver §2) — recomendo handoff ao dono do arquivo para saneamento.

## Protocolo de recebimento — pareceres de entregas da Onda 3
Para cada entrega futura da Onda 3, o parecer exigirá e registrará:
1. **SHA congelado**: hash completo do commit de entrega; qualquer alteração pós-hash invalida o review.
2. **Escopo declarado**: arquivos/caminhos autorizados pela ordem da onda e slot do executor.
3. **Diff auditado**: `git diff <base>..<SHA>` com verificação de patch-id contra o merge subsequente quando houver integração.
4. **Evidências de teste**: comandos executados, resultados e justificativas de não aplicabilidade; falhas pré-existentes identificadas, nunca anunciadas como gate verde.
5. **Ownership**: caminhos conferidos contra `MATRIZ_PROPRIEDADE.md` + ordem da onda; colisões → REPROVADO/BLOQUEADO.
6. **Decisão**: APROVADO / REPROVADO / BLOQUEADO sobre o SHA exato, em `.agents/reviews/`, no formato deste template.
Somente APROVADO permite integração. Este parecer **não** autoriza push, PR, merge em `main` ou deploy — autorizações permanecem decisões separadas do Agente 00.

## Decisão (Auditoria A)
APROVADO
*(Baseline `32d07c375` aprovada como integração íntegra da Onda 2: 7/7 merges com patch-id idêntico às entregas aprovadas por pareceres de slot sobre SHAs exatos, zero commits fora de escopo, árvore consistente sem conflitos mal resolvidos ou arquivos vazados, e compliance de ownership conforme slots da DEM-20261123-001. Qualquer alteração pós este hash invalida o review. Pendência não bloqueante: saneamento de marcadores de conflito pré-existentes em `.agents/audits/technical-debt/2026-11-19/CHECKLIST_RESOLUCAO_ONDAS.md`, herdada da baseline Onda 1.)*

> **Adendo da reconciliação:** esta auditoria validou a mecânica de merge e não executou a suíte unitária. O gate unitário foi auditado separadamente na Parte B, que reprovou o mesmo SHA por falha reproduzível. Os dois vereditos são complementares, não contraditórios.

---

# PARTE B — Auditoria de Gate de Execução (sessão Onda 2)

Auditor (Agente 09): Silas (Agente 09 — Auditor Independente e Gate Final)
Runtime da Auditoria (Devin/Claude/etc): Devin (Cognition) — subagente independente, worktree de integração `wt-00-integracao-o2`
Agente Avaliado (ID): Integração combinada — 7 entregas de especialistas (99, 02, 04, 90, 94, 08, 93) + merges + 7 pareceres de slot
Onda/Branch: DEM-20261123-001 (Onda 2) / `integracao/onda-2-dem20261123`
Hash/Commit Auditado: `32d07c375` (OBRIGATÓRIO — qualquer alteração pós este hash invalida o review)
Baseline comparada: `815a09305` (HEAD da Onda 1)

## Verificações de Gate
- [x] Escopo do diff `815a09305..32d07c375` confere com as 7 missões + docs/reviews? *(22 arquivos, +767/−91 — somente os arquivos declarados; nenhum arquivo fora das missões ou de propriedade alheia)*
- [x] Propriedade de ficheiros respeitada? *(sem colisão; `dataSubjectErasure.service.ts` autorizado para o Agente 08/Dora; `nginx/` e `.github/workflows/` entregues pelos slots 90/94 conforme matriz)*
- [ ] Gate unitário verde no SHA combinado? *(REPROVADO — evidência abaixo: 1 teste unitário falha)*
- [x] Consistência entre entregas (harness 02 × testes 04 × LGPD 08)? *(parcial — ver achado bloqueador 1)*
- [x] Conformidade LGPD/tenancy nos trechos alterados? *(serviço LGPD correto juridicamente; tenancy/RLS preservada nos testes de integração)*
- [x] Evidências de gate registradas nos commits/pareceres? *(7 pareceres de slot APROVADO presentes; gates completos de integração pendentes por definição da onda)*

## Escopo e Análise Técnica

### 1. Escopo do diff combinado
`git diff --stat 815a09305..32d07c375` confirma 16 commits e 22 arquivos alterados:

- **Docs/reviews (8 arquivos):** 7 pareceres de slot `09-dem-20261123-slotN-*.md` + parecer da Onda 1 já existente no baseline.
- **Auditorias documentais (2):** `docs/audits/.../AUDITORIA_DOCKER_P007_ONDA2_20261123.md` (93/Max) e `AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` (99).
- **Agente 02 (Bento, harness):** `tests/helpers/factories.ts`, `tests/helpers/integration-setup.ts`, `scripts/test/prepare-integration-env.js`.
- **Agente 04 (Teo, PG16/17):** `tests/integration/db-owner-role-separation.test.ts`, `tests/integration/prospecting-rls.test.ts`, timeouts `120_000` em 4 suítes de integração.
- **Agente 90 (Helio, nginx P0-07):** `nginx/birthhub360.conf` — `location = /sw.js` com `no-cache/no-store`, headers de segurança repetidos em `location` (correto: `add_header` em location anula herança do server), `proxy_no_cache`/`proxy_cache_bypass` e `proxy_hide_header Cache-Control` + `Cache-Control "private, no-store"` no proxy `/tools|/design-lab`, e `localhost`→`127.0.0.1` em todos os `proxy_pass`.
- **Agente 94 (Tess, CI visual):** `.github/workflows/visual-baseline-update.yml` — dry-run padrão (`dry_run: 'true'`), captura de diffs pré-update como artefato auditável, upload de candidatas, commit/push na branch isolada `ci/visual-baselines-linux` somente com `dry_run=false`, sem merge automático, `concurrency` serializado, permissões mínimas mantidas (`contents: write`), SHA pinado no `upload-artifact`.
- **Agente 08 (Dora, LGPD):** `src/shared/services/dataSubjectErasure.service.ts` — remoção do `tx.auditLog.deleteMany(...)` que violava o gatilho `auditlog_no_mutation` (SQLSTATE 42501), substituído por conservação regulatória sob LGPD Art. 16, I, mantendo o append `ERASURE_LGPD_ART_18` com hash SHA-256 do titular.
- **Agente 93 (Max, Docker):** somente documentação de auditoria.

Nenhum arquivo fora do escopo; nenhum schema/migration (correto — integrações não criam migrações); `server.ts`, `package.json` e lockfile intocados.

### 2. Consistência entre entregas

**Coerente:**
- `prepare-integration-env.js`: `getEffectiveTestDatabaseName()` deriva o nome do banco de `TEST_DATABASE_URL || DATABASE_URL`, exige sufixo `_test` e faz fallback seguro para `prospectordb_test`. Todas as 7 referências a `TEST_DB_NAME` estão dentro de `runPrepareIntegrationEnv()` após a declaração — sem referência órfã. A trava `assertTestDatabaseSafety` continua validando todas as URLs configuradas com sufixo `_test`, então o isolamento dinâmico do 02 não enfraquece a segurança do harness.
- `factories.ts`: as factories (`Contact`, `Activity`, `Note`, `TimelineEvent`) agora só injetam `create` aninhado quando o override não traz `lead`/`leadId`/`company`/`companyId` — elimina nested create redundante sem quebrar chamadas existentes (spread de overrides preservado).
- `integration-setup.ts`: preserva deterministicamente `compliance-baseline-org` (BT360-DT-0071) e reordena `RESTRICT_FK_TABLES` com as filhas de snapshot (`AccountSignal`, `DecisionMaker`, `IntelligenceEvidence`, `AccountScore`, `AccountRecommendation`, `EconomicRelationship`) antes de `AccountIntelligenceSnapshot` — ordem reversa correta para FKs RESTRICT.
- `prospecting-rls.test.ts`: deleção em ordem de dependência (`TimelineEvent`/`Activity`/`Note`/`PublicLeadConsent` → `Lead`/`Contact` → `Company`) — consistente com as factories e com a correção do 04.
- Timeouts de `120_000` nos `beforeAll` de seed são uniformes e proporcionais ao custo dos seeds.

**Inconsistente — ACHADO BLOQUEADOR 1 (ver Decisão):**
- O commit `f2011442e` (Agente 08) alterou o comportamento de `eraseDataSubject` mas **não atualizou** `tests/unit/shared/services/dataSubjectErasureCascade.test.ts`, que ainda descreve o comportamento antigo (deleteMany físico + `priorAuditLogsPurged === 5`). O parecer de slot 6 (`09-dem-20261123-slot6-08-f2011442e.md`) validou apenas `erasure-transaction-rollback.test.ts` (2/2) e não executou a suíte unitária completa — o teste obsoleto passou despercebido na revisão de slot e só emerge na auditoria da integração combinada.

### 3. Evidência de gate executada nesta auditoria (verificação leve, sem suíte completa)

Comando executado no worktree de integração no SHA auditado:
```
npx vitest run tests/unit/shared/services/dataSubjectErasureCascade.test.ts tests/unit/services/erasure-transaction-rollback.test.ts
```
Resultado: **1 failed / 2 passed**.

```
FAIL tests/unit/shared/services/dataSubjectErasureCascade.test.ts
  > deve realizar expurgo de dados do titular e deletar fisicamente logs de auditoria prévios contendo PII
AssertionError: expected +0 to be 5 // Object.is equality
  tests/unit/shared/services/dataSubjectErasureCascade.test.ts:92:41
    expect(result.priorAuditLogsPurged).toBe(5);
```

O serviço agora retorna `priorAuditLogsPurged = 0` e nunca chama `tx.auditLog.deleteMany` (o assert `toHaveBeenCalledWith` na linha 95 também falharia). Ou seja: `npm run test:unit` está **VERMELHO** no SHA `32d07c375`. A correção jurídica do Agente 08 está correta — o defeito é o teste unitário obsoleto que descreve o comportamento pré-Onda-2 e precisa ser reescrito para asserir a nova semântica (conservação Art. 16, I: `deleteMany` NÃO chamado, `priorAuditLogsPurged === 0`, append `ERASURE_LGPD_ART_18` preservado). Isso é trabalho do domínio de testes (Agente 08/QA) com coordenação do 00 — não cabe ao auditor editar.

### 4. Riscos de integração

- **Ordem de merges:** sequencial e limpa (02 → 04 → 90 → 94 → 08 → 93 → pareceres). O merge do 08 foi o último de código e não gerou conflito textual; a inconsistência é semântica (teste obsoleto), não de merge.
- **Código morto/órfãos:** nenhum `auditLog.deleteMany` restante em `src/`; campo `priorAuditLogsPurged` permanece no contrato de retorno (agora sempre 0) — semanticamente correto, embora o nome do campo fique enganoso; não é bloqueador.
- **LGPD:** a mudança está juridicamente correta (Art. 16, I — conservação de logs para obrigação legal; AuditLog sem PII aberta; comprovação via append com hash). Resolve o bloqueador B-13/B-05.
- **Tenancy/RLS:** nenhum bypass novo; `deleteOrganizationsAsOwner` filtra explicitamente `compliance-baseline-org`; deleções de teardown respeitam RLS/bypass existentes.
- **CI visual:** workflow ficou mais seguro (dry-run padrão, evidência auditável, sem auto-merge) — nenhuma regressão de segurança introduzida; `permissions: contents: write` mantida mínima para o caso `dry_run=false`.
- **Nginx:** correções P0-07 corretas quanto à semântica de herança de `add_header` em nginx (headers repetidos em cada location que os define).

## Decisão (Auditoria B)

**REPROVADO / BLOQUEADO** para o SHA `32d07c375` como candidato de homologação.

Motivo único e objetivo: o gate unitário está vermelho no SHA combinado — `tests/unit/shared/services/dataSubjectErasureCascade.test.ts` falha (1/1) por descrever o comportamento removido pelo commit `f2011442e`. Não é um problema de conveniência de auditoria: é evidência reproduzível de que a integração combinada não passa no gate mínimo (`npm run test:unit`), violando o contrato de qualidade e aceite (AGENTS.md §28/§41).

**Encaminhamento exigido:**
1. Agente 00 abre handoff para o Agente 08 (QA) com coordenação do Agente 21/01A se necessário: reescrever `dataSubjectErasureCascade.test.ts` para asserir o novo comportamento regulatório (sem `deleteMany`, `priorAuditLogsPurged === 0`, preservação do append `ERASURE_LGPD_ART_18`), em branch de correção sobre `integracao/onda-2-dem20261123`.
2. Após o commit de correção, novo parecer do Agente 09 sobre o novo SHA (o presente parecer fica invalidado para qualquer hash ≠ `32d07c375`).
3. Gates completos de integração (`test:integration`, `tsc`, `lint`, `build`, e2e conforme matriz da onda) e decisão humana permanecem pendentes — a plataforma segue NO-GO independentemente deste parecer.

*Parecer formal emitido por Silas (Agente 09). Veredito fundamentado em evidência reproduzível executada no worktree de integração; não é reprovação dos slots individualmente (todos APROVADO em seus hashes), mas da integração combinada no hash auditado.*

---

## Encerramento da reconciliação (Agente 00)

- O achado bloqueador da Parte B foi corrigido em `a81c63ccc` (rewrite do teste para a semântica Art. 16, I) e reauditado: **`09-dem-20261123-integracao-onda2-a81c63ccc.md` → APROVADO**.
- Este arquivo passa a ser a fonte canônica única do parecer de integração Onda 2 @ `32d07c375`, eliminando a divergência add/add entre as duas sessões de auditoria.
