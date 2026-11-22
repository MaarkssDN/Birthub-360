- De: 15 (Segurança Aplicada e Rotação de Segredos)
- Para: 06 (Integrações e Bitrix)
- Onda: 14
- Status: resolvido
- Prioridade: alto

## Contexto
Em resposta ao handoff `06-para-15-criptografia-tokens-crms.md`, o Agente 15 disponibilizou a infraestrutura oficial de proteção, mascaramento e rotação para as credenciais dos novos conectores de CRM (`hubspot`, `pipedrive`, `rdstation`, `monday`).

## Instruções de Consumo para o Agente 06

1. **Criptografia e Decriptografia de Credenciais:**
   Importe os métodos canônicos de `src/lib/security/credentialCrypto.ts`:
   ```ts
   import { encryptCredential, decryptCredential } from '@/lib/security/credentialCrypto.js';

   // Ao salvar tokens recebidos via OAuth ou formulário:
   const encryptedToken = await encryptCredential(rawToken);

   // Ao ler do banco para efetuar chamadas externas:
   const plainToken = await decryptCredential(encryptedToken);
   ```

2. **Sanitização Estrita de Logs e Headers HTTP:**
   Ao efetuar chamadas HTTP via Axios / Fetch ou emitir logs pelo Pino (`logger`):
   ```ts
   import { redactHeaders, sanitizeObjectForLogging } from '@/lib/security/credentialCrypto.js';

   // Sanitizar cabeçalhos antes de logar erros de requisição:
   logger.error({ headers: redactHeaders(requestHeaders) }, 'Erro na requisição ao Hubspot');

   // Sanitizar payloads de erro ou resposta:
   logger.debug({ payload: sanitizeObjectForLogging(responseBody) }, 'Resposta recebida da API externa');
   ```

3. **Compatibilidade com Rotação de Chaves:**
   O envelope gerado (`enc:v1:...`) é 100% compatível com a nova Política Global de Rotação de Segredos e com o script de re-encriptação `scripts/security/reencrypt-credentials.ts`.
