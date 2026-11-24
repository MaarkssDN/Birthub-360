# HANDOFF — 90 (Hélio) → 00 (Astra): Consolidação de pendências de segurança do Squad 90 com datas

**Data:** 2026-11-24 · **Demanda:** DEM-20261123-001 · **Branch:** `coord/squad-90` · **Worktree:** `wt-coord` (base `93e82c220`)
**Artefatos:** `.agents/runs/squads/squad-90-plano.md` (plano completo + cronograma) · `.agents/runs/squads/squad-90-evidencia-waivers-20261124.md` (verificação de staleness)

## Resumo executivo

1. **Vencimento duro 29-30/11:** 37 waivers Trivy (`expired_at: 2026-11-30`) + 11 exceções de hotspot (`Reavaliar até: 2026-11-30`; gate falha a partir de 29/11 21h -03). Sem ação, gates de PR voltam a falhar.
2. **Descoberta nova (2026-11-24):** verificação de staleness mostra `npm audit --audit-level=high` = **0 high/critical** e lockfile com versões corrigidas de quase todos os pacotes waivados (`deepmerge-ts@8.0.2`, `effect@3.22.5`, `dompurify@3.4.17`, `nodemailer@10.2.1`, `better-auth@1.7.14`). Os 40 IDs de `.trivyignore.yaml` estão provavelmente majoritariamente **obsoletos** — mas remoção exige `trivy fs` de confirmação (ferramenta indisponível no host do coordenador: binário bloqueado por App Control; Docker TCP 2375 proibido/inalcançável).
3. **Único waiver com motivo técnico confirmado:** `picomatch@4.0.7` (`<=4.0.7` sem patch upstream) — `expired_at` já é 17/12; proposta de renovação justificada se persistir no `trivy fs`.
4. **CodeQL:** 137 alertas (41 `error`) triados pelo Agente 99 (`docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`); nenhum explorável sem auth. Handoffs de remediação por domínio já emitidos (Squads 20/40/50/60/70). Pendente decisão: gate `security:codeql-sarif` diff-based vs absoluto.
5. **Decisões humanas bloqueantes (inalteradas, agora com dono sugerido):**
   - Repo público + secret scanning desligado → habilitar no GitHub; confirmar `BIRTHHUB360_WEBHOOK_SECRET` prod ≠ valor antigo (`9236028b`).
   - Cookie `Secure` em prod → env `SECURE_COOKIES=true`/`BETTER_AUTH_URL` https; **gap de ownership:** `src/lib/auth.ts` (arquivo) não coberto por `src/lib/auth/**` (96) nem tem dono na MATRIZ — sugiro atribuir ao 96 formalmente.
   - Rotação de segredos → procedimento pronto (`ROTACAO_SEGREDOS.md`); execução é irreversível → aguardando aval humano (Agente 98 prepara dry-run).
   - Hotspots: exceções são de arquivos de outros squads; contingência proposta pelo 99 = extensão única 14d (até 14/12) condicionada a branches de refatoração dos 5 maiores. **Decisão do Astra/humano.**
   - `effect` waiver (`GHSA-7589-6fvf-x4pw`): aprovado em `AUDIT_WAIVERS.md` mas sem espelho em `.trivyignore.yaml`/`allow-ghsas` — provavelmente moot se `effect@3.22.5` já corrigiu o achado; resolver junto da poda.

## Despacho proposto (fila do squad, máx. 3 executores)

- **E1 (P1, imediato):** Agente 99 — `trivy fs` com/sem ignorefile → poda de IDs obsoletos + renovação só dos persistentes, sincronizando `.trivyignore.yaml` + `AUDIT_WAIVERS.md` + `allow-ghsas` (`dependency-review.yml`, `ci.yml`) na mesma alteração. Branch `agente/99-trivy-poda-s90`, worktree `squads/squad-90/wt-99`.
- **E2 (P1):** Agente 99 ou 94 — `check-codeql-sarif.ts` diff-based + confirmação do finding Semgrep `bitrix.routes.ts:837` (FP funcional) e `reencrypt-credentials.ts` (provável já corrigido).
- **E3 (P2):** Agente 98 — plano de rotação executável (dry-run) + inventário de ownership `src/lib/auth.ts`/`env.ts`.

## Pedidos ao Astra

1. Aprovar/despachar E1 antes de **28/11** (antecede o vencimento de 29/11 21h -03).
2. Decidir contingência de hotspots (renovação 14d condicionada vs. cobrança dos squads donos 30/40/50/60/70).
3. Publicar na MATRIZ_PROPRIEDADE o dono de `src/lib/auth.ts`, `src/lib/env*.ts` e `.trivyignore.yaml` (hoje ambíguos/ausentes).
4. Encaminhar ao humano as 3 decisões de segurança (secret scanning, cookie Secure prod, rotação de segredos).

---
*Hélio (90) — Squad 90 · coord/squad-90*
