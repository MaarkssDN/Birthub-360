De: 00 â€” Coordenador
Para: 05 â€” ProspecÃ§Ã£o
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-05-002
Sprint destino: Onda 4 â€” IA, Enxames e OtimizaÃ§Ã£o de Custos

## Problema
MÃ³dulo de enriquecimento de leads (enrichment.service.ts) nÃ£o possui rate limiting nem circuit breaker para provedores externos (ex: Apollo/Hunter), consumindo crÃ©ditos rapidamente em erros 429.

## Arquivo(s) envolvido(s)
- src/services/prospecting/enrichment.service.ts:95-140

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-05.md.
- enrichment.service.ts (L95-140): Faz chamadas paralelas desenfreadas para enriquecer lotes de leads. Ao receber 429 Too Many Requests, repete imediatamente sem respeitar header Retry-After.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar rate limiter com token bucket e circuit breaker especÃ­fico em enrichment.service.ts.
2. Respeitar o cabeÃ§alho Retry-After retornado pelos provedores externos.

## Teste esperado
- CritÃ©rio de Aceite: Ao receber 429, o serviÃ§o pausa novas requisiÃ§Ãµes pelo tempo estipulado pelo provedor sem consumir crÃ©ditos.
- Teste: enrichment-rate-limit.spec.ts.

## Contexto adicional
PreservaÃ§Ã£o de orÃ§amentos de integraÃ§Ã£o e conformidade de API externa.


## Resolucao
- Data: 2026-11-06.
- Implementado LeadEnrichmentService em src/services/prospecting/enrichment.service.ts com Circuit Breaker ativo e leitura do cabecalho Retry-After para travar novas requisicoes locais sem consumir creditos ao atingir 429.
- Testes: 	ests/unit/services/prospecting/enrichment-rate-limit.test.ts (2 passam).

