- De: 06 (Integrações e Bitrix)
- Para: 15 (Segurança Aplicada e Rotação de Segredos)
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador

## Problema
Os novos conectores de CRM (`hubspot.service.ts`, `pipedrive.service.ts`, `rdstation.service.ts`, `monday.service.ts`) manipulam tokens confidenciais de API e credenciais OAuth (access token, refresh token, client secrets). Armazenar ou manipular esses tokens em texto claro no banco ou expô-los em logs da aplicação viola diretamente a regra global de segurança e o bloqueador prioritário B-04 ("Credenciais armazenadas sem proteção").

## Arquivo(s) envolvido(s)
- `src/features/integrations/hubspot/hubspot.service.ts`
- `src/features/integrations/pipedrive/pipedrive.service.ts`
- `src/features/integrations/rdstation/rdstation.service.ts`
- `src/features/integrations/monday/monday.service.ts`
- `src/lib/security/**`
- `src/config/env.ts`

## Alteração necessária
O Agente 15 deve fornecer ou estender o helper seguro de criptografia de credenciais (envelope encryption com AES-256-GCM / `crypto` nativo):
1. Disponibilizar métodos padronizados `encryptCredential(plainText: string): Promise<string>` e `decryptCredential(cipherText: string): Promise<string>`.
2. Estabelecer sanitização estrita nos logs dos serviços de integração, garantindo que cabeçalhos `Authorization` e payloads contendo tokens nunca sejam impressos em stdout, arquivos de log ou traces de erro.
3. Prover estratégia segura de rotação de chaves sem perda de acesso às integrações ativas.

## Teste esperado
- Testes unitários comprovando que:
  1. O payload salvo no banco é criptografado e ilegível sem a chave mestra.
  2. Chamadas de decriptação com chave inválida disparam exceção controlada sem vazamento de stacktrace confidencial.
  3. Varredura de logs com tokens simulados comprova sanitização com máscara `[REDACTED]`.

## Contexto adicional
Requisito mandatório do Gate de Release e bloqueador B-04.

## Resolução (Agente 15 - 2026-10-08)
O Agente 15 implementou e validou a infraestrutura completa para atender às demandas de criptografia, sanitização e rotação:
1. `src/lib/security/credentialCrypto.ts`: Fornece `encryptCredential(plainText, customKey?)` e `decryptCredential(cipherText, primaryKey?, fallbackKey?)` baseados em AES-256-GCM com envelopes `enc:v1:...`.
2. Sanitização ativa: Helpers `maskSecret`, `redactHeaders` e `sanitizeObjectForLogging` garantem que tokens, chaves e headers `Authorization` sejam redigidos com `[REDACTED]` e `****`.
3. Rotação sem downtime: Suporte a dual-key fallback na decriptação e script utilitário `scripts/security/reencrypt-credentials.ts` para re-encriptação no banco.
4. Testes: 8 testes unitários cobrindo todos os cenários implementados em `tests/unit/lib/security/credentialCrypto.test.ts`.
5. Handoff de retorno aberto em `.agents/handoffs/onda-14/15-para-06-criptografia-tokens-crms.md`.

