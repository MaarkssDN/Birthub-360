---
name: prisma-migration-safety
description: Diretrizes e checklist para migrações Prisma com zero-downtime no PostgreSQL. Previne lock exclusivo em tabelas grandes, perda acidental de dados, renomeações perigosas e quebra de contratos em produção.
---

# Prisma Migration Safety — Birth Hub 360

## Objetivo
Garantir que alterações em `prisma/schema.prisma` e `prisma/migrations/` sejam executadas em produção sem indisponibilidade (zero-downtime) e sem risco de lock de tabelas de alto volume (ex: `Lead`, `AuditLog`, `CrmDealItem`).

## Regras de Migração Segura

### 1. Adição de Novas Colunas
- **Nunca** adicione coluna `NOT NULL` sem valor `@default(...)` em tabelas existentes com dados.
- Prefira tornar a coluna opcional primeiro (`String?`), rodar o backfill de dados via script e, em uma migração posterior, aplicar a restrição `NOT NULL`.

### 2. Renomeação de Coluna ou Tabela
- O Prisma por padrão gera `DROP COLUMN` + `ADD COLUMN`, destruindo os dados existentes.
- **Protocolo Expand & Contract:**
  1. Adicione a nova coluna.
  2. Duplique escritas na aplicação para preencher ambas.
  3. Execute o backfill dos dados antigos.
  4. Mude as leituras para a nova coluna.
  5. Remova a coluna legada em migração separada.

### 3. Índices Concorrentes
- No PostgreSQL de produção, adicionar índices normais trava escritas na tabela.
- Para tabelas volumosas, edite o SQL da migration gerada para usar `CREATE INDEX CONCURRENTLY` e remova o wrapper de transação (`-- prisma:disable-atomic-migration`).

### 4. Soft Delete (`deletedAt`)
- Ao adicionar suporte a soft-delete em um modelo, certifique-se de que a coluna `deletedAt DateTime?` exista na migration antes de registrá-lo em `auditableModels` em `src/lib/prisma.ts`.

## Checklist Pré-Merge
- [ ] A migration foi testada localmente com `npx prisma migrate dev`?
- [ ] O schema gera o cliente sem erros (`npx prisma generate`)?
- [ ] Nenhuma coluna preexistente contendo dados reais está sendo apagada sem script de backup/depreciação?
- [ ] RLS policies continuam válidas sobre a nova tabela/coluna?
