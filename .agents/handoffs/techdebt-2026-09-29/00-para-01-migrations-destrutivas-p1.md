- De: 00 (Coordenador)
- Para: 01 (Plataforma, Segurança e Dados)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: bloqueador

## Problema

Auditoria de tech debt identificou 16 migrations potencialmente destrutivas em `prisma/migrations/**`. Todas contêm operações DROP que podem causar perda de dados em produção.

## Arquivo(s) envolvido(s)

- `prisma/migrations/20260717141021_add_lead_enrichment/migration.sql` - DROP COLUMN role (User)
- `prisma/migrations/20260717183411_sprint3_5_enums_and_cleanup/migration.sql` - DROP COLUMN em Activity, Company, Contact, Lead; DROP TYPE enums
- `prisma/migrations/20260720235926_sync_accumulated_schema_drift/migration.sql` - DROP TABLE User
- `prisma/migrations/20260721113210_user_passwordhash_optional/migration.sql` - DROP COLUMN passwordHash
- `prisma/migrations/20260804203000_bitrix_sync_rule_lead_source/migration.sql` - DROP COLUMN categoryId
- `prisma/migrations/20260805220000_two_funnels_and_bitrix_fields/migration.sql` - DROP COLUMN status (Lead)
- `prisma/migrations/20260810130000_remove_knowledge_document/migration.sql` - DROP TABLE
- `prisma/migrations/20260817134959_onda11_db_cleanup/migration.sql` - DROP TABLE CallSuppression
- `prisma/migrations/20260827200000_drop_dead_ai_governance_models/migration.sql` - DROP TABLE
- `prisma/migrations/20260828040000_drop_contact_pii_hash_dec01_superseded/migration.sql` - DROP COLUMN
- `prisma/migrations/20260908020000_multi_cargo_agent_governance_foundation/migration.sql` - DROP TABLE
- `prisma/migrations/20260908090000_public_booking_link_create_and_rls/migration.sql` - DROP TABLE
- `prisma/migrations/20260909131444_saved_view/migration.sql` - DROP TABLE
- [Mais 3 migrations listadas no audit completo]

## Alteração necessária

Para cada migration destrutiva:

1. Classificar se é aditiva ou destrutiva seguindo `docs/security/runbooks/MIGRATION_ROLLBACK.md`
2. Para destrutivas: adicionar bloco `-- ROLLBACK:` comentado no próprio `migration.sql` com instruções de rollback manual
3. Documentar estratégia de backup/restore antes de aplicar
4. Se a migration já foi aplicada em produção: verificar se há dados afetados e mitigar risco futuro
5. Considerar refatorar migrations futuras para usar padrão expand/contract sempre que possível

## Teste esperado

- `prisma validate` e `prisma generate` passam
- Cada migration com bloco ROLLBACK tem instruções executáveis
- Documentação atualizada sobre quais migrations são destrutivas e procedimento de emergência

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Estas 16 migrations são classificadas como P1 no audit de tech debt (Database). O risco é perda de dados em produção se rollback for necessário sem procedimento documentado.

Referência: AGENTS.md em `prisma/AGENTS.md` define que apenas Agente 01 pode editar migrations.

## Resolução (Agente 01)

1. **Governança de Integridade de Checksums Prisma Respeitada:**
   - Conforme `docs/security/runbooks/MIGRATION_ROLLBACK.md` e `prisma/AGENTS.md`, arquivos históricos de `migration.sql` já aplicados em produção não podem ser alterados retroativamente sem invalidar o SHA-256 verificado pelo Prisma em `_prisma_migrations` nos ambientes de homologação e CI/CD.
2. **Inventário Completo de Migrações Destrutivas Criado:**
   - Criado `docs/security/runbooks/DESTRUCTIVE_MIGRATIONS_INVENTORY.md` catalogando todas as 16 migrações identificadas com comandos `DROP`, detalhando a classificação de cada uma (aditivas vs destrutivas irreversíveis sem backup), seu impacto concreto e instruções de rollback manual e restore cirúrgico.
3. **Validação do Schema e Prisma CLI:**
   - `npx prisma validate` executado com sucesso.
   - `npx prisma generate` executado com sucesso.
   - Padrão **Expand/Contract** e inclusão prospectiva obrigatória de `-- ROLLBACK:` para migrações futuras formalizados.

