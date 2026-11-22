# 13 — DELTA DE PRESERVAÇÃO CONTROLADA 2026-11-22
**Agente 00 — Astra · Mandato do Orquestrador Humano · Escopo: somente documentação**

## 1. Contexto

Segunda onda de preservação documental. A primeira (PRs #479–#484, #489, #506) integrou os handoffs de continuidade e o `11-DELTA-VERIFICACAO-20261120.md`. Este delta registra a preservação dos artefatos locais remanescentes identificados no relatório delta de reconciliação (20/11 → 22/11).

## 2. Itens PRES (backlog)

| ID | Item | Estado | Evidência |
|---|---|---|---|
| PRES-001 | Preservação do pacote Etapa 0 (DEM-20261118-001 + matriz + INDEX/journal) | EM_PRESERVACAO | PR dedicado (branch `chore/00-preservacao-etapa-0-20261122`) |
| PRES-002 | Preservação dos handoffs históricos únicos remanescentes | EM_PRESERVACAO | PR dedicado (branch `chore/00-preservacao-handoffs-historicos-20261122`) |
| PRES-003 | Avaliação das duplicidades e variantes locais (`__D2`, `__2`, `onda-7__`, checklist gerado) | CLASSIFICADO | Seção 3 — nenhuma exclusão executada |
| PRES-004 | Avaliação de `release-readiness-audit-2026-11-18/` (proveniência externa) | CLASSIFICADO | Seção 4 — conteúdo pertence à Central de Auditoria; não copiado |
| PRES-005 | Reconciliação de worktrees com alterações não publicadas | PENDENTE | Worktrees stale/prunable inventariados; aguarda decisão de faxina do Orquestrador |

Relacionamento com backlog existente: complementa G-10/BG-GOV-LEGACY (artefatos de coordenação) e BM-P0 do Plano Mestre (`12-PLANO-MESTRE-OPERACIONAL-100-AGENTES.md`, PR #528). Não substitui IDs existentes.

## 3. Classificação dos artefatos não publicados (PRES-003)

| Arquivo | Classe | Nota |
|---|---|---|
| `03-para-00-auditoria-visual-a11y-2026-10-10__D2.md` | DUPLICADO_EXATO | idêntico ao versionado `03-para-00-auditoria-visual-a11y-2026-10-10.md` |
| `06-para-04-voice-trigger__2.md` | DUPLICADO_COM_DIVERGENCIAS | variante de download; original versionado em `onda-7/` |
| `onda-7__06-para-04-voice-trigger.md` | DUPLICADO_COM_DIVERGENCIAS | idem |
| `25-para-08-gitleaks-allowlist-atlasgr__D2.md` | DUPLICADO_COM_DIVERGENCIAS | variante de download; original versionado |
| `handoffs-2026-10-09-24.md` | DUPLICADO_EXATO | idêntico a `.agents/reviews/handoffs-2026-10-09-24.md` |
| `handoffs-2026-10-09-auditoria.json` | DUPLICADO_EXATO | idêntico a `.agents/reviews/handoffs-2026-10-09-auditoria.json` |
| `generate-handoffs-checklist.cjs` | DUPLICADO_EXATO | idêntico a `scripts/generate-handoffs-checklist.cjs` |
| `verify-handoffs-checklist.cjs` | DUPLICADO_COM_DIVERGENCIAS | difere de `scripts/verify-handoffs-checklist.cjs` |
| `checklist-handoffs.html` (375 KB) | ARQUIVO_TRANSITORIO | relatório gerado; regenerável via scripts/ |

**Nenhum arquivo foi excluído ou modificado.** A decisão de expurgo fica com o Orquestrador após homologação.

## 4. Proveniência externa (PRES-004)

`.agents/handoffs/release-readiness-audit-2026-11-18/` contém `auditoria/` (16 docs) + `handoffs/` (10+ docs) cujos nomes correspondem exatamente a `central/ondas/release-readiness-2026-11-18/` do repositório independente **Central-de-Auditoria-e-Handoffs**. A auditoria canônica já está versionada em `.agents/runs/audit-2026-11-18/` na `main`. **Decisão:** não copiar para o Birthub; a fonte de verdade operacional desses handoffs é a Central. Registrado como referência histórica — pendência de confirmação no repo da Central (que possui alterações não commitadas próprias, fora do escopo desta missão).

## 5. Evidências de segurança

- Varredura de padrões de segredos (chaves, tokens, PEM, AWS keys) nos 10 artefatos preservados: **0 ocorrências de valores**; o handoff `11-para-15` documenta apenas nomes de chaves e comprimentos de um `.env` externo — nenhum valor reproduzido.
- Nenhum arquivo de produção, CI, schema ou governança alterado. Escopo 100% documental.
