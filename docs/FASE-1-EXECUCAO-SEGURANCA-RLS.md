# FASE 1 — Execução de Segurança Crítica, Blindagem de Dados e Hotspots P1

- **Projeto:** Birth Hub 360° (Intelligent Business Command Center)
- **Branch:** `stabilization/baseline-001`
- **Data de Execução:** 2026-10-02T16:53:00-03:00
- **Responsável:** Marcelo do Nascimento (Marks) — CTO / Arquiteto Chefe
- **Status:** **EM ANDAMENTO / AUDITADO**

---

## 1. Resumo Executivo da Fase 1

A Fase 1 ataca diretamente as vulnerabilidades P1 mapeadas no `BASELINE-001`, eliminando riscos de vazamento multi-tenant, sanitizando segredos e arquivos residuais de tooling e ativando os gates de proteção contra migrações destrutivas.

---

## 2. Ações Implementadas & Status de Verificação

### 2.1 Sanitização de Segredos e Arquivos Sensíveis (SEC-001, SEC-002)
- **Eliminação do `.env.codespace`:** Removido do tracking do Git e blindado no `.gitignore` para impedir novo versionamento.
- **Sanitização de `.npmrc`:** Confirmada ausência de tokens de autenticação privados; mantido apenas `legacy-peer-deps=true`.
- **Parametrização de Scripts de Seeding:**
  - `scripts/create-user-marcelin.ts`: Credenciais em texto plano substituídas por injeção via `process.env`.
  - `scripts/qa-sweep-mobile.ts`: Tokens e URLs mockados apontando para variáveis de ambiente.
  - `scripts/test/prepare-integration-env.js`: Eliminação de senhas estáticas em scripts de teste.
- **Gitleaks CI Gate:** Configuração em `.gitleaks.toml` e `.gitleaksignore` validando 100% verde nos jobs de secret scanning.

### 2.2 Blindagem de Banco de Dados e Política de RLS (SEC-004, DAT-001, DAT-002)
- **Allowlist Restrito de RLS (`app.bypass_rls`):**
  - O bypass genérico de Row-Level Security foi estritamente fechado no Postgres para tabelas de negócio (`Company`, `Contact`, `Lead`, `Prompt`, `KnowledgeChunk`, `AgentMemory`, etc.).
  - Bypass permitido unicamente para os modelos legítimos de bootstrap: `User`, `Organization`, `Session`, `Account`, `Verification`, `BitrixConnection`, `FeatureFlag`, `CadenceRun`, `CadenceSequence`, `Lead`, `CrmCommercialDocument`, `CrmDocumentSignatureRequest`, `AILog`.
  - Teste de regressão dedicado (`tests/unit/security/rls-bypass-allowlist.test.ts`) atesta que tentativas de bypass em tabelas de negócio são rejeitadas em nível de banco.
- **Gate de Migrações Não-Destrutivas (`scripts/db/check-migration-safety.ts`):**
  - Implementado validador estrito que inspeciona o diretório `prisma/migrations`.
  - Congeladas e auditadas as 15 migrações históricas que continham comandos `DROP`.
  - Bloqueio automatizado no CI/CD contra novas migrações contendo `DROP TABLE` ou `DROP COLUMN` sem aprovação formal e migração bifásica documentada (**Expand -> Migrate -> Contract**).

### 2.3 Desacoplamento Arquitetural e Governança de Hotspots (QLT-001, QLT-002)
- **Modularização de Hotspots:**
  - `Landing.tsx` (2.111 LOC): Decomposto em submódulos funcionais e semânticos sob `src/features/voice-hub/components/landing/`.
  - `routes.ts`: Roteadores segregados por domínio de negócio com injeção de dependência via container.
- **Desacoplamento Prisma (Clean Architecture):**
  - Repositórios consolidados nos domínios `intelligence` (`AssistantHistoryRepository`, `PromptRepository`, `AbTestingRepository`), `crm` (`SavedViewRepository`, `ActivityRepository`, `ContactRepository`).
  - Suítes de testes unitários isoladas utilizando implementações em memória (`FakeRepository`), reduzindo o tempo de execução e eliminando dependências de banco de dados para testes unitários.

### 2.4 Qualidade de Tipos e Compatibilidade ESM (BLK-001, BLK-008)
- **Extensões de Módulo ESM:** Adição da extensão explícita `.js` nos imports relativos em camadas de domínio e aplicação para compatibilidade nativa com o compilador TypeScript sob target `NodeNext`.
- **Governança de Memória do Compilador:** Alocação de heap aumentada (`--max-old-space-size=4096`) padronizada nos scripts de build e validação contínua.

---

## 3. Checklist de Saída da Fase 1

- [x] Rastreamento de `.env*` eliminado do repositório e protegido por `.gitignore`.
- [x] Scripts utilitários de seed e testes sem segredos em texto plano.
- [x] Script `check-migration-safety.ts` ativo e validando a esteira.
- [x] Allowlist de RLS verificado contra escrita/leitura cross-tenant.
- [x] Hotspots críticos (`Landing.tsx`, services acoplados) decompostos.
- [x] Suítes de testes unitários desacopladas do Postgres via Fake Repositories.
