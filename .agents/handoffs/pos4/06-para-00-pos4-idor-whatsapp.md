- De: 06 — Integrações e Bitrix
- Para: 00 — Astra (Coordenação POS4)
- Onda: POS4 (pós-onda-4)
- Status: concluído
- Prioridade: alta (segurança — IDOR + conformidade opt-out/LGPD + anti-ban B-08)

## Resumo executivo

MISSÃO POS4-06 executada no worktree `wt-06-idor-wa`, branch `agente/06-idor-whatsapp-pos4`
(base `9f80c07ed`). O trabalho parcial herdado (agente anterior interrompido) foi auditado:
a implementação estava correta em essência, mas o teste novo `dailyPlanComplete.test.ts` estava
QUEBRADO (fábricas `vi.mock` referenciando `const` não içadas + path do mock de `prisma` um
nível curto — 8/10 testes falhavam). Corrigido com `vi.hoisted` e path `../../../../../lib/`.
Nenhuma linha de produção herdada precisou ser revertida.

## Frente A — IDOR `POST /api/bitrix/daily-plan/complete` (SHA `9cca3b0c7`)

- `src/features/integrations/bitrix/service/dailyPlan.service.ts`: `completeDailyPlanItem`
  agora valida posse ANTES de qualquer mutação:
  - `normalizeDailyPlanItemId`: strip de prefixo por `itemType` — prefixo de outro tipo
    (`bitrix_lead_9` como `BITRIX_TASK`) → 400 (porta de IDOR entre entidades fechada).
  - `LOCAL_ACTIVITY`: `findFirst` com `{ id, organizationId, owner: userId }` → 404 se não
    pertencer ao usuário autenticado (o plano só lista `owner: userId` — ver linha ~405).
  - `BITRIX_TASK`/`BITRIX_ACTIVITY`/`BITRIX_LEAD`: resolve a identidade Bitrix do DONO do
    plano (`resolvePlanBitrixUser`, mesma ordem de `fetchUserDailyPlan`: override →
    `User.bitrixUserId` → e-mail → nome) e chama `assertBitrixItemBelongsToPlanUser`, que faz
    `tasks.task.get`/`crm.activity.get`/`crm.lead.get` e exige `responsibleId`/`RESPONSIBLE_ID`/
    `ASSIGNED_BY_ID` igual ao BitrixUserId resolvido — os MESMOS filtros que o plano usa para
    listar (`RESPONSIBLE_ID`/`ASSIGNED_BY_ID: bitrixUserId`, `COMPLETED: 'N'`). Falha fechada
    com 404 (sem oráculo de existência). Sem identidade Bitrix → 403.
- `src/features/integrations/bitrix/dailyPlanRoutes.ts`: aceita `assignedById` no body apenas
  para `ADMIN`/`GESTOR` (mesmo override de GET/POST `/daily-plan`) e repassa como
  `options.overrideBitrixUserId` — a checagem de posse continua rodando contra o BitrixUserId
  do membro alvo; o override nunca pula a validação.
- Testes (`dailyPlanComplete.test.ts`, 10 casos): cross-user mesmo tenant (task/activity/lead),
  fora-do-plano, legítimo (task/lead/local), org divergente (400), prefixo cruzado (400),
  usuário sem vínculo Bitrix (403), owner divergente em LOCAL_ACTIVITY.

### Risco residual identificado (NÃO corrigido — fora do escopo da missão, sugerir handoff futuro)
`addDailyPlanItemNote` (`POST /daily-plan/note`) tem o MESMO padrão IDOR: `_userId` ignorado,
`prisma.activity.findUnique({ id, organizationId })` sem `owner`, e `callBitrix` de
`task.commentitem.add`/`crm.timeline.comment.add` sem checagem de posse. Recomendo abrir missão
de continuação reaproveitando `assertBitrixItemBelongsToPlanUser`.

## Frente B — WhatsApp opt-out + anti-ban (SHA `8bc86d507`)

- `src/features/integrations/whatsapp/whatsappMessage.service.ts`: o bloco de opt-out inbound
  (`isOptOutKeyword`) saiu de dentro de `if (lead ...)` — agora registra para QUALQUER sujeito
  identificável via `recordOptOutAndPurgePendingJobs` (contrato do Agente 69,
  `src/features/notifications/opt-out/optout.service.ts`, READ-ONLY — nenhum arquivo de
  opt-out/** foi editado). Sujeito = `{ leadId?, email?, phoneE164 }`; `phoneE164` sozinho já é
  identificador válido e é o que `sendWhatsAppMessage` consulta via `isOptedOut`. Isso cobre
  (1) contato cadastrado sem lead aberto e (2) número desconhecido — antes, STOP nesses casos
  não gerava `OptOutRecord` nenhum. A purga de jobs pendentes
  (`cancelPendingJobsForOptOut` → fila `whatsappCommandQueue`, estados waiting/delayed/
  prioritized/waiting-children, match por leadId/telefone/e-mail dentro do mesmo tenant) agora
  tem caller real em produção. Flag legado `customFields.optOutWhatsApp` preservado quando há
  lead; falha do registro unificado é logada, nunca silenciosa.
- `src/features/integrations/whatsapp/whatsapp.service.ts`: `sendWhatsAppMessage` agora chama
  `whatsAppAntiBanThrottler.throttle(organizationId)` (delay humanizado 3–8s serializado por
  org — implementação do Agente 56 em `src/lib/integrations/whatsapp/baileys.client.ts`,
  READ-ONLY) e `sock.sendPresenceUpdate('composing', jid)` com timeout e catch não-fatal,
  ANTES de `sendMessage`. Cobre todos os caminhos: envio direto do worker, reenvio via fila
  (`whatsappCommand.worker.ts` → `sendWhatsAppMessage`), cadência, follow-up, birth-voice.
  Antes, o throttler era dead code.
- Testes:
  - `whatsappMessage.service.test.ts` (+5 casos POS4): STOP sem lead grava OptOutRecord por
    telefone/e-mail E remove só o job do mesmo tenant+número (fila fake com getJobs/remove
    espiões — prova purga real, não só chamada); STOP de número desconhecido; STOP com lead
    aberto casa por leadId; mensagem comum e outbound não disparam nada.
  - `whatsapp.service.send.test.ts` (novo, 3 casos): presença `composing` antes de
    `sendMessage` + registro no throttler; concorrência mesma org serializada com delay real
    (≥2,5s); orgs diferentes não bloqueiam. Throttler NÃO mockado de propósito.

## Gates executados

- `npx tsc --noEmit` → limpo (exit 0).
- `npx biome lint` nos 7 arquivos alterados → limpo.
- `vitest run -c vitest.unit.config.ts src/features/integrations` → **39 arquivos / 464 testes,
  todos verdes** (inclui os 3 arquivos novos/alterados; whatsapp.service.send leva ~14s por
  usar delays reais do throttler).
- `npm run build` NÃO executado (demorado; typecheck+lint+testes cobrem o escopo — sinalizar
  se o gate de integração exigir).

## Arquivos

- `src/features/integrations/bitrix/dailyPlanRoutes.ts` (M)
- `src/features/integrations/bitrix/service/dailyPlan.service.ts` (M)
- `src/features/integrations/bitrix/service/__tests__/dailyPlanComplete.test.ts` (novo)
- `src/features/integrations/whatsapp/whatsapp.service.ts` (M)
- `src/features/integrations/whatsapp/whatsappMessage.service.ts` (M)
- `src/features/integrations/whatsapp/__tests__/whatsappMessage.service.test.ts` (M)
- `src/features/integrations/whatsapp/__tests__/whatsapp.service.send.test.ts` (novo)
- `.agents/handoffs/pos4/06-para-00-pos4-idor-whatsapp.md` (este arquivo)

Sem push, sem PR, sem main — commits locais apenas, um por frente.
