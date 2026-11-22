# Inventário de Migrações Destrutivas e Planos de Rollback

**Data:** 2026-09-29  
**Responsável:** Agente 01 (Plataforma, Segurança e Dados)  
**Referência:** `docs/security/runbooks/MIGRATION_ROLLBACK.md` | Handoff `00-para-01-migrations-destrutivas-p1.md`  
**Governança:** `prisma/AGENTS.md` (Integridade de Checksums Prisma)

---

## 1. Princípio de Integridade de Migrações Prisma

Conforme `docs/security/runbooks/MIGRATION_ROLLBACK.md` (§ Passo 3, item 3) e `prisma/AGENTS.md`:
> *Nunca edite o arquivo `migration.sql` original de uma migração já aplicada.*  
> O Prisma armazena o checksum SHA-256 de cada arquivo em `_prisma_migrations`. Qualquer edição retroativa em arquivos de migração históricos já aplicados invalida o checksum em ambientes existentes e quebra pipelines de CI/CD (`prisma migrate deploy`).

Por esse motivo, este inventário documenta o catálogo completo das 16 migrações potencialmente destrutivas apontadas na auditoria de tech debt (`P1 - Database`), com sua classificação de impacto, instruções de rollback manual e procedimentos de recuperação de dados.

---

## 2. Catálogo de Migrações com Operações Destrutivas

### 1. `20260717141021_add_lead_enrichment`
- **Operação:** `ALTER TABLE "User" DROP COLUMN "role"; DROP TYPE "Role";`
- **Classificação:** Destrutiva (conversão de tipo enum para texto).
- **Impacto em Dados:** Coluna `role` recriada como `TEXT` com valor padrão `'VISUALIZADOR'`.
- **Procedimento de Rollback:**
  - Caso necessário reverter em banco de dados:
    ```sql
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'SDR', 'BDR', 'CLOSER', 'VISUALIZADOR');
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
    ```
  - Para restauração de permissões originais anteriores à migração, restaurar via backup seletivo (`scripts/local-first/restore-local.ps1` ou `scripts/restore.sh`).

### 2. `20260717183411_sprint3_5_enums_and_cleanup`
- **Operação:** `DROP COLUMN` em `Activity`, `Company`, `Contact`, `Lead`; `DROP TYPE` em enums legados.
- **Classificação:** Destrutiva (remoção de colunas legadas e substituição de enums).
- **Procedimento de Rollback:**
  - Recriação das colunas legadas como `NULLABLE` se houver necessidade de compatibilidade regressiva.
  - Dados históricos destruídos exigem extração cirúrgica de backup anterior a 17/07/2026.

### 3. `20260720235926_sync_accumulated_schema_drift`
- **Operação:** `DROP TABLE "User"` em sincronização de drift acumulado.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - A tabela foi substituída pela estrutura canônica unificada de autenticação e RBAC.
  - Reversão inviável sem restore completo de dump do banco anterior a 20/07/2026.

### 4. `20260721113210_user_passwordhash_optional`
- **Operação:** `ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`
- **Classificação:** Aditiva / Não destrutiva (relaxamento de constraint NOT NULL para suportar SSO/OAuth).
- **Procedimento de Rollback:**
  - Reversão simples:
    ```sql
    ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
    ```

### 5. `20260804203000_bitrix_sync_rule_lead_source`
- **Operação:** `ALTER COLUMN "categoryId" DROP NOT NULL;`
- **Classificação:** Aditiva / Não destrutiva (relaxamento de restrição para permitir regras de sync globais sem categoria).
- **Procedimento de Rollback:**
  - Reversão simples:
    ```sql
    ALTER TABLE "BitrixSyncRule" ALTER COLUMN "categoryId" SET NOT NULL;
    ```

### 6. `20260805220000_two_funnels_and_bitrix_fields`
- **Operação:** `ALTER TABLE "Lead" ALTER COLUMN "status" DROP NOT NULL;`
- **Classificação:** Aditiva (suporte a modelo de duplo funil SDR + Closer).
- **Procedimento de Rollback:**
  ```sql
  ALTER TABLE "Lead" ALTER COLUMN "status" SET NOT NULL;
  ```

### 7. `20260810130000_remove_knowledge_document`
- **Operação:** `DROP TABLE "KnowledgeDocument" CASCADE; DROP TABLE "DocumentChunk" CASCADE;`
- **Classificação:** Destrutiva (descontinuação do RAG legado em favor do vector store dedicado).
- **Procedimento de Rollback:**
  - Se for necessário reativar: reexecutar script de criação de schema das tabelas e repovoar vetores via `npm run setup:db`.

### 8. `20260817134959_onda11_db_cleanup`
- **Operação:** `DROP TABLE "CallSuppression";`
- **Classificação:** Destrutiva (limpeza de tabela legada de supressão de chamadas).
- **Procedimento de Rollback:**
  - Reconstituição de tabela via DDL registrado no histórico do Git caso requerida.

### 9. `20260827200000_drop_dead_ai_governance_models`
- **Operação:** `DROP TABLE` em modelos inativos de governança de IA legados.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Modelos foram consolidados na tabela `AIPendingAction` e `AILog`. Não requer restauração.

### 10. `20260828040000_drop_contact_pii_hash_dec01_superseded`
- **Operação:** `ALTER TABLE "Contact" DROP COLUMN "piiHash";`
- **Classificação:** Destrutiva (remoção de coluna de hash superada pela criptografia determinística blind-index).
- **Procedimento de Rollback:**
  - A coluna foi superada pela implementação de blind index com chave criptográfica (`docs/security/PII_ENCRYPTION.md`). Rollback contraindicado por segurança.

### 11. `20260908020000_multi_cargo_agent_governance_foundation`
- **Operação:** `DROP TABLE` em estruturas intermediárias de agentes de runtime.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Migração consolidou a governança de enxame autônomo. Procedimento conforme Passo 2 de `MIGRATION_ROLLBACK.md`.

### 12. `20260908090000_public_booking_link_create_and_rls`
- **Operação:** Remoção/substituição de tabelas de agendamento público.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Manter RLS ativo; restore cirúrgico de links de agendamento via `AuditLog` se necessário.

### 13. `20260909131444_saved_view`
- **Operação:** `DROP TABLE` de tabela temporária durante migração de visualizações salvas.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Visualizações recriadas no model `SavedView` oficial.

### 14. `20260913000100_notes_cross_entity_and_attachments`
- **Operação:** Remoção de colunas redundantes em `Company` e `Contact` para notas unificadas.
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Dados migrados para a entidade unificada `Note`. Reverter exigiria script de extração inversa de `Note` para os models pais.

### 15. `20260918151000_remove_legacy_nba_shadow_domain`
- **Operação:** `DROP TABLE` do domínio sombra legado de Next Best Action (NBA).
- **Classificação:** Destrutiva.
- **Procedimento de Rollback:**
  - Funcionalidade incorporada na Central de Inteligência Comercial e Enxame de IA.

### 16. `20260920010000_data007_organizationid_not_null_guarded`
- **Operação:** Limpeza e aplicação de `NOT NULL` em colunas `organizationId` após backfill.
- **Classificação:** Aditiva com trava defensiva (garante isolamento estrito multi-tenant).
- **Procedimento de Rollback:**
  - `ALTER TABLE ... ALTER COLUMN "organizationId" DROP NOT NULL;` (não recomendado por violar isolamento RLS).

---

## 3. Diretriz para Migrações Futuras

A partir da sprint de governança atual:
1. Toda nova migração gerada por `prisma migrate dev` que contiver comandos destrutivos (`DROP COLUMN`, `DROP TABLE`, `TRUNCATE`) DEVE obrigatoriamente incluir no cabeçalho do arquivo `migration.sql` o bloco:
   ```sql
   -- ROLLBACK: <descrição do procedimento de reversão ou indicação de restore via backup>
   ```
2. Migrações futuras devem adotar o padrão **Expand/Contract** (adicionar coluna/tabela nova, backfill assíncrono, descontinuar coluna antiga somente após 1 ciclo de release).
