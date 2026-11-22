De: 00 — Coordenador
Para: 16 — Runtime, Workers e Escala
Onda: v4-fase2
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: B-11 (Garantia de Entrega e Idempotência de Eventos)
Sprint destino: Sprint 01 - Fase 02

## Problema
A especificação definitiva V4 ([BIRTHUB360_CONTRATOS_INTEGRACAO.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_CONTRATOS_INTEGRACAO.md)) estabelece uma malha de eventos de domínio (EDA) para desacoplamento entre CRM, Inteligência, Orquestração e Integrações externas. A infraestrutura em `src/lib/queue/` já possui componentes modernos de fila e DLQ, mas necessita registrar os novos tipos de eventos de domínio canônicos e garantir idempotência ponta a ponta.

## Arquivo(s) envolvido(s)
- `src/lib/queue/domainEventMesh.service.ts`
- `src/lib/queue/index.ts`
- `src/lib/queue/deadLetter.ts`
- `src/lib/queue/idempotencyManager.ts`

## Evidência
`src/lib/queue/domainEventMesh.service.ts` existe e gerencia eventos no Redis, mas precisa ter seus tópicos e payloads tipados alinhados aos novos contratos do V4 (`deal.created`, `deal.stage_changed`, `deal.won`, `proposal.version_created`, `cadence.step_executed`, etc.).

## Alteração necessária
1. Atualizar as definições de tipos e esquemas JSON em `domainEventMesh.service.ts` incluindo os eventos oficiais do catálogo V4.
2. Garantir que a Dead-Letter Queue registre `correlation_id`, `organization_id` e contagem de tentativas (backoff exponencial de 1s a 60s).
3. Conectar a camada de idempotência ao cabeçalho `X-Idempotency-Key` exigido na especificação de APIs.

## Teste esperado
- Teste unitário publicando evento de domínio e verificando entrega ao handler mockado.
- Teste de idempotência descartando mensagens repetidas com a mesma chave.
- Teste de DLQ isolando eventos que falharem consecutivamente após 5 retentativas.

## Contexto adicional
Alinhamento obrigatório com AGENTS.md (Regra 14 e 15 - Propriedade exclusiva do Agente 16).


## Resolução (Agente 16 / 00 — 2026-11-10)
- **Implementação:** Malha de eventos implementada em `src/lib/queue/domainEventMesh.service.ts` com tipagem de tópicos de receita, DLQ com retentativas exponenciais em `deadLetter.ts`, e detecção de ciclos causais defensiva.
- **Validação:** `tests/unit/queue/domainEventMesh.service.test.ts` executado com sucesso (4/4 testes verdes).
