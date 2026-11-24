- De: 00
- Para: 21 (LGPD/Privacidade)
- Status: ABERTO — insumos para decisões humanas
- Prioridade: P1 (condicional a escopo voz/IA)

## Achados

### DEBT-0022 (co 12) — Voz persiste PII sem retenção/consentimento efetivo — P1
`voiceResult.webhook.ts:239-287`, `threecx.service.ts:734-742`, `schema.prisma:3132-3158,3921-3934`: transcrição/áudio/rawPayload gravados incondicionalmente; DECLINED não impede storage; retentionPurge e DSR não cobrem VoiceCallLog/Note/Activity/ThreeCXCallEvent.
**Ação 21:** definir tratamento LGPD correto (base legal, retenção, anonimização, inclusão em DSR/portabilidade) → handoffs 12 (código) e 01A (retenção).

### DEBT-0013 (co 13) — Consentimento IA é env, não registro — P1/P2
`aiPiiConsent.service.ts:40-57`: kill-switch operacional, não consentimento auditável. **Decisão jurídica necessária:** env basta temporariamente ou exige consentimento persistido por org/titular?

### Janelas de retenção — DECISÃO PENDENTE (bloqueia DEBT-0021)
Definir dias oficiais para: AuditLog, AILog, BitrixSyncLog, ExternalCrmSyncLog, AgentMemory, WhatsAppMessage, ConversationSignal, TimelineEvent, EnrichmentLog. Hoje: defaults soltos 90/60/365; BitrixExtraction 45; landing 90; anonymize 90; AuditLog append-only.

### Contexto positivo
DSR público do PR #381 em main: tokens 32B hash uso único 72h, anti-enumeração, dados cifrados, auditoria sem PII. Erasure LGPD transacional completa (anonimização+OptOut+AuditLog+remoção áudio).
