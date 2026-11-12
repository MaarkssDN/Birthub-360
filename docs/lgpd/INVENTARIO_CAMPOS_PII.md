# Inventário de Campos com Dados Pessoais (ROPA técnico)

> **GERADO AUTOMATICAMENTE** por `scripts/lgpd/ropa-inventory.ts` (TAREFA-SANEAMENTO-052).
> Não editar à mão — rode `npx tsx scripts/lgpd/ropa-inventory.ts` para regenerar.
> Gate de drift: `npx tsx scripts/lgpd/ropa-inventory.ts --check` falha se schema ou
> `ENCRYPTED_MODEL_FIELDS` divergirem deste arquivo.

Fontes: `prisma/schema.prisma` (anotações de PII em comentários) +
`src/lib/crypto/encryptedModelFields.ts` (campos cifrados em repouso).
Narrativa legal/finalidades/bases legais: ver `INVENTARIO_TRATAMENTO_ROPA.md` e
`docs/lgpd-base-legal.md`.

Total: 31 campos em 16 models.

| Model | Campo | Tipo | Cifrado em repouso | Anotação no schema |
|---|---|---|---|---|
| Account | accessToken | String? | sim | — |
| Account | idToken | String? | sim | — |
| Account | refreshToken | String? | sim | — |
| AgentMemory | errorMessage | String? | não | Preenchido só quando status = Failed; motivo sanitizado/truncado da falha (guardrail de LGPD, erro do grafo LangGraph, ou erro genuíno de escrita), nunca o stac |
| BitrixConnection | webhookSecret | String? | sim | Segredo do webhook de SAÍDA do Bitrix ("исходящий вебхук") que este portal chama de volta — gerado pela plataforma, colado pela pessoa no cadastro do webhook de |
| BitrixConnection | webhookUrl | String | sim | URL completa do webhook de entrada, incluindo o token (ex: https://SEUDOMINIO.bitrix24.com.br/rest/1/xxxxxxxx/). Cifrada em repouso (AES-256-GCM) de forma trans |
| BitrixExtractionRun | purgedAt | DateTime? | não | DEC-04 (dossiê CPI, Onda 42, opção B): preenchido pelo worker de expurgo LGPD (bitrixExtractionPurge.worker.ts) quando este run é anonimizado por retenção expir |
| ConsentAuditRecord | subjectRef | String | não | `hs256:` + HMAC-SHA256(chave do titular em ConsentSubjectKey). CHECK no banco (exceto GENESIS). |
| Contact | email | String? | sim | — |
| Contact | emailIndex | String? | não | Índice cego de igualdade exata sobre `email` normalizado (trim + lowercase) — substitui todo WHERE que antes fazia `email: { equals, mode: 'insensitive' }` cont |
| Contact | phone | String? | sim | phone/whatsapp/email cifrados em repouso (AES-256-GCM, ver src/lib/crypto/piiFields.ts) desde a reativação do CPI "PII de lead/contato não cifrada em repouso" — |
| Contact | whatsapp | String? | sim | — |
| CopilotoTranscriptSegment | text | String | sim | — |
| ExternalCrmConnection | config | String | sim | JSON object containing the encrypted configuration/credentials. For OAuth: { accessToken, refreshToken, expiresAt, domain } For API Key: { apiKey, domain } It i |
| ExternalCrmConnection | tokenExpiresAt | DateTime? | não | Espelho NÃO sensível de `config.expiresAt`. Tokens NUNCA saem de `config` (cifrado via piiFields). |
| GoogleWorkspaceConnection | accessToken | String | sim | Cifrados em repouso (AES-256-GCM) de forma transparente pela extensão Prisma em src/lib/prisma.ts — ver src/lib/crypto/secretFields.ts. |
| GoogleWorkspaceConnection | refreshToken | String | sim | — |
| LearningCandidate | sanitization | Json? | não | Snapshot do `AnonymizationResult` (LgpdSanitizerService) — `null` só quando o conteúdo não tinha nenhum texto livre a sanitizar. |
| OmieConnection | appKey | String | sim | Credenciais de aplicativo do Omie (Cadastros > Empresas > Chave de Integração). Cifradas em repouso (AES-256-GCM) de forma transparente pela extensão Prisma em |
| OmieConnection | appSecret | String | sim | — |
| SlackConnection | botToken | String? | sim | Bot User OAuth Token (xoxb-...) para enviar via chat.postMessage — permite escolher o canal de destino por chamada em vez de um único webhook fixo. Cifrado em r |
| SlackConnection | webhookUrl | String? | sim | URL do Incoming Webhook do Slack (https://hooks.slack.com/services/...) — URL de usuário/tenant, por isso validada com assertSafeExternalUrl/safeFetch (SSRF) em |
| StripeConnection | secretKey | String | sim | Chave secreta da API do Stripe (sk_live_.../sk_test_...). Cifrada em repouso (AES-256-GCM) de forma transparente pela extensão Prisma em src/lib/prisma.ts — ver |
| StripeConnection | webhookSecret | String? | sim | Segredo de assinatura do webhook de ENTRADA (`whsec_...`) — ao contrário de BitrixConnection.webhookSecret (gerado por nós, colado no Bitrix), este vem DA Strip |
| ThreeCXConnection | apiKey | String? | sim | Credenciais de API do PABX (Call Control). Cifradas em repouso (AES-256-GCM) de forma transparente pela extensão Prisma em src/lib/prisma.ts — ver src/lib/crypt |
| ThreeCXConnection | apiSecret | String? | sim | — |
| VoiceCallLog | recordingUrl | String? | sim | — |
| VoiceCallLog | summary | String? | sim | — |
| VoiceCallLog | transcript | String? | sim | — |
| VoiceHubConnection | apiKey | String? | sim | Credenciais cifradas em repouso (AES-256-GCM) de forma transparente pela extensão Prisma em src/lib/prisma.ts — ver ENCRYPTED_FIELDS, mesmo tratamento de Bitrix |
| VoiceHubConnection | webhookSecret | String? | sim | ACH-01-01 (09/2026) encontrou este campo sem migration real por trás (drift puro) e cogitou removê-lo (chegou a ser removido brevemente, PR #436). ACH-06-01 (me |
