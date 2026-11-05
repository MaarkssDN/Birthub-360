# Relatório de Auditoria de Dívidas Técnicas — Agente 15

## IDENTIFICAÇÃO
- **ID do agente:** 15
- **Nome oficial:** Segurança Aplicada e Rotação de Segredos
- **Especialização:** Criptografia em repouso e em trânsito (AES-256-GCM, TLS), rotação programada de segredos e credenciais, sanitização de logs e prevenção de vazamento de chaves/tokens, proteção CSRF/CORS, segurança de autenticação e blind indexes
- **Responsabilidades:** Implementação dos serviços de criptografia de credenciais de integração em repouso, execução de runbooks de rotação de chaves (`docs/security/runbooks/**`), auditoria contínua de segredos em código e logs (Gitleaks, varreduras estáticas), sanitização de dados sensíveis e proteção de cabeçalhos HTTP.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/lib/security/**`, `docs/security/**`, `scripts/security/**`, `server.ts`, fluxos de log de autenticação e criptografia de chaves no banco.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Gerenciador de criptografia (`encryption.service.ts`), blind index hasher, runbooks de rotação de credenciais, scripts de auditoria de waivers de segurança (`check-audit-waivers.ts`).
- **Arquivos relevantes:**
  - `src/lib/security/encryption.ts`
  - `src/lib/security/blindIndex.ts`
  - `src/features/auth/server/auth.service.ts`
  - `server.ts` (configurações de CORS, Helmet e Cookies)
  - `docs/security/ROTACAO_SEGREDOS.md`
  - `scripts/security/check-audit-waivers.ts`
- **Serviços existentes:** `EncryptionService` (AES-256-GCM com IV aleatório e Auth Tag), `BlindIndexService` (HMAC-SHA256 com chave dedicada), `SecretRotationManager`.
- **APIs e integrações:** Webhooks assinados via HMAC, AWS KMS / S3 Object Lock para retenção e ancoragem de hashes.
- **Funcionalidades implementadas:** Criptografia transparente de tokens do Bitrix24 e Bland AI antes da gravação no PostgreSQL, mascaramento de senhas em logs de erro, blind index para busca de leads sem descriptografia em massa.
- **Testes encontrados:** `tests/unit/security/encryption.test.ts`, `tests/unit/security/blindIndex.test.ts`, `scripts/security/check-audit-waivers.ts`.
- **Dependências externas:** `crypto` (nativo do Node.js), `helmet`, `cors`, `argon2`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-15-001 (DEBT-SEC-001)
- **Título:** URLs de autenticação com tokens mágicos e links de redefinição de senha escritas em texto puro em logs
- **Categoria:** Segurança da Informação e Segredos
- **Severidade:** Crítica
- **Status:** Confirmada
- **Localização:** `src/features/auth/server/auth.service.ts` (linhas 210-235)
- **Evidência:** No método de envio de link mágico ou redefinição de senha, quando a variável de ambiente `SMTP_HOST` não está configurada (modo de fallback local/desenvolvimento), o serviço executa:
  `console.log(`[AUTH-FALLBACK] Link de login: ${appUrl}/auth/verify?token=${rawToken}`);`
  Esse log é emitido diretamente no stdout/stderr do processo Node.js.
- **Problema:** Em ambientes de homologação ou containers locais conectados a agregadores de logs compartilhados (ex.: Datadog, CloudWatch, Papertrail), os tokens de sessão e redefinição de senha de usuários reais ficam indexados e visíveis para qualquer pessoa ou serviço com acesso aos logs da infraestrutura.
- **Causa raiz:** Facilitação temporária de depuração mantida ativa fora de ambiente de teste puro.
- **Impacto:** Comprometimento total de contas de usuários administrativos caso os logs de aplicação sejam acessados por terceiros ou sofram vazamento; violação direta do Bloqueador B-04 (`AGENTS.md` §22).
- **Correção necessária:** Suprimir a exibição do token completo nos logs, registrando apenas os 4 primeiros caracteres (`token.substring(0, 4) + '***'`) ou condicionar a exibição exclusivamente quando `process.env.NODE_ENV === 'test'` com variável explícita `ALLOW_INSECURE_AUTH_LOGS=true`.
- **Agente proprietário:** 15
- **Agentes dependentes:** 01 (Autenticação), 24 (Auditoria Independente)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P0
- **Critério de aceite:** O stdout nunca exibe tokens mágicos completos; logs em modo fallback registram apenas a emissão do token sem expor a URL completa utilizável.
- **Teste necessário:** Teste automatizado interceptando `console.log` durante a geração de token mágico e garantindo 0 ocorrências do token cru no output.
- **Dependências:** Nenhuma.

### ID: DIV-15-002
- **Título:** Criptografia de credenciais em repouso sem suporte a envelope encryption e versionamento de chaves
- **Categoria:** Segurança e Criptografia
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/lib/security/encryption.ts` (linhas 35-70), `docs/security/ROTACAO_SEGREDOS.md`
- **Evidência:** O método `encrypt` cifra os dados usando uma única chave mestra `process.env.INTEGRATION_SECRETS_KEY`. O payload cifrado gravado no banco tem o formato `iv:authTag:ciphertext`, sem incluir um identificador da versão da chave utilizada (`keyVersionId`).
- **Problema:** Quando a chave mestra precisa ser rotacionada periodicamente (conforme exigido pela política de segurança), é impossível decodificar registros antigos com a chave anterior sem re-criptografar imediatamente toda a base de dados em uma única transação massiva de parada. Se a re-criptografia falhar no meio, a base fica parcialmente indecifrável.
- **Causa raiz:** O formato de envelope criptográfico não previu metadados de versionamento de chaves (Key Rotation Grace Period).
- **Impacto:** Risco elevado de corrupção ou perda permanente de acesso a tokens de integração do Bitrix24 e telefonia durante processos de rotação de chaves.
- **Correção necessária:** Adicionar prefixo de versão no payload criptografado (`v1:iv:authTag:ciphertext`) e permitir que o `EncryptionService` armazene uma lista de chaves anteriores para decodificação em período de transição (grace period).
- **Agente proprietário:** 15
- **Agentes dependentes:** 01 (Banco de Dados), 06 (Integrações)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** O serviço decodifica com sucesso dados cifrados com a chave v1 mesmo após a ativação da chave v2 como padrão de escrita.
- **Teste necessário:** Teste unitário de rotação de chaves com dados cifrados em múltiplas versões.
- **Dependências:** Nenhuma.

### ID: DIV-15-003
- **Título:** Configuração permissiva de CORS em server.ts para clientes externos
- **Categoria:** Segurança e Configuração
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `server.ts` (linhas 120-145)
- **Evidência:** O middleware de CORS em `server.ts` aceita `origin: true` ou regex aberta para requisições de origens com portas locais (ex.: `localhost:*`), estendendo essa flexibilização caso a variável `NODE_ENV` não esteja explicitamente configurada como `production`.
- **Problema:** Se a aplicação for implantada em ambiente de homologação ou staging sem a flag `NODE_ENV=production` estrita, ela permite requisições cross-origin de qualquer site malicioso rodando em portas locais da máquina do usuário.
- **Causa raiz:** Facilitação para permitir que o app mobile e o frontend Vite rodem em portas dinâmicas sem bloqueio de CORS no desenvolvimento.
- **Impacto:** Risco de Cross-Origin Request Forgery e roubo de dados via scripts de terceiros em ambientes de homologação.
- **Correção necessária:** Especificar lista branca estrita de origens permitidas baseada em array de domínios confiáveis (`CORS_ALLOWED_ORIGINS`), recusando conexões de origens desconhecidas por padrão (fail-closed).
- **Agente proprietário:** 15
- **Agentes dependentes:** 00 (Aprovação em `server.ts`), 09 (Mobile)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Requisições com cabeçalho `Origin` não listado explicitamente na variável `CORS_ALLOWED_ORIGINS` recebem status 403 Forbidden.
- **Teste necessário:** Teste de integração de requisições OPTIONS e POST com origens autorizadas e não autorizadas.
- **Dependências:** Autorização formal do Agente 00 para edição do `server.ts`.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (criptografia AES-256-GCM e blind indexes implementados).
- **Cobertura automatizada de testes:** Alta (testes de criptografia, geração de hash e blind index verdes).
- **Segurança:** Média (degradada pela presença de logs de tokens de autenticação sem mascaramento).
- **Arquitetura:** Alta (módulos de segurança isolados e reutilizáveis).
- **Confiabilidade:** Alta (algoritmos criptográficos consolidados e livres de implementações caseiras).
- **Observabilidade:** Alta (scripts de verificação de waivers e histórico de auditorias).
- **Manutenibilidade:** Alta (runbooks de rotação de credenciais detalhados em markdown).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Mascarar imediatamente os tokens de login nos logs de fallback do `auth.service.ts` (DIV-15-001 - P0).
2. **Segurança e integridade de dados:** Implementar versionamento de chaves no payload criptografado (DIV-15-002).
3. **Falhas funcionais:** Endurecer a lista branca de CORS em `server.ts` no modo fail-closed (DIV-15-003).
4. **Confiabilidade:** Executar varredura automática de credenciais nos commits de CI com Gitleaks.
5. **Testes:** Criar testes de regressão contra vazamento de segredos em mensagens de erro de API.
6. **Arquitetura:** Padronizar todos os segredos para injeção via AWS Secrets Manager / KMS.
7. **Melhorias estruturais:** Implementar rotação automatizada sem downtime para chaves de sessão.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 1 Crítica, 1 Alta, 1 Média, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-15-001, DIV-15-002)
- **Problemas compartilhados:** 1 (DIV-15-003 compartilhado com 00 e 09)
- **Handoffs necessários:**
  - Handoff para 00: Autorização formal para saneamento de regras de CORS em `server.ts`.
- **Riscos mais importantes:** A emissão de URLs com tokens de login válidos em stdout de containers representa risco imediato de sequestro de contas; falta de versionamento em chaves de criptografia torna o processo de rotação de alta periculosidade.
- **Recomendação final:** Aplicar imediatamente o patch de mascaramento de tokens em `auth.service.ts`.
