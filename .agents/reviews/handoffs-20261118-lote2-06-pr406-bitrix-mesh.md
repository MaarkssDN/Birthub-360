# Parecer Agente 24 — PR #406 (Agente 06 — mesh Bitrix, consumers estáveis, dedup)

- Missão: onda saneamento-handoffs-20261118, lote 2
- Autor: Agente 06 | Auditor: Agente 24
- Branch: `agente/06-handoffs-20261117` | Estado: **OPEN**
- Conteúdo: `bitrixEventMeshBridge.service.ts`, `outboundSync.ts`, consumers nomeados, `dedupRef`, propagação de erro, testes

## Verificações

- **Consumers estáveis**: `bitrix-bridge:whatsapp-message-received`, `:voice-call-completed`, `:bitrix-webhook-received` — duráveis na chave de consumo `(organizationId, eventId, consumer)` do mesh.
- **Classificação de erro**: `AppError` 4xx permanente → best-effort, completa consumo; erros transitórios/`BitrixDefinitiveError` propagam → retry/dead-letter. `BitrixDefinitiveError extends AppError` — classificação correta.
- **Dedup externo**: `dedupRef: event.eventId` gera marcador `[ref:<eventId>]` + lookup best-effort em `crm.activity.list`/`crm.timeline.comment.list` antes de adicionar — mitiga duplicata de efeito externo.
- **Testes**: `npx vitest run` suites Bitrix → **2 arquivos / 18 testes passaram** (run mais amplo 56/56).

## Análise da janela de re-execução pós-deploy (pedido explícito)

- **Mudança de contrato**: events completados sob nomes de consumer antigos podem **executar uma vez** após deploy sob os novos nomes — re-processamento único, não loop.
- **Mitigação**: `dedupRef` + lookup de marcador impedem duplicata no Bitrix **quando o efeito externo anterior existe**. Janela é **one-shot e bounded**.
- **Ressalva**: o lookup é best-effort — se a API Bitrix estiver indisponível na janela, um evento re-executado pode duplicar a atividade/timeline. Probabilidade baixa (lookup precede add), mas não zero.
- **Ruído de ambiente**: `DATABASE_URL` validation error aparece no log antes do setup injetar dummy URL — ruído de teste, não falha.

## Achados

- **Aceitável**: janela de re-execução única é trade-off razoável pela correção de consumers instáveis; dedup externo mitiga o caso comum.
- **Ressalva**: documentar a janela no runbook de deploy; idealmente o 00 agenda deploy em horário de baixo tráfego.
- **Observação**: `isPermanentBitrixSyncError` só reconhece `AppError` 4xx — erros que viram `AppError` genérico após retries podem ser classificados como permanente prematuramente. Verificar se há teste cobrindo a transição transient→permanent.

## Veredito

**APROVADO-COM-RESSALVAS** — correção de consumers e dedup são sólidos; ressalvas: (1) documentar janela one-shot de re-execução no deploy; (2) confirmar cobertura de teste para classificação transient→permanent; (3) lookup dedup é best-effort — risco residual de duplicata externa baixo mas não nulo.
