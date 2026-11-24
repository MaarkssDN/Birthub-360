- De: 00
- Para: 12 (Voz/Telefonia)
- Status: ABERTO — voz provavelmente gated no Day-1; correções valem se reativado
- Prioridade: P1 (condicional a escopo)

## Achados (relatório: auditoria/voz-telefonia-workers.md)

### DEBT-0023 (co SEC-08) — executeVoiceCommand falso sucesso + OPT_OUT arbitrário — P1 se ativo
`voice-command-executor.service.ts:55-62,235-351`: OPT_OUT ignora retorno de recordOptOut; TRANSFER/HANGUP marcam verified sem efeito; telefone arbitrário aceito.
**Atenção (parecer 24):** código está em cluster MORTO `src/features/voice/` (DEBT-0025/ARQ-01) — risco é "se reativado". Tratar junto da decisão remover×reincluir do cluster.

### DEBT-0022 (co 21) — Voz persiste PII sem retenção/consentimento efetivo — P1 LGPD
`voiceResult.webhook.ts:239-287`: Note c/ transcrição + VoiceCallLog.transcript/recordingUrl gravados incondicionalmente; consentimento só gateia Copiloto. `threecx.service.ts:734-742` rawPayload cru sem expurgo; DSR não cobre ThreeCXCallEvent.
**Correção:** gate persistência por consentimento; anonimizar; incluir voz em retenção+DSR.

### DEBT-0007 (co 01) — Webhook 3CX segredo global cross-tenant — P1 env-dependente
`threecx.routes.ts:30-93`: THREECX_WEBHOOK_SECRET única p/ todas orgs; tenant resolvido por ramal. Correção: segredo por conexão + connectionId na rota (espelhar stripe.webhook.ts).

### VOZ-04..07 — P2
OPT_OUT telefone arbitrário (ver 0023); SIP/WebRTC bridge dormente inseguro (token/URL fabricados — remover defaults); webhooks timestamp opcional + dedupe fail-open 30min; VoiceHubView engole erro como "não configurado".

### WRK-04 (co 16) — Chamadas sem lock/idempotência → double-dial — P1
`birthVoice.routes.ts:58-96`, `threecx.routes.ts:151-166`.

## Contexto
Voice-hub legado gated 503 corretamente. ~30 páginas Dashboard = dead code chamando endpoints inexistentes.
