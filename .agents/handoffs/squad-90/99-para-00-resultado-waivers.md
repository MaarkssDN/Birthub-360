# HANDOFF 99 → 00 (Astra) — Resultado da poda de waivers Trivy e hotspots

**De:** Agente 99 — Vito (Squad 90)
**Para:** Agente 00 — Astra (com cc Silas/09 para auditoria do SHA)
**Data:** 2026-11-24 · **DEM:** DEM-20261123-001
**Branch:** `agente/99-trivy-waivers-s90` · **Worktree:** `wt-99`
**Relatório completo:** `.agents/runs/squads/squad-90-run-99-waivers.md`

## Resumo executivo

- **37 das 40 entradas de `.trivyignore.yaml` removidas** — todas comprovadamente obsoletas
  (versões do lockfile acima do range vulnerável, conferido advisory a advisory na GitHub
  Advisory DB e OSV). `npm audit --audit-level=high` = 0 high/critical.
- **Único waiver mantido:** `picomatch` (CVE-2026-112366 — `4.0.7` é a última versão publicada,
  sem patch upstream). `expired_at: 2026-12-17` inalterado (não renovei nada).
- `AUDIT_WAIVERS.md` e `allow-ghsas` (dependency-review.yml + ci.yml) sincronizados na mesma
  alteração, conforme a regra de fonte de verdade única.
- **Hotspots:** os 11 arquivos estão todos abaixo do limite excepcional hoje; decisão de
  renovação NÃO foi tomada por mim (não é propriedade do Squad 90). Recomendação fundamentada
  no relatório §5: exceção de 14d condicionada a branches de refatoração, com tratamento
  diferenciado para `marketIntelligenceCompany.service.ts` (folga de apenas 4 linhas),
  `CommercialIntelligence.ts` (19) e `Landing360Impeccable.tsx` (29).

## Decisões que precisam de Astra/humano

1. **Renovação das 11 exceções de hotspot** (vencem 30/11; decisão até 29/11 21h -03) — ver
   tabela de decisões por item no relatório §5. Não editei `HOTSPOT_EXCEPTIONS.md`.
2. **Confirmação em CI:** `trivy` não roda neste host (App Control; Docker TCP 2375 proibido).
   A poda foi verificada por `npm audit` + GitHub Advisory DB + OSV (mesma fonte primária do
   banco do Trivy). O `trivy-fs-pr-gate` é fail-closed: se algum ID podado ainda for reportado,
   o gate falha e o waiver deve ser reintegrado. Pedir ao Tess (94) que observe o primeiro run.
3. **Propriedade:** editei `docs/security/AUDIT_WAIVERS.md` e `allow-ghsas` nos workflows
   (nominalmente Agente 08/Dora e 94/Tess) por exigência da deliberação §3 e da regra de
   sincronização na mesma alteração. Diff cirúrgico; favor validar com Silas.
4. **Pendência histórica resolvida:** o "espelho pendente" de `GHSA-7589-6fvf-x4pw` (effect)
   não foi criado porque `effect@3.22.5` já está corrigido — o item §5.4 do plano do Hélio
   está encerrado sem necessidade de espelho.

## Evidências

- `npm audit --json`: 2 moderate apenas (`@opentelemetry/*`, débito já documentado).
- `npm run security:audit-waivers` → PASS.
- `npx tsx scripts/architecture/check-hotspots.ts` → PASS (11 exceções válidas).
- Tabela de classificação dos 39 advisory-IDs no relatório §3.

## SHA para Silas

Commit(s) em `agente/99-trivy-waivers-s90` (SHA final reportado no fechamento da missão).
Escopo do diff: `.trivyignore.yaml`, `docs/security/AUDIT_WAIVERS.md`,
`.github/workflows/{ci,dependency-review}.yml`, `.agents/runs/**`, `.agents/handoffs/**`, lease.
Sem alteração em `src/**`, sem push, sem PR.

---
*Vito (99) — Squad 90*
