# AUDITORIA DA FUNDAÇÃO TRANSVERSAL: ARQUITETURA, SEGURANÇA E DADOS (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Em conformidade com:** `AGENTS.md` (Slots 01, 01A, 10, 15, 21)  
**Status:** CONCLUÍDO — RISCOS E SALVAGUARDAS IDENTIFICADOS

---

## 1. Multi-Tenancy e Segurança

### 1.1 Isolamento por `organizationId`
- **Situação Atual:** A maioria das consultas utiliza o middleware `requireTenant` em `src/bootstrap/routes.ts`, injetando `req.organizationId`.
- **Vulnerabilidade Identificada:** Algumas queries no `PrismaAnalyticsRepository.ts` e rotas legadas recebem IDs sem validação cruzada se o registro pertence ao mesmo tenant, confiando apenas no ID do parâmetro (`BT360-DT-0004`).
- **Salvaguarda Exigida:** Habilitação obrigatória de Row-Level Security (RLS) no PostgreSQL em conjunto com o Client Extension do Prisma que injeta o filtro de tenant em 100% das queries.

### 1.2 Políticas PostgreSQL RLS
- **Auditoria de Banco:** O script `prisma/schema.prisma` define os modelos, mas as políticas RLS nativas do PostgreSQL precisam de migração dedicada para criar as policies de `tenant_isolation_policy` sobre todas as tabelas transacionais.

### 1.3 Autenticação, Senhas e Redação de Segredos
- **Criptografia de Senhas:** O sistema utiliza hash PHC Argon2id com retrocompatibilidade Scrypt para legado do Better Auth, validado com 100% de sucesso em `tests/unit/auth/antessala-auth-homologation.test.ts`.
- **Vulnerabilidade Crítica P0 Identificada (`BT360-DT-0072`):** O script `scripts/verify-auth-log-redaction.mjs` falhou porque `src/lib/auth.ts` ainda loga o objeto contendo o `resetUrl` (token em claro) quando `NODE_ENV !== 'production'`.
- **Ação Mandatória:** Redação incondicional do token em todos os ambientes e remoção de qualquer log contendo URLs de autenticação.

### 1.4 LGPD e Privacidade (Agente 21)
- O sistema possui o serviço `src/lib/security/consentAuditChain.service.ts` que constrói uma cadeia imutável de consentimentos e hash encadeado.
- Anonimização de titulares conta com blind index para busca segura sem expor PII.

---

## 2. Persistência e Banco de Dados (Agentes 01 e 01A)

### 2.1 Schema Prisma e Integridade
- **Volume:** 160 modelos relacionais bem tipados, com chaves estrangeiras explícitas e índices de busca.
- **Verificação de Drift:** O comando `npm run verify:migration-drift` confirmou **0 diferenças** entre o schema e a base de migrations.
- **Prevenção de Locks e Downtime:** Migrações que alteram tabelas massivas (`Lead`, `Company`, `Activity`) devem evitar locks exclusivos de tabela (`ACCESS EXCLUSIVE`) utilizando `CONCURRENTLY` para índices.

### 2.2 Concorrência e Alocação de Quotas
- O consumo de créditos em APIs pagas de enriquecimento (`AC-MKT-003`) exige transação isolada com trava pessimista (`SELECT FOR UPDATE`) para evitar saldo negativo em requisições paralelas.

---

## 3. Infraestrutura e Serviços Auxiliares (Agentes 10 e 16)

### 3.1 Pilha de Serviços Docker
- **PostgreSQL 16:** Extensão `pgvector` ativa para busca semântica em embeddings de 1536 dimensões.
- **Redis 7:** Broker de mensagens para BullMQ, lock distribuído com Redlock e cache L1/L2.
- **Meilisearch:** Motor de busca instantânea para auto-complete de empresas e contatos.
- **MinIO:** Armazenamento S3-compatible para anexos, propostas em PDF e gravações de áudio.
- **Ollama / LiteLLM:** Gateways locais para inferência de modelos open-source com fallback para APIs de nuvem.

### 3.2 Filas e Workers BullMQ
- Filas dedicadas: `cadenceQueue`, `bitrixQueue`, `enrichmentQueue`, `aiExecutionQueue`, `webhookQueue`.
- **Vulnerabilidade:** Falta padronização de Dead-Letter Queues (DLQ) com alerta Prometheus quando jobs atingem o limite máximo de retentativas (`BT360-DT-0076`).

---

## 4. Integrações Externas (Agentes 06 e 06A)

| Integração | Status Técnico | Mecanismo de Proteção | Cobertura de Testes | Diagnóstico |
| :--- | :---: | :--- | :---: | :---: |
| **Bitrix24** | Ativo | Leaky bucket rate limiter (2 req/s) | Média | CORRIGIR (Modularizar painel) |
| **WhatsApp** | Ativo | Gateway Baileys com reconexão auto | Alta | PRESERVAR |
| **Telefonia / 3CX** | Ativo | WebRTC SIP bridge com áudio seguro | Alta (PII validado) | PRESERVAR |
| **Receita Federal / CNPJ** | Ativo | Cache de dados cadastrais (30 dias)| Média | PRESERVAR |
| **Apollo / Hunter** | Ativo | Débito atômico de créditos | Média | CORRIGIR (Trava de saldo) |
| **Stripe / Omie** | Ativo | Webhooks com validação de assinatura| Alta | PRESERVAR |
