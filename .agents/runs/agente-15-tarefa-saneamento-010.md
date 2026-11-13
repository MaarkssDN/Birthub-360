# Run Report — Agente 15 — TAREFA-SANEAMENTO-010 / BT360-DT-0073

- **Data:** 2026-11-12
- **Branch:** `agente/15-w3-envelope-enc`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-15-criptografia-de-credenciais-em-repouso-sem-suporte-a-envelope-encrypti.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24

## Sumário

Envelope encryption de credenciais em repouso agora é **versionado por chave**
(Key Rotation Grace Period). Formato novo: `enc:v1:<keyId>:<iv>:<authTag>:<ciphertext>`,
onde `keyId` = fingerprint SHA-256 (12 hex) da chave encryptante. O prefixo `enc:v1:`
foi mantido de propósito para não quebrar nenhum detector existente
(`startsWith('enc:v1:')` em `prisma-interceptors.ts`, `prisma.ts`, backfills e scripts);
parsers antigos que exigem 3 segmentos falham **fechado** diante do formato keyed,
nunca tratam ciphertext como texto puro.

## Mudanças

- `src/lib/crypto/secretFields.ts` — caminho canônico (Bitrix/Google/PII/integration
  settings via Prisma interceptors): `encryptField` emite keyed; `decryptField`
  aceita keyed (4 segmentos) e legado (3), tentando chave atual →
  `CREDENTIALS_ENCRYPTION_KEY_PREVIOUS`. Nova env documentada em `src/config/env.ts`
  e `.env.example`.
- `src/lib/security/credentialCrypto.ts` — mesmo envelope keyed; decrypt mantém
  compat com `primaryKey`/`fallbackKey` explícitos + env current/previous.
- `scripts/security/credential-envelope.ts` — `encryptWithKey`/`decryptWithKey`
  emitem/aceitam keyed (rotação OLD→NEW e `--verify` seguem funcionando; keyId é
  metadado, a chave explícita decide).
- `docs/security/ROTACAO_SEGREDOS.md` — §3.1 com procedimento operacional de rotação
  da chave de credenciais (deploy duplo-key → reencrypt sweep → verify → remover
  PREVIOUS).
- Testes: `tests/unit/lib/security/credentialCrypto.test.ts` e
  `src/lib/crypto/__tests__/secretFields.unit.test.ts` — keyId, roundtrip, grace
  period, envelope legado, fail-closed após fim da janela.

## Gates

- `vitest run` (credentialCrypto + secretFields + piiFields) → 37/37 ✅
- Suíte adjacente (prisma-interceptors, integrationSettings, universalConnectors,
  backfill, reencrypt, useRedisAuthState) → 108/108 ✅
- `npx tsc --noEmit` → ✅
- `npm run lint` → exit 0 (1435 warnings pré-existentes, baseline inalterado)

## Riscos / Observações

- Rolling deploy: pods antigos não decifram envelopes keyed novos (fail-closed).
  Ordem recomendada: deploy dos leitores primeiro ou aceitar a janela — documentado
  no SOP §3.1.
- `CREDENTIALS_ENCRYPTION_KEY_PREVIOUS` malformada é erro fail-closed (não fallback
  silencioso), consistente com a chave atual.
- Re-cifragem de segredos existentes em produção fica para o sweep operacional
  (`reencrypt-credentials.ts --apply`), fora de escopo desta tarefa.
