# Handoff 69 → 00 — Relatório ONDA4-69-OPTOUT (Opt-Out e Conformidade LGPD)

De: 69 — Eli (Opt-Out e Conformidade de Canal)
Para: 00 — Coordenador
Onda: 4 (ONDA4-69-OPTOUT)
Status: resolvido (com handoffs abertos para 56 e 17)
Prioridade: alto
SHA: `5c0677858` em `agente/69-optout-onda4` (base `32d07c375`)
Runtime: Devin (subagente), worktree `wt-69-optout`

## Escopo executado

AUDITAR → REPRODUZIR → CORRIGIR → TESTAR → COMPROVAR → COMMITAR. Somente arquivos de
`src/features/notifications/opt-out/**` foram editados; nenhum conector de outro dono foi tocado.

## Achados da auditoria

### Corrigidos nesta entrega (propriedade 69)

1. **Purga incompleta de estados BullMQ** — `cancelPendingJobsForOptOut` consultava apenas
   `['waiting','delayed']`. No BullMQ v6 (`bullmq@^6.3.2`, `JobState = … | 'prioritized' |
   'waiting-children'`), jobs priorizados e jobs bloqueados por filhos pendentes **escapavam da
   supressão** — exatamente os envios mais próximos do disparo. Corrigido para os 4 estados.
2. **Race condition abortava a purga inteira** — um único `try/catch` envolvia o loop; se
   `job.remove()` rejeitasse (job transitou p/ `active` entre `getJobs` e `remove` — race real
   de revogação) ou um payload fosse malformado, os jobs seguintes que também casavam com o
   opt-out **nunca eram avaliados**. Agora há try/catch por job + extração defensiva de campos.
3. **Fila nula maltratada** — `whatsappCommandQueue` é `null` quando `ENABLE_QUEUES=false`; o
   default `as Queue<any>` gerava TypeError engolido como erro genérico. Agora retorna purga
   vazia com WARN explícito (o opt-out registrado segue bloqueando nos gates de envio).

Arquivo: `src/features/notifications/opt-out/optout.service.ts`
Teste novo: `src/features/notifications/opt-out/__tests__/optout.service.test.ts` (6 casos)

### Verificado como correto (auditoria, sem alteração)

- **Gate de envio WhatsApp**: `sendWhatsAppMessage` consulta `isOptedOut` (OptOutRecord
  unificado) imediatamente antes do envio real (`whatsapp.service.ts:435-455`), inclusive para
  jobs vindos do worker (`fromWorker`).
- **Gate de cadência**: `CadenceDispatchers` chama `checkOptOutStatus` por canal antes de cada
  disparo (linhas ~199, ~323, ~435).
- **Cold e-mail**: `cold-email.service.ts` exige `organizationId` e consulta `isOptedOut` antes
  de qualquer envio SMTP.
- **Persistência/tenancy**: `OptOutRecord` (schema Prisma, dono 01) tem `organizationId` +
  índices; `PrismaOptOutRepository.findMatches` filtra por tenant; `checkOptOutStatus` valida
  `contact.organizationId` e bloqueia contato de outro tenant/ananonimizado (LGPD Art. 18).
- **Descadastro multicanal**: `isOptOutKeyword` cobre SAIR/STOP/CANCELAR/DESCADASTRO etc.;
  WhatsApp inbound grava flag legada + `OptOutRecord` scope `global`; e-mail reply idem.
- **Notificações in-app** (`notification.service.ts`): sino interno, não é canal comercial
  externo — opt-out não se aplica.

### Handoffs abertos (fora da minha propriedade)

- **69 → 56** (`.agents/handoffs/onda4/69-para-56-whatsapp-optout-purge.md`, prioridade alto):
  o caminho STOP inbound (`whatsappMessage.service.ts:178-211`) registra o opt-out mas **nunca
  chama a purga de fila** — `recordOptOutAndPurgePendingJobs`/`cancelPendingJobsForOptOut` não
  têm nenhum caller em produção (só testes). Jobs `send` pendentes na `whatsapp-command`
  continuam sendo suprimidos no envio pelo gate `isOptedOut`, mas a purga projetada não ocorre.
  Inclui race residual check-then-send documentada.
- **69 → 17** (`.agents/handoffs/onda4/69-para-17-cadencia-optout-purge.md`, prioridade normal):
  `POST /opt-outs` de cadência registra opt-out mas não purga jobs WhatsApp já enfileirados.
  (A missão citava Agente 44; o AGENTS.md local de `src/features/cadence/**` designa o 17 —
  confirmar destinatário correto.)

## Evidências

- Testes: `npx vitest run -c vitest.unit.config.ts src/features/notifications/opt-out/__tests__/optout.service.test.ts tests/unit/features/notifications/optOutReal.test.ts` → **10/10 passando** (6 novos + 4 existentes). Antes da correção, 3 dos 6 novos falhavam (reprodução das falhas 1 e 2).
- `npx tsc --noEmit` → exit 0, sem erros.
- `npm run lint` (biome) → exit 0; 0 diagnósticos nos arquivos do escopo (1516 warnings pré-existentes no repo, fora do escopo).
- Nenhuma proteção LGPD/RLS enfraquecida; nenhuma comunicação real enviada; sem push/PR.

## Arquivos alterados (commit 5c0677858)

- `src/features/notifications/opt-out/optout.service.ts` (modificado)
- `src/features/notifications/opt-out/__tests__/optout.service.test.ts` (novo)
- `.agents/handoffs/onda4/69-para-56-whatsapp-optout-purge.md` (novo)
- `.agents/handoffs/onda4/69-para-17-cadencia-optout-purge.md` (novo)

## Riscos residuais / bloqueios

- A purga de fila é defesa em profundidade; a supressão real hoje depende dos gates de envio
  (`isOptedOut`/`checkOptOutStatus`). Sem os handoffs 56/17 implementados, jobs pendentes seguem
  bloqueados no envio, mas permanecem na fila até o worker falhar/expirar — aceitável para LGPD,
  mas não é o desenho pretendido.
- Race residual check-then-send em `sendWhatsAppMessage` (janela entre consulta e envio) —
  documentada no handoff 56; fechar 100% exigiria versionamento/lock no registro de opt-out.
- `recordOptOutAndPurgePendingJobs` não purga outras filas (ex.: cadência própria, cold-call) —
  hoje só `whatsapp-command` é coberta; se novas filas de envio comercial surgirem, estender.
