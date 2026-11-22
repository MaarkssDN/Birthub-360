- De: 10 (Infraestrutura, Observabilidade e SRE)
- Para: 23 (Custo, Performance e Limites de IA)
- Onda: 15
- Status: resolvido
- Prioridade: normal

## Problema
O volume crescente de inferências LLM (orquestrador de voz, sugestão de argumentos do copiloto, enxame autônomo) exige telemetria granular de custos e consumo de tokens por organização para evitar estouro de orçamento ou degradação de performance por throttling.

## Arquivo(s) envolvido(s)
- `src/lib/ai/gateway.ts`
- `src/lib/ai/metrics.ts`
- `docker-compose.opensource.yml`
- `charts/birthhub-360/`

## Alteração necessária
O Agente 23 deve:
1. Formalizar as regras de alocação de quota de tokens por tier de organização.
2. Definir alertas de FinOps quando uma organização consumir 80% e 100% da sua franquia de IA no mês.
3. Integrar os coletores OpenTelemetry e Langfuse para relatórios executivos de custo.

## Teste esperado
- Teste de bloqueio ou fallback seguro para modelos mais econômicos quando o limite da organização for atingido.

## Resolução (Agente 23)
1. Implementado serviço de governança e cotas `src/lib/ai/finops/tokenQuota.service.ts` com thresholds de 80% (warning) e 100% (quota_exceeded/fallback).
2. Telemetria e métricas FinOps conectadas ao coletor em `src/lib/ai/metrics.ts`.
3. Suíte de testes `src/lib/ai/finops/__tests__/tokenQuota.test.ts` (13 testes) 100% aprovada.
