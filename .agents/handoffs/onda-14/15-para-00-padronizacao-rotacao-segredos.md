- De: 15 (Segurança Aplicada e Rotação de Segredos)
- Para: 00 (Coordenador)
- Onda: 14
- Status: resolvido
- Prioridade: alto

## Problema
Dívida técnica histórica referente à ausência de uma padronização global e unificada para a Rotação de Segredos na plataforma Birth Hub 360°. Até então, existiam apenas runbooks reativos e isolados para incidentes do passado (Bland AI, Bitrix24, Gemini), deixando segredos de Tier 0 (chaves mestras de banco, blind indexes de PII), Tier 1 (Better Auth, Platform Operator Token) e webhooks de entrada sem diretrizes normativas de rotação, verificação negativa ou scripts de re-encriptação.

## Entregas Realizadas pelo Agente 15

1. **Política Normativa Master:**
   - [`docs/security/SECRET_ROTATION_POLICY.md`](../../docs/security/SECRET_ROTATION_POLICY.md): Catálogo completo e taxonomia de segredos de Tier 0 a Tier 4, com matriz de criticidade, cadência e o protocolo padronizado de 5 fases (com teste negativo mandatório de comprovação de invalidação da chave antiga).

2. **Suite Completa de Runbooks Padronizados em `docs/security/runbooks/`:**
   - `ROTATE_CREDENTIALS_ENCRYPTION_KEY.md`: Rotação da chave mestra AES-256-GCM com pipeline de re-encriptação de dados em repouso no PostgreSQL.
   - `ROTATE_PII_BLIND_INDEX_KEY.md`: Rotação da chave HMAC de busca cega de PII e re-indexação de contatos (LGPD).
   - `ROTATE_BETTER_AUTH_SECRET.md`: Rotação de segredo de sessões e cookies com governança de janelas de manutenção.
   - `ROTATE_PLATFORM_OPERATOR_TOKEN.md`: Rotação do token de infraestrutura para `/admin/queues` e `/metrics`.
   - `ROTATE_INBOUND_WEBHOOK_SECRETS.md`: Rotação bilateral coordenada para webhooks de entrada (Birth Voices, 3CX, Chatwoot, Voice Result, etc.).
   - `TEMPLATE_SECRET_ROTATION.md`: Gabarito padrão para futuros runbooks de rotação de credenciais.

3. **Utilitários e Scripts de Automação:**
   - `scripts/security/reencrypt-credentials.ts`: Script de re-encriptação em lote de registros com suporte a `--dry-run`.
   - `scripts/security/audit-secret-hygiene.ts`: Diagnóstico de conformidade de variáveis de ambiente, detecção de placeholders e validação de formato sem vazar segredos.
   - `src/lib/security/credentialCrypto.ts`: Módulo canônico de criptografia, decriptografia com fallback dual-key e sanitização estrita de headers/logs para conectores externos.

4. **Testes Unitários:**
   - `tests/unit/lib/security/credentialCrypto.test.ts`: 8 testes unitários cobrindo criptografia AES-256-GCM, fail-closed, dual-key fallback e sanitização de logs (100% verde).

5. **Documentação Viva Atualizada:**
   - `docs/security/SECURITY_GUIDE.md`: Seção dedicada à Rotação Padronizada de Segredos.
   - `docs/security/runbooks/INCIDENT_RESPONSE.md`: Links diretos para os runbooks de contenção e rotação de emergência.
