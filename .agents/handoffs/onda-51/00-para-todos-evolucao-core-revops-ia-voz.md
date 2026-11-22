De: Agente 00 (Coordenador)
Para: Todos os Agentes (01, 02, 06, 07, 12, 15)
Onda: 51
Status: resolvido
Prioridade: normal
Sprint destino: Sprint 51

## Problema
Correção do setup de mocks da esteira de testes unitários para módulos React com `vi.mock('@/lib/api')` e resiliência no `afterEach` hook de limpeza de cache de API.

## Arquivos Envolvidos
- `tests/mocks/setup.ts`
- `src/lib/api.ts`

## Alteração Necessária
Verificar a presença de `apiModule.invalidateInFlightGetCache` antes de invocá-lo no `afterEach` hook, evitando falhas em testes que utilizam mocks isolados da API REST.

## Teste Esperado
Todos os testes das suítes de Billing, Cadence, Reports, Prospecting e WhatsApp executando com 100% de aprovação.
