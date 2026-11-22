De: 00 — Coordenador
Para: 11 — Marca e Ativos Institucionais
Onda: integração runtime dos 29 personagens
Status: resolvido
Prioridade: normal

## Problema

O Documento Mestre oficial (`BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html`) descreve a fase visual dos 29 personagens. A nova camada de integração runtime (estados operacionais reais, Central `/app/characters`, execução via Supervisor 00, gate de concorrência) precisa ser registrada para que a documentação viva reflita a arquitetura efetiva.

## Arquivo(s) envolvido(s)

- `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html` (ou local oficial equivalente)
- Referência de implementação: `.agents/runs/2026-11-10-integracao-runtime-personagens.md`

## Evidência

- 8 estados operacionais (`characterRuntime.ts`): available, queued, processing, delegating, completed, error, blocked, unavailable → 6 estados visuais do SVG.
- Endpoints: `GET /api/agent/characters*`, execução via `POST /api/agent/swarm/stream`.
- Gate de concorrência configurável por tenant (`SWARM_MAX_CONCURRENT_MISSIONS`, teto 8).

## Alteração necessária

Adicionar/atualizar a seção de personagens com: vínculo personagem→agente verificável, fluxo Usuário→Personagem→Supervisor 00→Especialista, estados operacionais reais e a Central de Personagens. Preservar o histórico do documento.

## Teste esperado

Documento coerente com `characterCatalog.ts` + `characterRuntime.ts`; nenhuma contradição com a fase visual já homologada.

## Contexto adicional

A revisão do Agente 24 desta fase está em andamento; se houver ressalvas, a atualização do Documento Mestre deve refletir o estado final homologado.

## Resolução (Agente 11 — 2026-11-12)

`BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html` (raiz) atualizado na seção `#enxame-ia`, imediatamente após o catálogo dos 24 agentes, com novo bloco **"P06 — Camada de Personagens (Integração Runtime)"** registrando:

- Vínculo personagem→agente verificável, derivado em runtime por `characterRuntime.ts` a partir de `characterCatalog*.ts` (nunca declarado manualmente); `unavailable` honesto sem mocks.
- Fluxo Usuário → Central `/app/characters` → Personagem → Supervisor 00 (AgentBus) → Especialista, via `POST /api/agent/swarm/stream` (SSE); dispatches `swarm-stream` / `module-surface` / `none`.
- Superfície de API `GET /api/agent/characters*` sob `authenticateToken` + `requireTenant` + `aiLimiter`, escopo por `organizationId`.
- Os 8 estados operacionais reais (`available`…`unavailable`) mapeados aos 6 estados visuais do SVG; feed via `swarmAuditLog` por tenant.
- Gate de concorrência `swarmConcurrency.service.ts` (`SWARM_MAX_CONCURRENT_MISSIONS` teto 8, `SWARM_MISSION_QUEUE_TIMEOUT_MS`, FIFO, dedup de `sessionId`, circuit breaker).
- Referência ao run homologado `.agents/runs/2026-11-10-integracao-runtime-personagens.md` e ponte com a fase visual (`GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`, `public/brand/characters/`).

Fatos conferidos contra `characterRuntime.ts` (enum `OperationalState`, L26–52) e `agent.routes.ts` (mount `router.use('/characters', …)`, L486) antes da redação. Alteração cirúrgica: apenas HTML estático adicionado; nenhuma linha existente modificada.
