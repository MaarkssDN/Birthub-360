# Parecer Silas (09) — Fechamento da Fase 2 · Auditoria de Governança e Integrações

- **Missão**: DEM-20261123-001 — parecer final de fechamento da fase 2 (deliberação do Orquestrador Humano, 2026-11-25)
- **Data**: 2026-11-25
- **Auditor**: Agente 09 — Silas (auditoria independente, read-only + este parecer)
- **Escopo auditado**: `integracao/onda-3-dem20261123` @ `fedf4d1681` (convergiu com main em `9a3c2182b2`); docs de governança `.agents/runs/governanca-condicoes-fase2-20261125.md`, `.agents/runs/proposta-ownership-orfaos-20261125.md`, `.agents/handoffs/squad-100/00-para-100-catarina-diagnostico-ci-20261125.md`; estado de `origin/main` @ `9a3c2182b2`.
- **Método**: `git merge-base --is-ancestor`, `git log --merges --ancestry-path`, `git grep` em `src/`/`tests/`, leitura direta da MATRIZ_PROPRIEDADE.md e dos pareceres, `git show origin/main:...` para o teste de CI.

---

## Veredito: **GOBERNANÇA-FECHADA** — com pendências residuais registradas (nenhuma violação de condição detectada)

A fase 2 pode ser considerada fechada do ponto de vista de governança e integridade: todas as 9 entregas promovidas têm parecer Silas vigente e merge real na branch de integração; as condições C-1..C-4 registradas correspondem a pareceres e handoffs reais; nenhuma condição foi violada por código novo; a proposta de ownership é factual e não contradiz a MATRIZ; o diagnóstico de CI entregue ao Squad 100 é exato. As pendências abaixo são **por desenho** (condições vigentes, conflitos para deliberação humana, CI quebrado em main, WIP aguardando auditoria própria) — permanecem abertas e roteadas, não bloqueiam o fechamento da fase.

---

## 1. Integridade — pareceres e merges ✔

### 1.1 Pareceres referenciados — todos existem e contêm veredito aprovador

| Agente | Parecer | Veredito |
|---|---|---|
| 24 Ivo | `.agents/reviews/squad-20-24-ivo-resilience-20261124.md` | APROVADO-COM-CONDICAÇÃO |
| 32 Ema | `.agents/reviews/squad-30-32-ema-ui-states-20261124.md` | APROVADO-COM-CONDICAO |
| 48 Jade | `.agents/reviews/squad-40-48-jade-dedup-20261124.md` | APROVADO |
| 55 Ícaro | `.agents/reviews/squad-50-55-icaro-email-20261124.md` | APROVADO-COM-CONDICAO |
| 58 Elisa | `.agents/reviews/squad-50-58-elisa-enrichment-20261124.md` | APROVADO |
| 64 Tito | `.agents/reviews/squad-60-64-tito-voice-commands-20261124.md` | APROVADO |
| 67 Teca | `.agents/reviews/squad-60-67-teca-templates-pii-r2-20261124.md` | APROVADO-COM-CONDICAO (r2; r1 foi REPROVADO — histórico coerente) |
| 84 Pia | `.agents/reviews/squad-80-84-pia-deeplinks-20261124.md` | APROVADO |
| 93 Max | `.agents/reviews/squad-90-93-max-docker-hardening-20261124.md` | APROVADO |

Nota: o parecer r2 do 67 referencia SHA auditado `047de6f4ca` — confere com o doc de governança C-1.

### 1.2 Merges de promoção — todos verificados por ancestralidade

`git merge-base --is-ancestor <branch> integracao/onda-3-dem20261123` = verdadeiro para as 9 branches de entrega:

- `agente/24-resilience-dlq-s20` @ `ac0fcd22e3` — merges `c428f4e569` (integração) + `0424817bb4` (promoção squad-20)
- `agente/32-ui-states-s30` @ `0b56f69d56` — `1f991025cd` + `1e065cf924`
- `agente/48-crm-dedup-s40` @ `ed5742f00e` — `3f11dfeb26` + `c7d082e412`
- `agente/55-email-connectors-s50` @ `22bdd094fd` — `1c028513ab` + `4becb4cd23`
- `agente/58-enrichment-erp-s50` @ `f501e86759` — `e9d5f5f054` + `305ab27c36`
- `agente/64-voice-commands-s60` @ `f960286acc` — `bb4c5df15b` + `50e9531bde`
- `agente/67-templates-pii-s60` @ `0fd493d93f` — `844249c44b` + `921f0ec67b`
- `agente/84-deeplinks-s80` @ `e373a760ad` — `5316eb021c` + `6c202b182f`
- `agente/93-docker-hardening-s90` @ `c14faef15c` — `fc0a77332e` + `d44b36bd0b`

Os artefatos entregues estão fisicamente presentes na árvore de `fedf4d1681` (verificado arquivo a arquivo: `withRetry.ts`, `dedup.service.ts`, `outboundEmailLog.ts`, `emailReply.webhook.ts`, `deeplinks/handler.ts`, `sanitizer.ts`, `rawEmailParser.ts`, `inboundAdapter.ts`, `voice-command-executor.service.ts`).

### 1.3 Condições C-1..C-4 correspondem a registros reais ✔

- C-1 → parecer r2 do 67 (ACH-03 verificado no próprio documento, §parecer linha 44-65).
- C-2 → achado adjacente do parecer do 64; confirmado no código (ver §2.2).
- C-3 → fundações sem caller — conferidas uma a uma (ver §2.3); handoffs do Ícaro existem (`55-para-00-mailer-ownership-outbound-wiring.md`, `55-para-20-inbound-email-imap-worker.md`, `55-para-60-fronteira-canal-email.md`).
- C-4 → itens pontuais verificados: `src/lib/resilience/retry.ts` existe e é órfão; `src/lib/queue/dlq/` **não existe** (reservado/vazio conforme dito); `src/lib/queue/AGENTS.md` diz "Dono: Agente 16" enquanto a MATRIZ dá `src/lib/queue/**`→23 e `dlq/**`→24 — divergência real; `src/lib/integrations/erp/cnpj.service.ts` sem importador de produção; `upsertOmieCustomer` é chamado por `omie.routes.ts` (montado em `bootstrap/routes.ts`) — o item C-4 é defeito de lógica (createdAt fabricado, faultcode ignorado), não órfão, coerente com o texto; `StaleDataIndicator`/`OperationalStateContainer` existem.

---

## 2. Verificação de não-violação das condições ✔

### 2.1 C-1 — Sanitizer PII sem consumidor HTML

`git grep` por `templates/sanitizer`, `notifications/templates`, `sanitizeTemplate*` em `src/` e `tests/`: **zero imports de produção**. Únicas referências: `tests/unit/features/notifications/templates/sanitizer.test.ts` e uma menção em `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`. Nenhum canal HTML (e-mail, renderização) o consome. **Condição respeitada.**

### 2.2 C-2 — Voice legado/risco B-07 não foi wired

- `handleTransferCall` em `src/features/voice/voice-command-executor.service.ts` (~linhas 340-352) **permanece** retornando `executed:true, verified:true` sem persistência — o risco latente continua documentado e **não corrigido**, exatamente como a condição exige antes de qualquer fiação.
- Nenhum arquivo fora de `src/features/voice/` importa `features/voice`, `features/ai-voice` ou `voice-command-executor` (o barrel `index.ts` também não tem consumidor externo).
- Imports de `lib/voice-runtime/**` por `lib/voice-hub/**` (ex.: `ai.controller.ts` → `LLMGateway`) existem, mas datam de `2026-09-24` (`eb4c19a3d3`, staging import) — **dívida pré-existente**, não fiação nova da fase 2. Registro como contexto, não como violação.

### 2.3 C-3 — Fundações sem caller não foram conectadas sem handoff

| Fundação | Callers de produção encontrados |
|---|---|
| `withRetry` (`src/lib/resilience/withRetry.ts`) | Nenhum — só `tests/unit/lib/resilience/withRetry.test.ts` |
| `detectScoredDuplicates`/`planContactMerge` (`dedup.service.ts`) | Nenhum — só teste do próprio módulo e `tests/unit/onda4And5Complete.test.tsx` |
| `recordOutboundEmailMessage` (`outboundEmailLog.ts`) | Nenhum — só auto-referência no módulo |
| `ingestInboundEmailReply` | Consumido por `emailReply.webhook.ts`, cuja rota `/api/webhooks/email` está montada em `src/bootstrap/webhooks.ts` desde **antes** da entrega (stub CYC-003, onda 26); o commit do Ícaro `19866914a7` declara "wiring via handoff" e criou 3 handoffs formais — **conforme a regra do primeiro consumidor** |
| `rawEmailParser`/`inboundAdapter` | Apenas dentro do próprio cluster email do Ícaro |
| Deep link handler (`src/mobile/deeplinks/handler.ts`) | Zero referências fora do diretório — não wired (C-4 já registra pendência de `appUrlOpen`) |

**Nenhuma fundação foi tratada como funcionalidade entregue sem caller comprovado.**

---

## 3. Proposta de ownership × MATRIZ_PROPRIEDADE.md ✔

Conferi cada path proposto como "órfão" contra `.agents/MATRIZ_PROPRIEDADE.md` (revisão 2026-11-24) e o disco:

- **Realmente sem dono na matriz** (proposta válida): `src/lib/email/**`, `src/services/**` (incl. `src/services/cadence/**`; `src/services/email` não existe — a proposta já era condicional), `src/features/voice/**`, `src/features/ai-voice/**`, `src/lib/voice-runtime/**`, `src/features/crm/{application,routes,jobs}/**`, overlays `docker-compose.{services,opensource,postgres-local,qdrant}.yml` e `docker/**` (matriz só cobre `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**`). Todos os diretórios existem.
- **Não reivindicados indevidamente**: paths com dono foram explicitamente marcados como "já atribuído/sem mudança" (`src/lib/voice-hub/**`→60, `src/lib/queue/dlq/**`→24) ou tratados como conflito para deliberação humana (§3 crm routes/jobs, §7 prospecting 05×43, §9 whatsapp 56×60, §1 contrato sendEmail). Correto.
- **Divergências reais confirmadas**: `src/features/prospecting/AGENTS.md` declara "Dono: Agente 05" enquanto a matriz dá `src/features/prospecting/**`→43; `src/lib/queue/AGENTS.md` declara dono=16 vs matriz 23/24.
- **Ressalva de atualização (não bloqueante)**: §8 da proposta (exceção `src/bootstrap/routes.ts`→22 e `src/api/**` reservado) **já está refletido** na revisão 2026-11-24 da matriz — o item pode ser considerado resolvido na próxima deliberação.

---

## 4. Handoff CI × realidade em origin/main ✔

Diagnóstico do handoff `00-para-100-catarina-diagnostico-ci-20261125.md` **verificado literalmente**:

- `origin/main` = `9a3c2182b2` (idêntico ao SHA auditado).
- `tests/integration/prospecting-rls.test.ts`: `hardDeleteOrgData` definida na linha 55; **`await tx.$executeRaw\`DELETE FROM "AuditLog" WHERE "tenantId" = ${organizationId}\`;` está exatamente na linha 70**, dentro de `withRlsContext`/`asTenant` — ou seja, o DELETE executa de verdade e bate no trigger append-only. Causa raiz, local e mecânica (no-op silencioso anterior por bypass) descritos no handoff são precisos.
- A decisão de design pendente (opções 1-3, recomendação = orgs únicas por run) é tecnicamente correta: AuditLog é append-only por trigger, DELETE não funcionará.

---

## 5. Pendências residuais (permanecem abertas — não são falhas desta auditoria)

1. **Condições C-1..C-4 VIGENTES**: sanitizer continua proibido em canal HTML até decodificação de entidades + regressões; `handleTransferCall` continua sem persistência e `features/voice|ai-voice|voice-runtime` proibidos de fiação; regra do primeiro consumidor ativa para todas as fundações listadas; itens C-4 roteados mas não executados (retry.ts→26, dlq 23+24, queue/AGENTS.md→20/90, cnpj.service→Squad 50, upsertOmieCustomer→Squad 50, aria em OperationalStateContainer/EmptyState→33, StaleDataIndicator, deep links 80/81, credenciais docker/langfuse→93/98, runbook P0-07 inexistente→docs/Agente 08).
2. **Ownership**: proposta é PROPOSTA — aguarda deliberação humana nos 5 conflitos explícitos (ai-voice 63×74, crm routes/jobs 22/23×40, prospecting 43×05, sendEmail 55×consumidores, catch-all `src/services/**`).
3. **CI em main QUEBRADO**: `prospecting-rls.test.ts:70` DELETE em AuditLog append-only (handoff ao Squad 100 entregue e verificado); steps E2E/smoke com falhas possivelmente independentes (TypeError `IncomingMessage.query` — investigar versão Node/Express).
4. **WIP aguardando auditoria própria** (não fazem parte das 9 promoções): commits não mergeados em `agente/44-cadence-contracts-s40` (`bc8fe20660`, docs órfãos — verificado NOT merged), `agente/42-stage-transitions-s40` (`d2b7bcfcac`) e `agente/96-sessions-cookies-s90` (`40b64db23e`) — ambos NOT merged em integracao; branches `agente/42-crm-kanban-onda3`, `agente/44-cadence-onda3`, `agente/96-auth-onda3` já mergeadas.
5. **Nota operacional (worktree wt-00-integracao)**: os 3 docs de governança de `fedf4d1681` aparecem como deleção staged + untracked no `git status` local (artefato de índice/CRLF); conteúdo em disco intacto e idêntico ao commit. Recomendo `git add`/`git reset` de saneamento antes de qualquer commit futuro nessa worktree — não afeta o conteúdo versionado.

---

## 6. Conclusão

Fechamento da fase 2 **ratificado**: integridade de merges e pareceres confirmada, zero violações das condições de governança, proposta de ownership factual, diagnóstico de CI exato. O estado "VIGENTE" das condições C-1..C-4 é o comportamento esperado — são guarda-corpos para a fase 3, não pendências de auditoria. Recomendo ao Orquestrador Humano: (a) submeter a proposta de ownership à deliberação; (b) priorizar o handoff CI ao Squad 100 (main está vermelho); (c) agendar auditoria própria dos WIPs 42/44/96 antes de qualquer promoção.

Este parecer não autoriza merge/push/deploy. Auditoria executada sem alteração de código de produção.
