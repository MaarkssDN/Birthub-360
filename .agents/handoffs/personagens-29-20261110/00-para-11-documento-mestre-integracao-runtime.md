De: 00 — Coordenador
Para: 11 — Marca e Ativos Institucionais
Onda: integração runtime dos 29 personagens
Status: aberto
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
