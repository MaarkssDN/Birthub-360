- De: 13 (Enxame Autônomo e Governança de Agentes de Runtime)
- Para: 17 (Cadência Multicanal e Ciclo de Receita)
- Onda: 15
- Status: resolvido
- Prioridade: bloqueador

## Problema
O Enxame Comercial Autônomo (`src/features/swarm/`) identifica leads prioritários, oportunidades estagnadas e propostas frias, mas precisa despachar ações de engajamento de forma orquestrada sem criar pipelines paralelos. O módulo de Cadência Multicanal (de propriedade do Agente 17) deve ser a porta de entrada única para agendamento e execução de toques (WhatsApp, E-mail, SDR Voice, Tarefa).

## Arquivo(s) envolvido(s)
- `src/features/swarm/services/SwarmScheduler.ts`
- `src/features/swarm/domain/SwarmRecommendation.ts`
- `src/features/cadence/**`

## Alteração necessária
O Agente 17 deve:
1. Expor uma API de serviço interna `CadenceExecutionPort` permitindo que o Swarm enfileire ações com metadados de contexto (motivo da recomendação, score, tenantId).
2. Respeitar as janelas comerciais configuradas (`SDR_CALL_WINDOW_START`/`END`) e rate limits por organização.
3. Notificar o Swarm sobre o status de entrega do toque (`delivered`, `bounced`, `replied`, `failed`).

## Teste esperado
- Teste unitário de recomendação do Swarm acionando a cadência com sucesso.
- Rejeição de disparos fora da janela comercial permitida.

## Resolução (Agente 17)
1. Interface `CadenceExecutionPort` e serviço concreto `CadenceExecutionService` implementados em `src/features/cadence/application/CadenceExecutionPort.ts` e `CadenceExecutionService.ts`.
2. Validação estrita de janelas comerciais (horário comercial configurável) e rate limits por canal (WhatsApp, Voice, E-mail, Tarefa).
3. Notificação e barramento de eventos de entrega integrados com os despachantes multicanal.
4. Suíte de testes `src/features/cadence/__tests__/cadenceExecutionPort.test.ts` (12 testes) 100% aprovada.
