# Checklist de Segurança para Migrações Zero-Downtime (Bloqueador B-05 & B-10)
**Squad 10 — Vera (Migrações e Rollouts) & Pietro (Schema)**  
**Projeto:** Birth Hub 360°  
**Data:** 20/11/2026  
**Status:** ATIVO & HOMOLOGADO

---

## 1. Diretriz Bloqueador B-05: Proibição de DEFAULT Dinâmico em Colunas NOT NULL
Em tabelas com alto volume de escrita (ex: `Lead`, `Activity`, `TimelineEvent`, `Contact`), a execução de:
```sql
-- ANTI-PATTERN (Causa Lock Exclusivo ACCESS EXCLUSIVE e reescrita de tabela):
ALTER TABLE "Lead" ADD COLUMN "processedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
```
Trava novas conexões e requisições concorrentes, resultando em downtime e timeouts nos clientes HTTP e workers.

### Padrão Canônico Zero-Downtime (3 Fases):
1. **Fase 1 (Adição Nullable):**
   ```sql
   ALTER TABLE "Lead" ADD COLUMN "processedAt" TIMESTAMP WITH TIME ZONE;
   ```
2. **Fase 2 (Definição de Default para Novas Linhas):**
   ```sql
   ALTER TABLE "Lead" ALTER COLUMN "processedAt" SET DEFAULT now();
   ```
3. **Fase 3 (Backfill em Lote):**
   Preencher registros legados em transações de tamanho limitado (ex: 5.000 linhas) sem travar a tabela inteira.
4. **Fase 4 (Validação da Restrição Not Null):**
   ```sql
   ALTER TABLE "Lead" ADD CONSTRAINT "check_processed_at_not_null" CHECK ("processedAt" IS NOT NULL) NOT VALID;
   ALTER TABLE "Lead" VALIDATE CONSTRAINT "check_processed_at_not_null";
   ```

---

## 2. Diretriz Bloqueador B-10: Índices Compostos Multi-Tenant (RLS)
Todas as tabelas protegidas por políticas de Row-Level Security (`organizationId = app.current_tenant_id`) DEVEM possuir índices compostos com `organizationId` na primeira posição para eliminar `Seq Scan` em consultas com filtros secundários.

### Exemplos Homologados no Schema:
- `@@index([organizationId, createdAt])` (Listagem cronológica)
- `@@index([organizationId, leadId])` (Relacionamentos de domínio)
- `@@index([organizationId, status])` (Filtros de funil/kanban)
- `@@index([organizationId, channel, isActive])` (Varreduras de cadência)
