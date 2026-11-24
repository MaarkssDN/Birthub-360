# Handoff 64 → 00 — Comandos de Voz e Execução de Ações (Onda 4, B-07)

De: Agente 64 — Tito (Comandos de Voz e Ações)
Para: Agente 00 — Coordenador
Onda: 4 (dem-20261123-onda4)
Status: resolvido
Prioridade: bloqueador (B-07 histórico)
Bloqueador-ref: B-07 — "Comando de voz que afirma executar ação sem executá-la"
Sprint destino: Onda 4

## Problema

Auditoria do domínio `src/features/voice-hub/commands/**` revelou que o baseline
continha apenas `command.processor.ts` (commit pós-mutação), **sem**:
interpretação de intenções, vínculo comando→executor, autorização por comando,
confirmação ativa para ações críticas, ou qualquer consumidor do processador.
Ou seja, o caminho "voz → ação" não existia de forma honesta e auditável.

## Arquivo(s) envolvido(s)

Todos dentro do ownership exclusivo `src/features/voice-hub/commands/**`:

- `command.processor.ts` (modificado)
- `intent.parser.ts` (novo)
- `permission.guard.ts` (novo)
- `confirmation.manager.ts` (novo)
- `voice-command-router.ts` (novo)
- `tests/unit/features/voice-hub/voiceCommandRouter.test.ts` (novo, 18 testes)

Nenhum arquivo fora de `commands/**` foi alterado. UI do Voice Hub (Agente 65) intacta.

## O que foi implementado

1. **Interpretação de intenções** (`intent.parser.ts`): parser determinístico
   PT/EN para `create_lead`, `update_deal_stage`, `schedule_meeting`,
   `log_activity`, `generic_action`. Retorna status honestos:
   `parsed | ambiguous | incomplete | unrecognized` — nunca executa.
2. **Autorização por comando** (`permission.guard.ts`): papel mínimo por tipo
   (viewer < agent < manager < admin). `update_deal_stage` exige manager,
   `generic_action` exige admin. Revalidada no momento da confirmação.
3. **Confirmação ativa** (`confirmation.manager.ts` + router): comandos
   críticos (`update_deal_stage`, `schedule_meeting`, `generic_action`)
   exigem token de confirmação com TTL (2 min), uso único e cancelamento
   explícito. Confirmação expirada/inexistente/reutilizada bloqueia execução.
4. **Vínculo comando→executor** (`voice-command-router.ts`): registro
   `Record<VoiceCommandType, DatabaseMutationRunner>`; executor ausente →
   `executor_not_bound` (falha honesta, sem falso positivo).
5. **Execução real vs simulação** (`command.processor.ts`): `DatabaseMutationRunner`
   ganhou flag `simulation?: boolean`. Runner simulado retorna
   `success:false, confirmed:false, simulated:true` **sem sequer mutar** —
   impossível anunciar execução fantasma.
6. **Respostas honestas**: resultado discriminado
   (`executed|failed|needs_confirmation|confirmation_*|denied|ambiguous|incomplete|unrecognized|executor_not_bound`);
   `confirmed:true` somente após `dbRunner.mutate` resolver com sucesso.

## Evidências

- `npx vitest run -c vitest.unit.config.ts tests/unit/features/voice-hub/commandProcessor.test.ts tests/unit/features/voice-hub/voiceCommandRouter.test.ts`
  → **21/21 testes passando** (3 pré-existentes + 18 novos).
- `npx tsc --noEmit` → sem erros.
- `npx biome lint src/features/voice-hub/commands` → limpo (0 warnings).
- Testes cobrem os critérios de aceite do papel: ambiguidade, confirmação
  expirada, cancelamento e execução única (replay de token bloqueado).

## SHAs

- Commit: `965fc4bf53a24a3d9db95f8620f370a449de36d6`
- Branch: `agente/64-voice-commands-onda4`
- Worktree: `C:\Github\Birthub-360-worktrees\dem-20261123-onda4\wt-64-voice-commands`

## Decisões e suposições

- Conjunto de comandos críticos definido como `update_dead_stage`,
  `schedule_meeting`, `generic_action` (`CRITICAL_VOICE_COMMANDS` exportado,
  ajustável sem quebrar contrato).
- Papéis mínimos por comando definidos em `MINIMUM_ROLE` (permission.guard.ts).
- `VoiceCommandConfirmationManager` é in-memory por padrão; persistência
  distribuída exigiria infra de 16 — fora de escopo, registrado como pendência.
- O router **não** está ainda conectado a um ponto de entrada de áudio/STT
  (pertence à integração com Agente 12/65); o módulo está pronto para ser
  injetado via `createVoiceCommandRouter({ executors })`.

## Pendências / handoffs sugeridos

- **Agente 12**: conectar `useVoiceConversation`/transcrição ao
  `createVoiceCommandRouter` e prover executores reais (Prisma) por tipo.
- **Agente 16**: se confirmações precisarem sobreviver a restart/multi-instância,
  mover `VoiceCommandConfirmationManager` para store compartilhado.
- **Agente 00**: parecer do auditor independente (Agente 09) sobre o SHA
  `965fc4bf5` antes de integração.
