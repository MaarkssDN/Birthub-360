De: 16 — Runtime, Workers e Escala
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-16-002
Sprint destino: Onda 2 — Runtime, Workers e Infraestrutura

## Problema
Circuit guard (circuitGuard.ts) abre circuito para todos os serviços em falhas de timeout do Redis, causando falsos positivos em cascata.

## Arquivo(s) envolvido(s)
- src/lib/circuitGuard.ts:40-85

## Evidência
Base de auditoria: DIVIDAS-AGENTE-16.md.
- circuitGuard.ts (L40-85): Trata qualquer erro capturado como degradação total do backend em vez de isolar por dependência (ex: redis, postgres, apis externas).
- Causa Raiz: Singleton compartilhado de circuit breaker sem chaveamento por serviço downstream.

## Alteração necessária
1. Refatorar circuitGuard.ts para manter circuitos independentes por dependência (redis, database, bitrix, telephony).
2. Adicionar healthcheck detalhado no endpoint /health reportando status granular de cada circuito.

## Teste esperado
- Critério de Aceite: Falha simulada no Redis abre apenas o circuito de cache/filas sem derrubar leitura direta do banco PostgreSQL.
- Teste: circuitGuard-isolation.spec.ts.

## Contexto adicional
Resiliência contra falhas em cascata.
