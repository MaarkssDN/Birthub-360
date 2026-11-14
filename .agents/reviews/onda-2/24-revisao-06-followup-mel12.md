# Parecer 24 — Re-revisão Follow-up Agente 06 (MEL-12 + governança Onda 2)
- Autor: 06 | Auditor: 24 | Base: origin/main | Branch: agente/06-followup-mel12 | Commit: fe97bab33
- VEREDITO FOLLOW-UP: APROVADO (condicionado a diff docs-only — CONFIRMADO pelo 00:
  6 arquivos, +389, zero código de produção)
- VEREDITO MEL-12 (backlog): ENTREGUE — doc GOVERNANCA-WHATSAPP-BAILEYS.md fiel ao
  código, cobre ToS/ban, mitigações, fallback e contingência. Lacunas documentadas
  (Cloud API stub, sem throttle por destinatário, sem detecção de ban, inbound sem
  retry) viram demandas próprias.

## Verificações (amostras arquivo:linha — todas conferem)
- whatsapp.service.ts: ban RUN-011 (:40-46), trava distribuída (:47-51,99-127),
  backoff reconexão (:36-38), logout apaga wa-auth (:283-286), broker web→worker
  (:415-429), opt-out duplo (:435-455), inbound sem retry→DLQ (:311-329)
- cadence rateLimit.ts:65-70 (3 toques/24h, 30min entre canais)
- whatsappCommand.queue.ts:55-60 + worker.ts:17-26,92-134,140 (DLQ+AuditLog)
- conectorManager.ts:56-72 stub confirmado — doc honesta sobre não-implementado
- useRedisAuthState.ts:17-22 AES-256-GCM SEC-014

## Governança
- Handoffs 06→12, 06→00, 06→24 no formato AGENTS.md §18; descrições fiéis aos diffs.
- journal/06.md e runs/onda-2/06-relatorio.md reconhecem MEL-08 parcial, MEL-12
  ausente e violação de propriedade — honestos.
- docs/architecture/ escrito sob missão do 00; aceitável com ratificação do 00
  (recomendado ciência do 08, dono formal de docs/).

## Achados residuais (não bloqueiam)
- Baixa: doc §5 diz "logoutWhatsApp" para /disconnect — na real enfileira comando
  processado pelo worker (cosmético).
- Handoffs 06→12 e 06→00 dependem de ratificação dos destinatários.

## Comandos não executados pelo auditor (modo explore)
- git diff --stat → executado pelo 00: docs-only confirmado.
