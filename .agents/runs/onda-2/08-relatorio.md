# Relatório — Agente 08 (QA e Release) — Onda 2 / DEM-20261113-003

Branch: `agente/08-onda2-ci` (base `integracao/onda-2`)
Worktree: `C:\Github\Birthub-360-worktrees\agente-08-onda2-ci`
Escopo executado: **MEL-15** (SBOM + scanning de dependências em CI com gate bloqueante).
MEL-19: ignorado conforme instrução.

## O que foi entregue

### Novo workflow: `.github/workflows/security-sbom.yml`

Dois jobs, ambos bloqueantes (sem `continue-on-error`):

| Job | O que faz | Bloqueante? |
|---|---|---|
| `sbom` | `npm ci --no-audit --no-fund` → `npm run security:sbom` (gera `sbom.cdx.json` via `@cyclonedx/cyclonedx-npm`, o mesmo comando já usado em `cd-homolog.yml` e `production.yaml`) → upload como artefato `sbom-<sha>` (retenção 90 dias, `if-no-files-found: error`). | Sim (falha se o SBOM não for gerado). |
| `rls-coverage-gate` | `npm ci` → `npm run verify:rls-coverage` (`scripts/security/check-rls-coverage.ts`, criado na Onda 1 / DEM-20261113-002). Verificação estática: todo model com `organizationId`/`tenantId` no `schema.prisma` precisa de `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` nas migrations. | Sim — é o gate pedido pelo handoff do Agente 15 que ainda não existia em CI. |

### Gatilhos

- `pull_request` → `main`/`master` (mesmo padrão de `security-trivy.yml`, `codeql.yml`, `dependency-review.yml`).
- `schedule`: `0 6 * * 4` (quinta 06:00 UTC) — deslocado do Trivy semanal (segunda) e do CodeQL (quarta) para não competir por runner.
- `workflow_dispatch`.

Permissões: `contents: read` apenas (nível do workflow; nenhum job precisa de mais).

Actions pinadas por SHA, seguindo a convenção do repositório:
`actions/checkout@3d3c42e…` (v7.0.1), `actions/setup-node@949feb2…` (v7.1.0), `actions/upload-artifact@cf430e0…` (v7.0.2).

## Decisão sobre scan de vulnerabilidades (importante)

O requisito "rodar Trivy/Grype e falhar em CRITICAL/HIGH" **já está integralmente coberto** por gates bloqueantes existentes — adicionar um segundo scan seria duplicação de runner sem ganho de sinal:

1. **`ci.yml` → job `trivy-scan`**: Trivy fs scan, `severity: HIGH,CRITICAL`, `exit-code: '1'`, `trivyignores: .trivyignore.yaml`, `limit-severities-for-sarif: true`. Alimenta o required check `build` (agregador fail-closed).
2. **`security-trivy.yml` → job `trivy-fs-pr-gate`**: mesma política em PR, com SARIF na aba Security. Job separado `trivy-fs-scan` faz scan semanal via docker compose (não bloqueante, monitoramento).
3. **`ci.yml` → `security:audit-waivers`**: `npm audit --audit-level=high` com waivers auditados em `docs/security/AUDIT_WAIVERS.md`.
4. **`dependency-review.yml` + `ci.yml` → `dependency-review`**: `fail-on-severity: high` no diff de dependências do PR.

**Por que não adicionei Grype**: um scan Grype bloqueante falharia nos GHSA aceitos em `AUDIT_WAIVERS.md` (ex.: `GHSA-ggr8-5vv4-36mx` via prisma) porque o Grype não lê `.trivyignore.yaml` nem os waivers do audit — e criar `.grype.yaml` na raiz está fora do escopo permitido (`.github/workflows/**` e `tests/**` apenas). O SBOM publicado como artefato permite rodar Grype/Snyk externamente sem conflito de política.

## Outros gates de segurança em CI (verificação de conflitos)

- `codeql.yml` — SAST CodeQL (js/ts, python) + gate `security:codeql-sarif`. Sem conflito.
- `sonarqube.yml` — análise de qualidade. Sem conflito.
- `endpoint-latency-budget.yml`, `frontend-bundle-budget.yml`, `public-assets-budget.yml`, `visual-regression.yml`, `playwright-ci.yml`, `postman-sync.yml` — não relacionados a segurança de dependências.
- `cd-homolog.yml` / `production.yaml` — geram SBOM no deploy; o novo workflow não conflita (artefatos com nomes/escopo diferentes; retenção menor, 90d igual).
- Nenhum workflow existente rodava `verify:rls-coverage` — confirmado por grep em `.github/workflows/`.

## Validação executada

- Parse YAML com pacote `yaml` (Node): `on` preservado como chave string (YAML 1.2), jobs `sbom` e `rls-coverage-gate` presentes.
- `npx tsx scripts/security/check-rls-coverage.ts` local: **OK — 135 tabelas tenant-bearing com RLS + policy** (exit 0).
- `git check-ignore sbom.cdx.json`: ignorado pelo `.gitignore` — artefato de CI, não versionado (correto).
- `actionlint` não disponível no ambiente; validação foi parse + revisão manual.

## Como validar em CI

1. Push/PR para `main`/`master` dispara o workflow; ou Actions → "Security - SBOM & Gates Estáticos" → Run workflow.
2. Esperado: job `sbom` gera e faz upload de `sbom-<sha>`; job `rls-coverage-gate` imprime "OK — N tabelas tenant-bearing".
3. Para testar o gate RLS falhando: adicionar temporariamente um model com `organizationId` sem migration RLS → job deve falhar com a lista de tabelas.

## Commits

- `22a432a3b` — `ci(security): add SBOM artifact workflow and blocking RLS coverage gate (MEL-15, DEM-20261113-003)`

Sem push, sem merge — branch pronta para revisão do Agente 24 / integração pelo 00.
