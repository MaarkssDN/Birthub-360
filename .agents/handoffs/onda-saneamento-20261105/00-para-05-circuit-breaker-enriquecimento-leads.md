De: 00 — Coordenador
Para: 05 — Prospecção
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-05-002
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Módulo de enriquecimento de leads (enrichment.service.ts) não possui rate limiting nem circuit breaker para provedores externos (ex: Apollo/Hunter), consumindo créditos rapidamente em erros 429.

## Arquivo(s) envolvido(s)
- src/services/prospecting/enrichment.service.ts:95-140

## Evidência
Base de auditoria: DIVIDAS-AGENTE-05.md.
- enrichment.service.ts (L95-140): Faz chamadas paralelas desenfreadas para enriquecer lotes de leads. Ao receber 429 Too Many Requests, repete imediatamente sem respeitar header Retry-After.

## Alteração necessária
1. Implementar rate limiter com token bucket e circuit breaker específico em enrichment.service.ts.
2. Respeitar o cabeçalho Retry-After retornado pelos provedores externos.

## Teste esperado
- Critério de Aceite: Ao receber 429, o serviço pausa novas requisições pelo tempo estipulado pelo provedor sem consumir créditos.
- Teste: enrichment-rate-limit.spec.ts.

## Contexto adicional
Preservação de orçamentos de integração e conformidade de API externa.
