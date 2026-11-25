# Handoff 64 → 60 (Aurora) — Wiring do pipeline de comandos de voz (B-07)

- **De:** Agente 64 — Tito (Squad 60, `commands/**`)
- **Para:** Agente 60 — Aurora (dono de `src/lib/voice-hub/**` até deliberação de decommission)
- **Cc / dependências:** Agente 22 — Hugo (`src/bootstrap/routes.ts`, montagem); Squad 40 (executores de mutação CRM)
- **Demanda:** DEM-20261123-001 · Branch `agente/64-voice-commands-s60` · Worktree `squads/squad-60/wt-64`
- **Data:** 2026-11-24

## 1. Situação

O pipeline B-07 de comandos de voz está **completo, testado e sem call-site de produção** (órfão confirmado pelo coordenador). Componentes em `src/features/voice-hub/commands/` (ownership 64):

| Arquivo | Papel |
|---|---|
| `intent.parser.ts` | transcript → intenção classificada (nunca executa) |
| `permission.guard.ts` | autorização por tipo de comando (papel mínimo) |
| `confirmation.manager.ts` | confirmação ativa: TTL 120s, uso único, cancelamento |
| `command.processor.ts` | `executeVoiceCommandWithCommit` — `confirmed:true` SÓ após `dbRunner.mutate` resolver; falha → `confirmed:false`; `simulation:true` → rejeitado |
| `voice-command-router.ts` | `createVoiceCommandRouter({executors})` → `processVoiceCommand(request)` — orquestra o fluxo inteiro |

Testes: `tests/unit/features/voice-hub/commandProcessor.test.ts` (3), `src/features/voice-hub/commands/__tests__/voiceCommandRouter.test.ts` (20, incluído no `test:unit` via `src/**/__tests__`), e novo `tests/unit/features/voice-hub/voiceCommandContract.test.ts` (7) — prova do contrato comando→confirmação→commit.

## 2. Por que não conectei (ownership)

Todo call-site natural está fora de `commands/**`:

- **`src/lib/voice-hub/routes/voiceRuntime.routes.ts`** + **`controllers/voiceRuntime.controller.ts`** — dono: **60** (você). É o ponto de montagem natural: já existe `POST /voice-runtime/sessions/:sessionId/interact` com o mesmo padrão de validação de sessão+tenant (controller l.119-146).
- **`src/bootstrap/routes.ts`** — dono: **22** (Hugo). O router `voiceRuntime.routes.ts` hoje só existe dentro de `routes/index.ts` (24 routers, desmontado — ver `squad-60-migracao-voicehub.md` §2.2). Montar exige decisão sua + diff no arquivo do Hugo.
- **Executores reais** (`VoiceCommandExecutorRegistry` → `DatabaseMutationRunner` por `VoiceCommandType`) — mutações de CRM pertencem ao Squad 40 (41-Cadu leads, 42-Lívia deals, 45-Otto activities) ou a services canônicos equivalentes.

## 3. Proposta de wiring (contrato completo)

### 3.1 Endpoint (dono: 60)

Em `src/lib/voice-hub/routes/voiceRuntime.routes.ts`, adicionar:

```ts
router.post(
  '/voice-runtime/sessions/:sessionId/command',
  requireTenant,
  voiceCommandRateLimiter, // reutilizar padrão dos routes de versions ou rateLimit.ts
  submitVoiceCommandHandler,
);
```

Handler em `src/lib/voice-hub/controllers/voiceRuntime.controller.ts` (mesmo arquivo do `interactVoiceSessionHandler`):

```ts
// Pseudocódigo do contrato — NÃO implementado por 64 (arquivo do Agente 60)
const { transcript, confirmation } = req.body ?? {};       // voiceCommandSchema (zod) — sugerir 21-Zara
const sessionId = String(req.params.sessionId);
const session = sessionManager.getSession(sessionId);
if (!session || session.tenantId !== req.organizationId) {
  return res.status(404).json({ error: 'Sessão não encontrada para esta organização.' });
}
const role = voiceRoleForCanonicalRole(req.user.role);      // roleRepository.ts:63 (já existe)
const actor: VoiceCommandActor = {
  userId: req.voiceHubUser!.id,
  organizationId: req.organizationId,
  role, // mapear VoiceHubRole → 'viewer'|'agent'|'manager'|'admin'
};
const result = await voiceCommandRouter.processVoiceCommand({
  transcript: String(transcript ?? ''),
  actor,
  confirmation, // { confirmationId, decision: 'confirm'|'cancel' } opcional
});
// Mapear status → HTTP: executed→200, needs_confirmation→202, failed→502,
// denied/confirmation_denied→403, confirmation_expired/cancelled→409,
// ambiguous/incomplete/unrecognized→422, executor_not_bound→501.
return res.status(httpStatus).json(result);
```

### 3.2 Router + registry de executores (dono: 60 decide local)

Instância única (ex.: `src/lib/voice-hub/services/voiceCommandRegistry.ts` ou dentro do controller):

```ts
import { createVoiceCommandRouter } from '../../../features/voice-hub/commands/voice-command-router.js';

const executors: VoiceCommandExecutorRegistry = {
  create_lead:       prismaLeadRunner,        // → PrismaLeadRepository / service do Squad 40
  update_deal_stage: prismaDealStageRunner,   // → deals service (42-Lívia)
  schedule_meeting:  prismaActivityRunner,    // → activity.service (45-Otto) — type 'Reuniao'
  log_activity:      prismaActivityRunner,    // idem, type conforme description
  // generic_action: NÃO vincular — fail-closed (executor_not_bound) até haver allowlist definida.
};

export const voiceCommandRouter = createVoiceCommandRouter({ executors });
```

Cada `DatabaseMutationRunner.mutate(organizationId, command)` DEVE:
- filtrar sempre por `organizationId` (tenant) — nunca confiar em ids do payload sem checar tenant;
- gravar audit log (padrão `writeAuditLog`/AuditService já usado nos services voice-hub);
- retornar o registro persistido (vai em `result.data`).

**Nota:** manter UMA instância do router/`VoiceCommandConfirmationManager` por processo — o estado de confirmações pendentes é em memória (TTL 120s, uso único). Em deploy multi-instância, confirmações não cruzam réplicas (aceitável para v1; documentar limitação ou migrar para Redis/17-Remo se necessário).

### 3.3 Montagem HTTP (dono: 22-Hugo, mediante decisão 60)

`src/bootstrap/routes.ts` (hoje l.211): o prefixo `/api/voice-hub` está 100% gated por `unavailableLegacyModule`. Opções:
- (a) montar `voiceRuntime.routes.ts` isolado em `/api/voice-hub/voice-runtime` atrás de `authenticateToken, requireTenant` (mesmo padrão do mount workflow proposto em `squad-60-migracao-voicehub.md` §5 Fase 1);
- (b) incluir no router canônico de voice-runtime quando o módulo for reaberto.

`authenticateToken` upstream já popula `req.user`; `requireTenant` (voice-hub) traduz para `req.organizationId`/`req.voiceHubUser` — compatível sem adaptação (ver migração §4).

## 4. Regras B-07 que o call-site NÃO pode violar

1. `confirmed:true` só pode vir de `result.execution.confirmed === true` — nunca sintetizar sucesso no controller.
2. Nunca passar `simulation:true` em runner de produção.
3. `confirmation` decision deve ser repassada intacta; o router já valida tenant+usuário criador e revalida autorização.
4. Responder `needs_confirmation` (202) com `confirmationId`+`expiresAt` para o cliente exibir o prompt de confirmação ativa.
5. Transcript vazio + `confirmation` presente é o caminho de decisão (precedência implementada no router passo 0).

## 5. Achado adjacente (fora do meu ownership — registrar)

`src/features/voice/voice-command-executor.service.ts` `handleTransferCall` (l.340-352) retorna `executed:true, verified:true` **sem nenhuma persistência** — potencial reincidência de B-07. O path `src/features/voice/**` e `src/features/ai-voice/**` **não constam na MATRIZ_PROPRIEDADE** (órfãos; também sem call-site de produção — só testes). Recomendo deliberação de ownership/decommission junto com D2 do plano do squad.

## 6. Evidências

- `npx vitest run -c vitest.unit.config.ts` nos 3 arquivos de teste do pipeline: **30/30 passam**.
- `npx tsc --noEmit`: limpo.
- Grep `createVoiceCommandRouter|processVoiceCommand|commands/command.processor`: zero call-sites fora de `commands/**` e testes.
