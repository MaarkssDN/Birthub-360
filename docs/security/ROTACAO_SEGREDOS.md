# Procedimento Operacional: Rotação de Segredos e Integração com Cofre (AWS Secrets Manager / Docker Secrets)
**Passo 029 — Agente 15 (Segurança Aplicada e Rotação de Segredos)**

## 1. Visão Geral
Este documento estabelece o procedimento operacional padrão (SOP) para rotação periódica e emergencial de credenciais do Birth Hub 360°, garantindo disponibilidade contínua sem reinicialização forçada de instâncias (dual-key grace period).

## 2. Segredos Sujeitos a Rotação
1. **DATABASE_URL / Credenciais do Banco**:
   - Usuário `prospector_app` do PostgreSQL.
   - Período de rotação: 90 dias ou imediato pós-incidente.
2. **CREDENTIALS_ENCRYPTION_KEY / PII Cipher Key**:
   - Chave AES-256-GCM para criptografia em repouso de credenciais de integrações
     (Bitrix24, Google Workspace, telefonia) e campos PII (Contact.email/phone/whatsapp,
     transcripts de voz) — ver `src/lib/crypto/secretFields.ts` e
     `src/lib/security/credentialCrypto.ts`.
   - Envelope versionado `enc:v1:<keyId>:<iv>:<authTag>:<ciphertext>`: o `keyId` é o
     fingerprint SHA-256 (12 hex) da chave que cifrou, permitindo rotação com grace period
     sem ambiguidade sobre qual chave abriu cada segredo (BT360-DT-0073).
   - Suporte a decifragem com chave anterior durante janela de migração
     (`CREDENTIALS_ENCRYPTION_KEY_PREVIOUS`).
3. **BETTER_AUTH_SECRET / JWT Secret**:
   - Chave simétrica de assinatura de sessões.
4. **Chaves de Provedores de IA (Groq, Anthropic, etc.)**:
   - Tokens de API externos com rotação por console/cofre.

## 3. Protocolo de Rotação com Período de Carência (Dual-Key)
```
Passo 1: Gerar novo segredo no AWS Secrets Manager / Vault com versão "AWSPENDING".
Passo 2: Injetar a nova chave como secundária nos pods da aplicação.
Passo 3: Migrar leituras/escritas para a nova credencial.
Passo 4: Promover versão para "AWSCURRENT".
Passo 5: Revogar credencial antiga após 48 horas de carência.
```

### 3.1 Rotação de `CREDENTIALS_ENCRYPTION_KEY` (envelope keyed — BT360-DT-0073)

O envelope `enc:v1:<keyId>:...` torna a rotação segura: cada ciphertext declara qual chave
o cifrou, e a decriptação tenta a chave atual e a anterior (`CREDENTIALS_ENCRYPTION_KEY_PREVIOUS`)
até o re-encrypt sweep concluir. Procedimento:

```
Passo 1: Gerar NOVA chave: openssl rand -base64 32
Passo 2: Deploy com CREDENTIALS_ENCRYPTION_KEY=<NOVA> e
         CREDENTIALS_ENCRYPTION_KEY_PREVIOUS=<ANTIGA> — zero downtime: credenciais antigas
         continuam decifrando pelo keyId/fallback.
Passo 3: Rodar o re-encrypt sweep (re-cifra tudo para a chave nova):
           DATABASE_URL=... CREDENTIALS_ENCRYPTION_KEY=<NOVA> \
           OLD_KEY=<ANTIGA-b64> NEW_KEY=<NOVA-b64> \
           npx tsx scripts/security/reencrypt-credentials.ts --apply
Passo 4: Verificar legibilidade: mesmo comando com --verify (deve reportar 0 ilegíveis).
Passo 5: Remover CREDENTIALS_ENCRYPTION_KEY_PREVIOUS e fazer novo deploy.
         A partir daí, segredos cifrados com a chave antiga falham fail-closed
         (comportamento intencional — janela de grace period encerrada).
```

Rollback dentro do grace period: basta manter `CREDENTIALS_ENCRYPTION_KEY_PREVIOUS` —
nenhum ciphertext se perde por rotação de chave.

## 4. Execução do Script de Validação
Para validar os formatos de credenciais e parâmetros antes de aplicar mudanças reais:

```bash
bash scripts/security/rotate-secrets.sh --dry-run
```

Critério de aprovação: Código de saída 0 com relatório sanitizado (zero segredos reais exibidos).

## 5. Procedimento de Rollback
Em caso de falha de autenticação após a rotação:
1. Reverter o ponteiro do Secrets Manager para a versão "AWSPREVIOUS".
2. Emitir evento de alerta de auditoria de segurança no canal global.
3. Notificar o SRE (Agente 10) e Agente 15 para análise pós-morte.
