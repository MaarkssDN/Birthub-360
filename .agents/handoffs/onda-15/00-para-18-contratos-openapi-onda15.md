- De: 00 (Coordenador)
- Para: 18 (Contratos, API e Documentação Viva)
- Onda: 15
- Status: resolvido
- Prioridade: normal

## Problema
As novas rotas de controle do Enxame Comercial Autônomo, agendamento de Cadências e telemetria de Live Insights do Copiloto precisam ser catalogadas em `docs/openapi.yaml` para manter o contrato de API inviolável e sem drift.

## Arquivo(s) envolvido(s)
- `docs/openapi.yaml`
- `src/features/swarm/**`
- `src/features/cadence/**`
- `src/features/copilot/**`

## Alteração necessária
O Agente 18 deve:
1. Documentar as operações de disparo e status do Swarm Scheduler.
2. Mapear endpoints de gestão de cadências e rotas de consentimento de opt-out.
3. Executar o gate de verificação `npm run verify:openapi-drift`.

## Teste esperado
- `npm run verify:openapi-drift` retornando status verde com zero drift.

## Resolução
Resolvido pelo Agente 18 (2026-10-08):
1. **Cadência Multicanal & Opt-Out**: Documentados formalmente `POST /cadence/opt-outs`, `GET /cadence/opt-outs/check` (interceptor B-13) e `POST /cadence/runs/{id}/events` (CadenceExecutionPort do Enxame).
2. **Swarm Scheduler**: Documentados `POST /intelligence/swarm/schedule` e `GET /intelligence/swarm/status`.
3. **Copiloto Live**: Documentados `POST /copiloto-ia/conversations/{id}/live-insights`, `GET /copiloto-ia/conversations/{id}/live-insights` e `GET /copiloto-ia/live-hud/{callId}` com schemas alinhados a `LiveCallInsight` de `src/shared/types/crm.ts`.
4. **Token Quota FinOps**: Documentados `GET /usage/quota` e `POST /usage/quota/alert` com os schemas `TokenQuotaFinOps` e `TokenQuotaAlertConfig`.
5. **Validação**: Executado `npm run verify:openapi-drift` e teste unitário `tests/unit/shared/openapiRouteInventory.test.ts` com 100% de sucesso (0 drift).

