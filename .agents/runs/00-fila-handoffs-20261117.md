# Run — Agente 00 · Retomada da fila de handoffs — 2026-11-17

- **Base:** `main` @ `414a0ca5f` (limpa, sincronizada com origin/main)
- **Autorização:** usuário pediu inventário de handoffs pendentes e disparo dos agentes responsáveis.
- **Método:** varredura de `.agents/handoffs/**` por `Status: aberto|em-andamento`.

## Inventário

**~69 handoffs abertos/em-andamento** (excluídos: README-template e 1 já `resolvido`).

### Por agente destinatário

| Agente | Qtd | Observação |
|---|---|---|
| 00 (Coordenador) | 11 | Triagem própria — não despachável |
| 12 (Voz) | 8 | Maior cluster; vários podem estar stale (PR #372 voice aberto) |
| 01 (Plataforma/Dados) | 8 | Inclui 2 bloqueadores LGPD do 21 + chat-sessions tenant |
| 07 (IA) | 5 | + handoffs compartilhados 17-07, 15-07, 16-07 |
| 05 (Prospecção) | 5 | Inclui bloqueador tenancy outbound (12→05) |
| 04 (CRM/BI) | 5 | forecast, tenancy FKs, batchUpdate status |
| 08 (QA) | 4 | cobertura módulos, unit failures, schemathesis |
| 24 (Revisão) | 3 | revisões pendentes — dispara após PRs da onda |
| 17 (Cadência) | 3 | voicehub reativação, templates, orquestração |
| 02/03/06/09/10/13/14/15/16/21 | 1–2 cada | cauda |
| 01A | 2 | slot exclusivo com 01 — Wave B |

### Bloqueadores abertos

1. `00-para-10-docker-2375` — ação do operador no host (humano, não despachável).
2. `01-para-12-voicehub-adaptacao-modelos-canonicos` → Agente 12.
3. `05-para-01-chat-sessions-sem-coluna-tenant` → Agente 01.
4. `12-para-05-outbound-api-legado-tenancy` → Agente 05.
5. `21-para-01-dsr-canal-publico-lgpd` → Agente 01.

## Wave A — despacho (worktrees isolados)

Critério: maiores clusters + bloqueadores, propriedade disjunta.

| Agente | Worktree | Branch | Handoffs atribuídos |
|---|---|---|---|
| 01 | `Birthub-360-worktrees/agente-01-handoffs` | `agente/01-handoffs-20261117` | 8 diretos + `05-para-01-chat-sessions`, `15-para-01-ssrf`, `21-para-01` ×2, `08-para-01-findunique` (verificar se PR #378 já cobre) |
| 05 | `.../agente-05-handoffs` | `agente/05-handoffs-20261117` | 5 diretos + `12-para-05-outbound-tenancy`, `16-para-05-provider-cache` |
| 07 | `.../agente-07-handoffs` | `agente/07-handoffs-20261117` | 5 diretos + `02-para-07-intelligence-hub-tokens`, `15-para-07-webhook-fetch`, `15-para-07-commercial-mission`, `00-para-17-07-orquestracao` |
| 12 | `.../agente-12-handoffs` | `agente/12-handoffs-20261117` | 8 diretos + `24-para-12-attachauth`, `06-para-12-voice-hub-webhook`, `00-para-12-17-voicehub`, `00-para-12-voicehub-rls`, `01-para-12-voicehub-modelos` |

### Matriz de propriedade Wave A

- 01: `prisma/**`, `src/lib/queue/**` (produtores), rotas admin/dados. **NÃO** toca `src/lib/queue/**` se 07/16 conflitarem — 07 fica restrito a IA/automação fora de queue workers.
- 05: `src/**/prospect*`, `src/**/cold-email*`, rotas outbound/prospecção.
- 07: `src/lib/ai*`, `src/lib/llm*`, intelligence hub, automações — **sem** `src/lib/queue/**` (evita slot 16↔07).
- 12: `src/**/voice*`, `src/**/dialer*`, `src/**/telephony*`, componentes de voz.
- Todos: handoffs próprios em `.agents/handoffs/` apenas para atualizar status dos destinados a si; commits pequenos; `npx tsc --noEmit` + `npm run lint` antes de finalizar; push + PR ao final.
- 24 revisa cada PR antes de merge (regra §40).

## Wave B (após Wave A / slots livres)

04 (5), 13 (2), 17 (resto), 08 (4), 02, 03, 06, 09, 10, 14, 15, 16, 21, 01A (após 01), 24 (revisões). Destinatários 00: triagem própria.

## Riscos

- Muitos handoffs de ondas antigas (onda-2, techdebt-2026-09) podem estar **stale** — cada agente deve verificar contra `main` atual antes de implementar e marcar `resolvido`/`estale` com evidência.
- PRs abertos (#366 onda-6, #372 voice, #378 findUnique, #368 paleta) podem cobrir handoffs — verificar sobreposição antes de codar.
- `server.ts`, `package.json`, lockfile: exigem aprovação explícita do 00.

## Status

- [x] Inventário
- [ ] Worktrees criados
- [ ] Wave A despachada
- [ ] Wave B
- [ ] Revisões 24
- [ ] Integração

---
*Atualizações abaixo conforme a onda avança.*

## Atualização — 2026-11-17 (despacho)

- Worktrees criados em `C:\Github\Birthub-360-worktrees\` com `node_modules` por junction.
- Subagentes 01, 05, 07, 12 despachados em background (perfil `subagent_general`), instruídos a: (1) ler AGENTS.md + prompt do agente; (2) triar seus handoffs contra `main` (stale → marcar com evidência); (3) implementar os válidos; (4) `tsc --noEmit` + `lint`; (5) commit/push/PR.
- Resultados pendentes — registrar aqui ao concluir.

| Agente | Estado | PR | Parecer 24 |
|---|---|---|---|
| 01 | executando | — | — |
| 05 | executando | — | — |
| 07 | executando | — | — |
| 12 | executando | — | — |

## Handoffs do próprio 00 (11) — triagem rápida

- `00-para-00-estender-gate-prosa-aprovacao` — meta-processo; avaliar se ainda relevante.
- `00-para-01-02-settings-pilares`, `00-para-04-10-08-relatorios-forecast` — multi-destino; repassar na Wave B aos destinatários.
- `00-para-08-cobertura-testes-modulos` — **em-andamento**; escalado ao humano (gaps de produto) — manter.
- `00-para-10-docker-2375` — ação do operador; manter em-andamento.
- `00-para-12-17-voicehub-reactivacao` — repassado a 12/17.
- `00-para-16-warroom-sse-heartbeat` → Wave B (16).
- `00-para-17-07-orquestracao-sem-demo` → repassado a 07/17.
- `00-para-21-lgpd-portal-titular` → Wave B (21).
- `03-para-00-sonar-new-coverage`, `08-para-00-cobertura-modulos`, `15-para-00-rotacao-segredos`, `18-para-00-relatorio-conformidade`, `11-para-00-portais-estaticos`, `executor-f3-para-00`, `backlog-5/02-para-00` ×2, `techdebt/00-para-00` — fila de triagem do coordenador.
- `onda-4/08-para-00-visual-gate-branch-protection` — decisão de governança; pendente.
- `onda-3/16-para-00-outbox-idempotency` — impacta 16/06/07; avaliar na Wave B.
- `onda-paralela-8/00-para-07-duplicate-exports`, `00-para-08-unit-failures` → repassados.
- `onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real` → Wave B (10).
- `onda-forense-20261020/00-para-{06,09,12,15,17}-forense` → repassados aos destinatários.
- `onda-ia-1/15-para-14-avaliacao-pii` → Wave B (14).
- `onda-saneamento-20261105/00-para-13-modularizacao` → Wave B (13).
- `onda-saneamento-20261110/00-para-{01,01A,05,12}` → repassados.
- `onda-52/01-para-24`, `onda-3/01-para-24`, `onda-2/06-para-24`, `onda-2/24-para-03`, `onda-2/24-para-12` → revisões/confirmações.
- `onda-8/18-para-00-relatorio-conformidade-handoffs` — relatório de conformidade; pode estar stale.
- `15-para-07-commercial-mission-trace-consent-prisma` → 07 (schema → handoff 01 se necessário).
- `21-para-01-retencao-leads-landing-lgpd` → 01.
- `01-para-12-voicehub-adaptacao-modelos-canonicos` (bloqueador) → 12.
- `24-para-12-revisao-voicehub-adaptacao` → 12 (ciência + correções se necessário).
- `05-para-02-error-reports-login-quebrado`, `05-para-05-*` ×2 → Wave B.
- `12-para-05-outbound-api-legado-tenancy` (bloqueador) → 05.
- `15-para-02-03-sonar-new-coverage` → Wave B (02/03/15).
- `backlog-5/*` → Wave B conforme destinatário.
- `onda-02-ux/02-para-07-intelligence-hub-tokens` → 07.
- `onda-2/15-para-01-ssrf`, `15-para-07-webhook-fetch` → 01/07.
- `onda-3/16-para-05/06` → Wave B (05 já na Wave A — incluir; 06 Wave B).
- `onda-paralela-8/01a-para-04-*` ×2, `00-para-07-duplicate-exports`, `00-para-08-unit-failures` → Wave B.
- `onda-saneamento-20261110/17-para-01A-*` ×2 → Wave B (01A após 01).
- `onda-c0/11-para-00-portais-estaticos-marca-antiga` → triagem 00 (provável repasse ao 11).
- `onda-ia-1/15-para-14` → 14 Wave B.
- `techdebt-2026-09-29/00-para-00-arquivos-monoliticos-scripts` → triagem 00.
- `README.md` — falso positivo do grep (template).
- `onda-2/05-para-04-whatsapp-consolidado` — `Status: resolvido` no corpo (falso positivo do grep).
- `onda-3/01-para-24-revisao` — `em-andamento (aguardando revisão)` → fila do 24.
- `onda-52/01-para-24-typecheck-integrations` — parcialmente resolvido (integrações ok; parte IA do 07 aberta) → 24 revisa.
- `onda-4/08-para-00-visual-gate` — decisão pendente do 00.
- `onda-8/18-para-00-relatorio-conformidade` — triagem.
- `onda-c0/11-para-00` — triagem.
- `executor-f3-para-00` — triagem.
- `15-para-00-rotacao-segredos` — ação humana/operador; manter.
- `08-para-00-cobertura-modulos-gaps-produto` — escalado ao humano; manter.
- `03-para-00-sonar-new-coverage` — triagem.
- `backlog-5/02-para-00` ×2 — triagem.
- `onda-4/08-para-00-visual-gate-branch-protection` — decisão 00.
- `onda-3/16-para-00-outbox` — avaliar.
- `onda-8/18-para-00` — triagem.
- `onda-reconciliacao/00-para-10` → Wave B.
- `onda-forense 00-para-*` → repassados.
- `onda-saneamento-20261110 00-para-*` → repassados.
- `onda-saneamento-20261105 00-para-13` → Wave B.
- `onda-paralela-8 00-para-07/08` → repassados.
- `onda-ia-1/15-para-14` → Wave B.
- `onda-2/*-para-00` — não há; os `-para-00` já listados.
- `onda-52/01-para-24` → fila 24.
- `onda-3/01-para-24` → fila 24.
- `onda-2/06-para-24` → fila 24.
- `onda-2/24-para-03` → Wave B (03).
- `onda-2/24-para-12` → 12.
- `onda-3/00-para-12` → 12.
- `onda-2/06-para-12` → 12.
- `onda-2/15-para-01` → 01.
- `onda-2/15-para-07` → 07.
- `onda-2/05-para-04` → resolvido (falso positivo).
- `onda-3/16-para-05/06` → Wave B.
- `onda-3/16-para-00` → triagem.
- `onda-paralela-8/01a-para-04` ×2 → Wave B.
- `onda-paralela-8/00-para-07` → 07; `00-para-08` → Wave B.
- `onda-saneamento-20261105/05-para-17` → Wave B (17).
- `onda-saneamento-20261105/23-para-13` → Wave B (13).
- `onda-saneamento-20261110/17-para-01A` ×2 → Wave B.
- `onda-ia-1/15-para-14` → Wave B.
- `onda-forense-20261020/00-para-{06,09,12,15,17}` → repassados.
- `onda-02-ux/02-para-07` → 07.
- `backlog-5/*` → Wave B.
- `onda-4/08-para-00` → triagem.
- `onda-8/18-para-00` → triagem.
- `onda-c0/11-para-00` → triagem.
- `onda-reconciliacao/00-para-10` → Wave B.
- `onda-saneamento-20261110/00-para-12-hotspots` → 12.
- `techdebt/00-para-00` → triagem.
- `README` — falso positivo.
- `onda-2/05-para-04` — resolvido.

_Fim da triagem inline — detalhes nos handoffs._

## Atualização — 2026-11-17 (Wave A despachada)

- Worktrees: `C:\Github\Birthub-360-worktrees\agente-{01,05,07,12}-handoffs`, branches `agente/NN-handoffs-20261117` a partir de `main@414a0ca5f`, `node_modules` via junction.
- Missões enviadas com instrução explícita de triagem de staleness contra main (muitos handoffs são de ondas antigas), verificação de sobreposição com PRs abertos (#366, #372, #378, #368, #379), gates `tsc --noEmit` + `lint`, commits pequenos, push e PR.
- Subagentes rodam em background; resultados consolidados aqui ao término de cada um.

| Agente | Handoffs na missão | Estado |
|---|---|---|
| 01 | ~12 (8 diretos + 05/15/21/08 direcionados, menos findUnique se coberto por #378) | executando |
| 05 | ~7 (5 diretos + 12→05 tenancy + 16→05 cache) | executando |
| 07 | ~9 (5 diretos + 02/15/15/00 direcionados) | executando |
| 12 | ~9 (8 diretos + 24/06/00/00/01 direcionados) | executando |

_Pendentes de resultado._

## Wave B — fila após Wave A

Agentes: 02, 03, 04, 06, 08, 09, 10, 13, 14, 15, 16, 17, 21, 01A, 24 (revisões), 11 (portais estáticos via 00).

## Ação humana pendente (registrada)

- Rotação de segredos Docker 2375 no host (runbook existente).
- Decisão sobre gaps de produto AC-MKT-002/003 e SLA mesa-tratamento (handoff 08→00 permanece em-andamento).
- Validação de produto do consentimento LGPD da landing (docs mergeados no PR #215).
- Ownership de `nginx/**` na matriz de propriedade.
- `server.ts`/`package.json`/lockfile: aprovações explícitas conforme surgirem.
- **NOVO:** executar verificação com PostgreSQL descartável sob a role da aplicação (migrações/RLS) — sem Docker no host do agente; requer operador ou host com Docker (reportado pelo Agente 01 em 2026-11-18).

## Fechamento (a preencher)

- [ ] Pareceres 24 dos PRs da Wave A
- [ ] Gates de integração
- [ ] Atualização dos status dos handoffs resolvidos
- [ ] Relatório final da onda

---

## Atualização — 2026-11-17 (Wave A concluída)

| Agente | Estado | PR | Parecer 24 |
|---|---|---|---|
| 01 | concluído | #381 | pendente |
| 05 | concluído | #383 | pendente |
| 07 | concluído | #382 | pendente |
| 12 | concluído | #384 | pendente |

### Resultados Wave A

- **01 → PR #381**: SSRF IPv6 transition ranges (`ipv6.ts` + ssrfGuard/urlGuard, 143 testes), DSR público LGPD (`DataSubjectRequest` + migration RLS + endpoints públicos + rate limit), retenção de leads landing (worker cross-tenant), coluna `company` em chat_sessions/chat_messages (migration aditiva). Resolvidos como já-em-main: findUnique soft-delete (e0050ad63), resumo consumo IA. Handoffs de saída: `01-para-02` (páginas públicas DSR → Wave B/02); `01-para-05` absorvido pelo PR #383.
- **05 → PR #383**: bloqueador `12-para-05-outbound-api-legado-tenancy` resolvido via port do hardening revisado do PR #323 (requireTenantScope, filtros company, leadBelongsToCompany); prospect-admin company body; search-runs tenant scope; provider cache com tenant no key (`v2`); validação opt-out reconfirmada. Pendente: decisão `POST /db/query` → handoff `05-para-01-outbound-tenant-schema-decisao` (01/00).
- **07 → PR #382**: 3 handoffs confirmados já resolvidos em main (duplicate exports, safeFetch, consent trace); tokenização IntelligenceHub + contraste predictive scoring; roleplay demo encerrado. `tsc`/`lint`/372 testes verdes.
- **12 → PR #384**: 5 resolvidos (voicehub modelos já mergeado PR #339; attachAuth; webhook worker; revisão 24). Em-andamento: reativação voicehub (gate 503 decisão 00), teste RLS (spec criada, sem Docker), forense (aguarda 24), hotspots estúdio (implementação íntegra, aguarda 24 TAREFA-SANEAMENTO-008). Bug latente → `12-para-08-voicehub-persistence-runid-literal` (Wave B/08).

### Dependências de merge

- PR #381 (01) antes/junto do PR #383 (05) — `chat.routes` referencia coluna `company`.
- Pareceres 24 obrigatórios antes de merge (regra §40).

### Wave B — despacho (2026-11-18)

Matriz de propriedade publicada e isolamento por worktree estrito:
- **Agente 24** (Auditoria Independente): Workspace raiz / PRs #381, #382, #383, #384. Propriedade: `.agents/reviews/**`.
- **Agente 02** (Produto e UX): `C:\Github\Birthub-360-worktrees\agente-02-handoffs` (`agente/02-handoffs-20261117`). Propriedade: `src/pages/**`, `src/components/**` (fora de testes/infra).
- **Agente 04** (CRM e BI): `C:\Github\Birthub-360-worktrees\agente-04-handoffs` (`agente/04-handoffs-20261117`). Propriedade: `src/features/crm/**`, `src/features/commercial-intelligence/**` (fora de AI pura).
- **Agente 08** (QA e Release): `C:\Github\Birthub-360-worktrees\agente-08-handoffs` (`agente/08-handoffs-20261117`). Propriedade: `tests/**`, `.github/workflows/**` (em conjunto com 00/10).
- **Agente 13** (Enxame de Agentes): `C:\Github\Birthub-360-worktrees\agente-13-handoffs` (`agente/13-handoffs-20261117`). Propriedade: `src/lib/agents/**`.
- **Agente 17** (Cadência Multicanal): `C:\Github\Birthub-360-worktrees\agente-17-handoffs` (`agente/17-handoffs-20261117`). Propriedade: `src/features/cadence/**`, `src/services/cadence/**`.
- **Agente 01A** (RLS e Retenção): `C:\Github\Birthub-360-worktrees\agente-01A-handoffs` (`agente/01A-handoffs-20261117`). Propriedade: auditoria de RLS, retenção e sanitização de banco.

| Agente | Estado | PR | Parecer 24 |
|---|---|---|---|
| 24 | concluído (10 PRs auditados) | — | APROVADO (todos) |
| 02 | concluído | #385 | APROVADO |
| 04 | concluído | #390 | APROVADO |
| 08 | concluído | #386 | APROVADO |
| 13 | concluído | #388 | APROVADO |
| 17 | concluído | #389 | APROVADO |
| 01A | concluído | #387 | APROVADO |


## Atualização — 2026-11-18 (Wave B concluída + Wave C despachada)

### Wave B — resultados

| Agente | PR | Resumo |
|---|---|---|
| 02 | #385 | Páginas públicas DSR `/privacidade/dsr/*` (verify, status, form) + 10 testes; error-reports-login triado como obsoleto |
| 04 | #390 | batchUpdate status label, tenancy FKs CRM, contraste analytics; novo handoff `04-para-03` (command palette no-op) |
| 08 | #386 | unit-failures resolvido c/ evidência CI; schemathesis → handoff p/ 08A (workflow); voicehub runid literal corrigido |
| 13 | #388 | Todos os 9 handoffs já resolvidos (supervisor 191 linhas, agent-bus policy); PR pré-existente atualizado |
| 17 | #389 | Triagem: todos resolvidos; 2 handoffs multicanal em-andamento aguardam 02/08/12/01 |
| 01A | #387 | Todos resolvidos (optout paginação, FK RESTRICT 22 constraints); novo handoff `01A-para-17` (InMemoryOptOutRepository limit=200) |

**Incidente registrado:** sessão concorrente detectada pelo Agente 04 — outra execução trabalhou no mesmo worktree `agente-04-handoffs` (commits de MaarkssDN, resoluções datadas 2026-11-18). Estado final coerente, mas Agente 24 deve verificar o diff completo do PR #390.

### Wave C — despachada (background)

Agentes 03, 06, 09, 10, 14, 15, 16, 21 — worktrees `agente-NN-handoffs` @ `f8d4bc76d` (= origin/main). Handoffs atribuídos conforme cauda do inventário + forenses.

### Fila de revisão 24 (após Wave C)

PRs pendentes de parecer: #381, #382, #383, #384, #385, #386, #387, #388, #389, #390 (+ PRs da Wave C).
Ordem de merge sugerida: #381 → #383 (dependência coluna `company`) → demais por ordem de revisão.

## Atualização — 2026-11-18 (relatório final Agente 01/01A — triagem Prisma/migrations/CRM)

- **PR #378** supersedido por `e0050ad63` e `94b82eefd` (já em `main`): seleções parciais preservam registros vivos + filtro de soft delete.
- **PR #387** (01A): documenta duas correções já integradas; opt-outs completos no Prisma; migração com 22 FKs `RESTRICT` confirmada. Limite implícito de 200 em `InMemoryOptOutRepository` segue coberto pelo **PR #389**.
- **PR #390**: confirmado na `main` o problema de `batchUpdateLeads` fora do fluxo de fechamento/sync de estágio. Verificação do head `54b117f53`: o patch escreve status via `updateLeadStatus` (gate CYC-007 + pipeline + histórico + Bitrix) **antes** de owner/tags — falha na segunda escrita persiste o status e conta o item em `failedCount`. Trade-off de atomicidade **documentado no próprio código** ("Nota de atomicidade"); na `main` era escrita única. Parecer 24 (`.agents/reviews/24-revisao-pr390-agente04-handoffs.md`) aprovou o head mas **não opina explicitamente sobre essa nota** → pendente adendo do 24 ou aceite formal do trade-off pelo 00 antes do merge.
- **Validação local do 01:** 41/41 testes direcionados, `prisma validate` OK, 156 migrações no check estático.
- **Pendente — verificação com PostgreSQL descartável sob a role da aplicação:** BLOQUEADO neste host (sem `docker`/`psql`/`postgres`). Requer operador ou host com Docker — registrar como ação humana.
- **Working tree:** `src/components/layout/moduleRegistry.ts` e `moduleThemes.ts` modificados sem commit (não pertencem a esta triagem — não tocar); reviews 24 e este run file ainda untracked.

### Decisões do 00 (2026-11-18, aprovadas pelo usuário)

1. **PR #390:** exigir **adendo do Agente 24** sobre a nota de atomicidade do `batchUpdateLeads` antes do merge → handoff `.agents/handoffs/00-para-24-adendo-pr390-atomicidade-batchupdate.md` (status: aberto).
2. **PostgreSQL descartável sob role da aplicação:** **escalado ao operador** — sem Docker/psql neste host; merges de schema/RLS seguem baseados em testes unitários + check estático até execução pelo operador.
3. **Ordem de merge:** #381 → #383 (dependência coluna `company`) → #385, #386, #387, #388, #389; **#390 somente após adendo do 24**.

---

## Wave D + Wave E + triagem do coordenador (2026-11-19, continuação)

### Wave D — handoffs gerados pela onda anterior

| Item | Dono | Resultado |
|---|---|---|
| IPv4-mapeado não-canônico (SSRF) | 01 | PR #436 — `embeddedIpv4FromIpv6` byte-level; 154 testes; **24 APROVOU** |
| Command Palette open-create/no-op | 03 | PR #438 (docs) — auditoria: nenhuma ação no-op restante; handoffs fechados |
| PII encoding bypass + safeFetch | 07 | PR #441 — `encoding.ts` anti-bypass; safeFetch já estava resolvido em main; **24 APROVADO-COM-RESSALVAS** (ressalva → novo handoff 00→07 para `piiDetection.service.ts`) |
| Chat tenant / optout list / cadence | 05/17 | Verificado: já resolvidos em main pelos merges #383/#416 |

Revisão independente do 24 publicada no PR #443.

### Wave E — outbox `idempotencyKey` (handoff 16→00)

Decisão de contrato do 00: chave determinística `dominio:{entityId}`, nunca randomUUID.
Todos os produtores do inventário cobertos:

- #444 (17 cadência, 8 call sites) · #445 (04 CRM/BI + market-intelligence) · #447 (07 IA/automações/knowledge, 9 call sites) · #448 (06 integrations, 4 call sites) · #450 (12 voz, 5 call sites) · #451 (09 mobile, 2 call sites) · #452 (10 runtime resilience) · #453 (02 gamification, 5 call sites)
- Handoff 16→00 permanece `em-andamento` até os PRs mergearem (cada agente atualizou sua seção).

### Triagem do coordenador

- **Visual gate branch protection: RESOLVIDO** — required checks de `main` agora `Visual Regression Gate` + `Central Birth Hub 360 / application gate` (antes: `Visual Regression`, que ficava skipped fora de escopo).
- **Visual-baseline non-FF: RESOLVIDO em código** — PR #442 (fetch + `--force-with-lease`).
- **Release-readiness audit: RESOLVIDO** — parecer 24 já existia; pendências do parecer registradas no handoff (omissões do inventário, GO-LIVE checklist, renovações de exceções/waivers até 2026-11-30).
- **Ação humana pendente**: Docker 2375 sem auth (`00-para-10-docker-2375`) + rotação de segredos devstack (`15-para-00-rotacao-segredos-devstack-2375`) — exigem acesso ao host 192.168.0.116 e estações; não resolúveis por código.
- **Decisão de produto pendente**: War Room executivo vs arena, Win/Loss autopsy estatístico, escopo demo/orquestração (`00-para-17-07-orquestracao-sem-demo` itens 02/08).
- **Próxima onda candidata**: scanner real (`00-para-10-scanner-seguranca-real` + `10-para-15-scanner-seguranca-real`) e gate de prosa do ownership (`00-para-00-estender-gate-prosa-aprovacao`).

### Estado dos PRs

Aguardando CI: #386 (schemathesis corrigido), #433 (triagem docs), #436/#441/#442/#443 (waveD), #444-#453 (waveE). Backlog de PRs de outras sessões também aberto (#353-#431) — merge em ordem de dependência após checks verdes.
