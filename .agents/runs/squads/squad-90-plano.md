# SQUAD 90 — PLANO DE OPERAÇÃO CONTÍNUA (DEM-20261123-001)

**Coordenador:** Agente 90 — Hélio
**Data de corte:** 2026-11-24
**Branch:** `coord/squad-90` · **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-90/wt-coord`
**Base:** `93e82c220` (`docs(governanca): estrutura oficial 10 squads/10 coordenadores`)
**Baseline técnica herdada:** `integracao/onda-3-dem20261123` @ `0141f258a` (Onda 3: 17/17 entregas auditadas — Agentes 94, 96, 97, 99 do Squad 90 integrados)
**Lease:** `.agents/runs/leases/squad-90.lease` (session `helio-coord-squad90-dem20261123-001`, expira 4h sem heartbeat)

---

## 1. Estado herdado do Squad 90

| Agente | Papel | Estado Onda 3 | Próxima frente |
|---|---|---|---|
| 90 — Hélio | Coordenador | Concluído (nginx P-007) | Esta coordenação |
| 91 — Terra | IaC AWS | PREPARADO | Auditoria estática Terraform/AWS, IAM least-privilege |
| 92 — Kora | K8s/Helm | PREPARADO | Charts Helm, probes, resource limits, secrets |
| 93 — Max | Docker/Containers | Concluído (Onda 2) | Reconciliar handoff compose local sem TCP 2375 |
| 94 — Tess | CI/CD | Concluído (Schemathesis `--origin`) | Release gates CI; Semgrep gate; waivers |
| 95 — Íon | Observabilidade | PREPARADO | Prometheus/Grafana/OTel, logs sem PII |
| 96 — Nera | Auth/Sessões | Integrado Onda 3 (Argon2id + session sweep) | Continuação auth; cookie Secure (handoff `96-para-00-cookie-secure-producao.md`) |
| 97 — Rocco | RBAC | Integrado Onda 3 (organizationId) | Cobertura RBAC fail-closed em rotas admin/tenant |
| 98 — Safira | Segredos | PREPARADO | Cofre, rotação B-04 (proibida rotação real sem aprovação humana) |
| 99 — Vito | AppSec | Integrado Onda 3 (triagem docs) | Remediação CodeQL (137 alertas), poda waivers Grupo C |

## 2. Prazos duros com data (risco de quebra de gate)

| Item | Vencimento | Gate afetado | Evidência |
|---|---|---|---|
| **37 waivers Trivy** (`expired_at: 2026-11-30`) | **30/11/2026** | `trivy-fs-pr-gate`, scan imagem `production.yaml` | `.trivyignore.yaml` (40 IDs; 37 exp. 30/11 + 3 exp. 17/12) |
| **11 exceções de hotspot** (`Reavaliar até: 2026-11-30`) | gate falha a partir de **29/11 21h -03** | `npm run check:hotspots` (`check-hotspots.ts`) | `docs/architecture/HOTSPOT_EXCEPTIONS.md` |
| Waiver `picomatch` (`expired_at: 2026-12-17`) | 17/12/2026 | Trivy + Dependency Review | `.trivyignore.yaml`, `AUDIT_WAIVERS.md` |
| Débito `@opentelemetry/core` moderate | reavaliar 2026-11-11 (**já vencido**, não bloqueia gate) | nenhum (moderate < high) | `AUDIT_WAIVERS.md` "Débito conhecido" |
| Waivers `GHSA-7589-6fvf-x4pw` (`effect`) | reavaliar 2026-12-20; **espelhos pendentes** em `.trivyignore.yaml`/`allow-ghsas` | futuro | `AUDIT_WAIVERS.md` linhas 136-144 |

## 3. Cronograma de waivers e hotspots (plano de renovação/remediação)

**Regra vigente (AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §1):** PROIBIDA renovação automática/indiscriminada. Cada waiver só renova após verificação de que o achado persiste e o risco permanece o mesmo; mudança de waiver exige aprovação (Agente 00 / humano).

### 3.1 Trivy — 3 grupos (classificação Agente 99, Onda 2)

**GRUPO A — produção real (decisão humana obrigatória até 28/11):**
- `better-auth` ×3 GHSA (critical) — aguardar release upstream; bump não-disruptivo é pré-requisito.
- `dompurify` ×3 GHSA — Agente 99 propôs bump `>=3.2.0`; **ação: executar bump controlado ou renovar com nova data justificada**.
- `nodemailer` ×3 GHSA — `emailSanitizer` mitiga; **ação: bump última minor estável**.
- Entrega: PR único de bump não-disruptivo dos 3 pacotes OU renovação formal de 30 dias por pacote com nova evidência de `npm audit` + `trivy fs`.

**GRUPO B — build/CLI/test only (renovação técnica justificada):**
- `deepmerge-ts`/`CVE-2026-40345`/`GHSA-ggr8-5vv4-36mx` (Prisma CLI), `effect`/`GHSA-7589-6fvf-x4pw`, `picomatch` (exp. 17/12), `brace-expansion` ×3, `@vitest/mocker` ×2.
- Entrega: renovar `expired_at` para 2027-01-15 SOMENTE após re-verificação (`npm audit` + `trivy fs --severity HIGH,CRITICAL`) e espelhamento do `effect` pendente em `.trivyignore.yaml` e `allow-ghsas` (`dependency-review.yml`, `ci.yml`). Owner dos arquivos: Agente 99 (Vito) — `.trivyignore.yaml` é "similar" de `.semgrep.yml`; `docs/security/AUDIT_WAIVERS.md` pertence a docs (Agente 08/Dora) → coordenar via handoff.

**GRUPO C — já saneados (poda):**
- `source-map-js`, `undici` ×5 IDs, `re2js` — **confirmado resolvido no lockfile em 2026-11-24** (evidência §2 do arquivo de evidência). Poda segura.

**ATUALIZAÇÃO 2026-11-24 (verificação do coordenador):** `npm audit --audit-level=high` → **0 high/critical**; lockfile já contém versões corrigidas de `deepmerge-ts` (8.0.2), `effect` (3.22.5), `dompurify` (3.4.17), `nodemailer` (10.2.1), `better-auth` (1.7.14). Os Grupos A e B podem estar **substancialmente obsoletos** — a poda real depende de `trivy fs` (ferramenta indisponível neste host; ver evidência §4). `picomatch@4.0.7` permanece na última versão sem patch upstream — único waiver com motivo técnico de renovação confirmado por versão.

### 3.2 Hotspots — 11 exceções (dono ≠ Squad 90 na maioria)

Ninguém do Squad 90 é dono dos 11 arquivos (Squads 30/40/50/60/70 + donos humanos). O papel do Squad 90 é **gatekeeping e contingência**, não refatoração:

| Arquivo | Dono registrado | Refatoração proposta (auditoria Onda 2) |
|---|---|---|
| `Landing360.tsx` (3500) | Marks-Mah / Squad 30 | Fatiar seções em `landing/components/sections/` |
| `Landing360Impeccable.tsx` (1050) | Agente 15 legado / Squad 30 | Extrair subcomponentes (<800) |
| `extraction.ts` Bitrix (1100) | Squad 50 (Agente 52) | Split paginação/streaming/parse |
| `CommercialIntelligence.ts` (1250) | maarkss1 / Squad 40 | Dividir DTOs por subdomínio |
| `leads.routes.ts` prospecting (1500) | Squad 40 (Agente 41/43) | Extrair controllers secundários — **atenção: cresceu p/ 1440/1500 (60 linhas de folga)** |
| `voice-hub design-system/index.tsx` (1200) | Squad 60 (Agente 65) | Desmembrar barrel |
| `intelligence.routes.ts` (1100) | Squad 70 (Agente 76) | Sub-routers por domínio |
| `marketIntelligenceCompany.service.ts` (1020) | Squad 70 (Agente 74) | Extrair helpers (~50 linhas) |
| `workflowRuntimeService.ts` (1500) | Squad 60 (Agente 61) | Decompor motor IVR |
| `LeadDetailDrawer.tsx` (1100) | Squad 40 (Agente 41) | Extrair abas |
| `PillarRegistry.tsx` (1450) | Squad 30 (Agente 33) | Extrair 5 viewers restantes — **1403/1450** |

**Contingência proposta (do Agente 99):** extensão única de 14 dias (até 14/12/2026) condicionada à abertura de branches de refatoração para os 5 maiores (`Landing360.tsx`, `leads.routes.ts`, `workflowRuntimeService.ts`, `PillarRegistry.tsx`, `extraction.ts`). Decisão: **humano/Astra** — não cabe ao Squad 90 prorrogar exceção de arquivo de outro squad sem aval.

## 4. CodeQL — 137 alertas (41 `error` bloqueantes de gate)

Fonte: `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md` (Agente 99, confirmado via `gh api`, 2026-11-24).

- **41 `error`:** log-injection ×10, SSRF ×8, system-prompt-injection ×8, user-controlled-bypass ×7 (maioria FP), path-injection ×6 (scripts manuais), helmet ×1 (by-design), reflected-xss ×1 (iCal, baixo).
- **96 `warning`:** rate-limiting ausente ×19 (mais sensível), url-sanitization ×21, remote-property-injection ×10, polynomial-redos ×9, sanitização multi-char ×7, etc.
- **Nenhum confirmado explorável remotamente sem auth na baseline.**
- **Risco de gate:** `security:codeql-sarif` (`check-codeql-sarif.ts`, `level: error`) pode reprovar PRs que tocam arquivos com dívida herdada de `main`. **Decisão pendente (Astra/99):** gate por baseline-diff ou absoluto; recomendo diff-based (só falha em alertas novos/alterados), implementável em `scripts/security/check-codeql-sarif.ts` (owner: 99).
- **Execução de remediação (posse por domínio dos arquivos):** handoffs já emitidos pelo 99 para Squads 40/50/60/70/20. Squad 90 assume apenas o que está em `scripts/security/**`, `.semgrep.yml` e `.trivyignore.yaml`.

## 5. Decisões humanas pendentes (bloqueiam remediação real)

1. **Repositório público + secret scanning desligado** — habilitar GitHub secret scanning + push protection; confirmar `BIRTHHUB360_WEBHOOK_SECRET` de produção ≠ valor antigo (commit `9236028b`). Handoff: `99-para-00-codeql-137-alertas-e-decisoes.md`.
2. **Cookie `Secure` em produção** — código já é condicional (`SECURE_COOKIES=true` ou `BETTER_AUTH_URL` https; `src/lib/auth.ts:295-307`). Falta decisão de env em produção. **Gap de ownership:** `src/lib/auth.ts` (arquivo) não está coberto pelo glob `src/lib/auth/**` do Agente 96 nem tem dono explícito na MATRIZ — registrar na matriz (handoff ao Astra). Handoff existente: `96-para-00-cookie-secure-producao.md`.
3. **Rotação de segredos** — procedimento pronto em `docs/security/ROTACAO_SEGREDOS.md` (incl. envelope `CREDENTIALS_ENCRYPTION_KEY` com grace period). Execução é ação irreversível/produção → **somente com aprovação humana** (Agente 98 prepara, humano executa).
4. **`effect` waiver sem espelho** — aprovado em `AUDIT_WAIVERS.md` (2026-11-20) mas ausente de `.trivyignore.yaml`/`allow-ghsas`; risco de reprovação futura em PR de dependências. Ação técnica do Agente 99.
5. **Semgrep:** 1 FP funcional (`bitrix.routes.ts:837`, owner Squad 50) + 1 provável já corrigido (`reencrypt-credentials.ts`) — confirmar com novo run; supressão `nosemgrep` exige owner + aval.

## 6. Despacho de executores (máx. 3 concorrentes — política §5 estrutura)

| # | Executor | Branch/Worktree | Missão | Prioridade |
|---|---|---|---|---|
| E1 | **99 — Vito** | `agente/99-trivy-poda-grupo-c-s90` / `wt-99` | **NOVO ESCOPO (evidência 2026-11-24):** poda provavelmente estendida a quase todos os 40 IDs — `npm audit` 0 high/critical e lockfile mostra fixes (`deepmerge-ts@8.0.2`, `effect@3.22.5`, `dompurify@3.4.17`, `nodemailer@10.2.1`, `better-auth@1.7.14`). Rodar `trivy fs` com/sem ignorefile, podar IDs ausentes, renovar só os persistentes (provável: `picomatch`, talvez `brace-expansion`/`@vitest/mocker`). Detalhes: `.agents/runs/squads/squad-90-evidencia-waivers-20261124.md` | **P1 — prazo 29-30/11** |
| E2 | **99 — Vito** (2ª missão, serial) ou 94 | `agente/94-codeql-gate-baseline-s90` | `check-codeql-sarif.ts` diff-based + status Semgrep | P1 |
| E3 | **98 — Safira** | `agente/98-secrets-rotation-plan-s90` | Plano de rotação executável (dry-run) + inventário de segredos/ownership `src/lib/auth.ts`/`env.ts` | P2 — depende de decisão humana p/ execução |

Fila (após P1): 91 Terraform audit, 92 Helm audit, 95 observability audit, 93 compose reconciliation, 96 auth continuation, 97 RBAC coverage.

## 7. Governança operacional do squad

- **Ports:** faixa 22900-22999 para servidores efêmeros do squad (§4 estrutura usa `22000+NN*10` → squad 90 = 22900-22999; confirmado com a missão).
- **Proibido:** Docker TCP 2375, deploy, host real, push, PR, main; escrita em `integracao/onda-3-dem20261123` e worktrees `dem-20261123-*`.
- **Fluxo:** executor → coord/squad-90 (merge do coordenador) → SHA congelado → Agente 09 Silas → Astra.
- **Handoffs oficiais:** `.agents/handoffs/squad-90/` (recebidos) e `.agents/handoffs/onda-<n>/` (emitidos por especialistas, padrão `99-para-XX-*`).
- **Bancos efêmeros:** um schema/banco por squad se houver mutação (não previsto nesta fase — trabalho é docs/config/gates).

## 8. Critérios de sucesso desta onda do squad

1. ✅ Inventário consolidado de waivers/hotspots/CodeQL com datas e donos (este documento + fontes citadas).
2. ⏳ PR de poda Grupo C + espelho `effect` (E1) — evidência: diff `.trivyignore.yaml`/`AUDIT_WAIVERS.md`/`dependency-review.yml`/`ci.yml` + `trivy fs` limpo.
3. ⏳ Proposta formal de renovação Grupo A/B (com nova evidência de scan) submetida ao Astra até **28/11** — antecede o vencimento de 29/11 21h -03.
4. ⏳ Decisão de contingência de hotspots (renovar 14d vs despachar refatorações) escalada ao Astra com recomendação.
5. ⏳ Parecer Silas sobre cada SHA congelado antes de promoção.

---
*Hélio (90) — Squad 90 · DEM-20261123-001 · coord/squad-90*
