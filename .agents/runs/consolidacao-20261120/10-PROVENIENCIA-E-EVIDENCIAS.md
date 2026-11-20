# 10 — PROVENIÊNCIA E EVIDÊNCIAS
**Rastreabilidade do que é fato verificado vs. relato.**

## Níveis de confiança usados

- **VERIFICADO**: confirmado nesta consolidação via `git`/`gh`/leitura de arquivo em `origin/main` (`5174664b2`, 2026-11-20).
- **REPORTADO**: evidência de agente/subagente/relatório — plausível, não reverificada.
- **PENDENTE**: informação que precisa ser recuperada ou decidida.

## Fontes primárias

| Fonte | Tipo | Confiança | Uso |
|---|---|---|---|
| `git log origin/main` + `gh pr list/view` | ao vivo | VERIFICADO | Estados de PRs, merges, main HEAD |
| `.agents/handoffs/**` (511 resolvidos / ~36 abertos) | repositório | VERIFICADO (contagem) | Backlog, status de handoffs |
| `.agents/reviews/24-revisao-release-readiness-audit-2026-11-18.md` | repositório | VERIFICADO | Veredito NO-GO, omissões, checklist |
| `.agents/reviews/waveE-outbox-idempotency-24.md` (PR #460) | repositório | REPORTADO pelo revisor | Pareceres Wave E |
| `.agents/runs/00-memoria-operacional-central-20261119.md` | repositório (**untracked**) | REPORTADO | Decisões UX, perfis 02A–02D, riscos |
| `.agents/runs/audit-2026-11-18/*` | repositório | VERIFICADO (existência) | Auditoria forense NO-GO |
| Relatórios de subagentes Waves D/E (11 agentes) | conversa | REPORTADO | Escopo, chaves, testes de cada PR |
| Conversas anteriores (ondas 1–6, forense, UX) | **não recebidas** | PENDENTE | Handoffs/runs no repo são a única evidência |

## Evidências-chave por entrega

| Entrega | Evidência |
|---|---|
| Outbox idempotency | `idempotencyKey` como 2º arg em 34 arquivos; UNIQUE parcial `(organizationId, idempotencyKey)` em `prismaOutbox.repository.ts` + migration `20261020210000`; dedup em `inMemory.ts:17-27` |
| DSR | migration `20261117231500`, `dsrRequest.*`, páginas `/privacidade/dsr/*`, teste integração 5/5 |
| SSRF | `ipv6.ts` `embeddedIpv4FromIpv6` bytes 10–11 = 0xffff; testes 154/154 |
| Guardrails PII | `src/lib/ai/guardrails/encoding.ts` — decodeTextEscapes/findEncodedTokenSpans; 85/85 unit |
| Release NO-GO | `release-readiness-audit-state.json` + parecer 24 (12/12 achados confirmados) |

## Lacunas declaradas

1. Relatórios das conversas C e D **não foram fornecidos** — backlog cobre os artefatos, não as narrativas.
2. Estado de #435/#440 vs. DEBT-0002/0003: **não verificado** se fecham os P0.
3. Se o roster 100-agentes substitui totalmente o legado: **decisão pendente**.
4. `git stash@{0}` na working tree: conteúdo não identificado.
5. Worktrees locais: não inventariados um a um (branches pushed = seguros).

## Divergências preservadas

- Roster de agentes (legado × novo) — ambas as versões documentadas em `03-MATRIZ-AGENTES.md`.
- Memória operacional: doc-fonte (sessão B) × este consolidado (sessão A) — reconciliados; doc-fonte deve ser commitado.
- PR #458 (fechado) × #454 (mergeado): mesmo fix de formato — #454 é o estado efetivo.
