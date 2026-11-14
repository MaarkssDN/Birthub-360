# MEL-18 — Decisão: split do `prisma/schema.prisma` (169+ models)

- **Demanda:** DEM-20261113-004 (Onda 3)
- **Agente:** 01 — Plataforma, Segurança e Dados
- **Data:** 2026-11-13
- **Status:** decisão registrada — **NÃO executar agora; viável tecnicamente, adiar para onda dedicada**

## 1. Pergunta

O `prisma/schema.prisma` tem ~6.000 linhas e ~169 models/56 enums. Vale a pena dividi-lo
em múltiplos arquivos `.prisma` por domínio? Se sim, quando e com qual plano?

## 2. Fatos verificados

### 2.1 Suporte da versão do projeto

- Projeto usa **Prisma `7.10.0`** (`package.json`: `prisma`, `@prisma/client`,
  `@prisma/adapter-pg` todos `^7.10.0`).
- Multi-file schema (`prismaSchemaFolder`) é **Generally Available desde o Prisma 6.7.0** —
  não exige preview feature. No Prisma 7 o recurso é configurado apontando `schema` do
  `prisma.config.ts` para o **diretório** (não para o arquivo).
- Bug conhecido do 7.0.0 ([prisma/prisma#28673](https://github.com/prisma/prisma/issues/28673)):
  com `schema: 'prisma/schema.prisma'` os arquivos irmãos eram ignorados silenciosamente;
  o workaround documentado é `schema: 'prisma'` (diretório). Presumivelmente resolvido em
  7.10, mas **exige spike de validação** antes de qualquer split real.
- `relations`/`@@index`/enums funcionam entre arquivos sem imports; `prisma generate`,
  `validate`, `format` e `migrate` operam sobre o schema combinado — drift de migrations
  **não aumenta** por si só (o diff continua sendo gerado do datamodel mesclado).

### 2.2 Estado atual do projeto

- `prisma.config.ts` (linha 54): `schema: 'prisma/schema.prisma'` — precisaria virar
  `schema: 'prisma'` (diretório).
- `package.json` script `verify:migration-drift` (gate não-bloqueante no CI,
  `.github/workflows/ci.yml` ~linha 282): `prisma migrate diff ... --to-schema
  prisma/schema.prisma` — precisaria apontar para o diretório. **`package.json` exige
  aprovação explícita do Agente 00** (AGENTS.md §15).

### 2.3 Consumidores que leem `prisma/schema.prisma` como TEXTO (quebrariam num split)

| Arquivo | Uso |
|---|---|
| `scripts/security/check-rls-coverage.ts:19` | `SCHEMA_PATH = prisma/schema.prisma`, `readFileSync` para classificar models com `organizationId` |
| `scripts/db/audit-database-governance.ts:292` | `resolve(cwd, 'prisma/schema.prisma')` para auditoria de governança |
| `scripts/lgpd/ropa-inventory.ts:26` | `SCHEMA_PATH` — inventário LGPD lê anotações de PII em comentários do schema |
| `tests/unit/db/rls-coverage.test.ts:52` | lê o arquivo para cobertura RLS |
| `tests/unit/db/databaseGovernance.test.ts:70` | idem |
| `tests/unit/security/reencryptTargetsContract.test.ts:20` | `readFileSync('prisma/schema.prisma')` — contrato de campos criptografados |
| `prisma/AGENTS.md` | documentação assume arquivo único |

Cada um desses precisaria ser migrado para ler o **diretório** `prisma/` e concatenar os
`.prisma`, ou para usar `Prisma.dmmf` (já disponível via `@prisma/client` gerado, como faz
`src/lib/tenant-scoping-registry.ts`). Trabalho real, mas mecânico.

### 2.4 Conflitos de merge

- Hoje **todo** handoff de schema converge para o Agente 01 (propriedade exclusiva,
  `prisma/**`), então a serialização de escritas já existe por governança — o split **não
  elimina** o gargalo de revisão, mas reduz o tamanho do diff por mudança e facilita
  revisão (diff de 80 linhas num arquivo de domínio vs. num arquivo de 6.000).
- Risco novo: modelos relacionados que hoje ficam adjacentes no mesmo arquivo podem ser
  movidos para arquivos diferentes por agentes diferentes em branches paralelas →
  conflitos de "arquivo novo" são improváveis (cada domínio tem seu arquivo), mas
  **convenção de fronteira de domínio precisa ser decidida antes** (ver plano).
- Risco de drift: se dois agentes editarem o mesmo model em arquivos diferentes por erro
  de fronteira → erro de validação do Prisma (model duplicado), detectável em CI —
  falha ruidosa, não silenciosa. Baixo risco.

## 3. Recomendação

**Fazer — mas NÃO nesta onda. Adiar para uma onda dedicada de saneamento do schema.**

Justificativa:

1. **Viabilidade confirmada**: a versão (7.10) suporta nativamente; não é bloqueio técnico.
2. **Custo de migração real e distribuído**: ≥3 scripts de segurança/LGPD, ≥3 testes,
   `package.json` (gate do 00), `prisma.config.ts`, `.github/workflows/ci.yml` (passo de
   drift), `prisma/AGENTS.md` e possivelmente docs/runbooks precisam ser atualizados na
   mesma entrega — um "big bang" de ~10 arquivos fora de `prisma/**`, o que fere a
   regra de escopo cirúrgico se feito de carona com outra demanda.
3. **Benefício é moderado, não urgente**: o arquivo único não está causando bugs; o custo
   é de ergonomia/revisão. A onda 3 tem itens de segurança/dados com risco maior.
4. **Condição para aprovar depois**: spike prévio provando `schema: 'prisma'` +
   `migrate diff`/`generate`/`validate` idênticos ao arquivo único na versão pinada, e
   inventário completo de leitores do path (seção 2.3) migrados para DMMF ou concatenação.

## 4. Plano proposto (quando aprovado)

1. **Spike (sem commit funcional)**: criar `prisma/models/` com 2–3 arquivos copiados,
   `schema: 'prisma'` no `prisma.config.ts`, rodar `validate`/`generate`/`migrate diff
   --exit-code` e comparar com baseline. Verificar também `prisma format` e a integração
   `postgresqlExtensions` (pgvector/pg_trgm já declarados).
2. **Definir fronteiras de domínio** (proposta inicial, ajustável):
   `core.prisma` (Organization/User/Session), `crm.prisma` (Company/Contact/Lead/Activity/
   pipeline), `commercial.prisma` (CommercialGoal/StageHistory/FieldChange/SavedView),
   `copiloto.prisma`, `prospecting.prisma`, `integrations.prisma` (Bitrix/ThreeCX/etc.),
   `intelligence.prisma`, `cadence.prisma`, `voice.prisma`, `platform.prisma` (filas,
   audit, feature flags, tenancy).
3. **Mover models por domínio em commits separados** (um commit por arquivo movido) —
   `git mv`-like via delete+create, mantendo `schema.prisma` só com `generator`/`datasource`.
4. **Atualizar consumidores** (seção 2.3) preferindo `Prisma.dmmf` onde possível.
5. **Atualizar gates**: `package.json` (`verify:migration-drift` → `--to-schema prisma`
   ou equivalente), `prisma.config.ts`, `prisma/AGENTS.md`, runbooks.
6. **Gate de equivalência**: `prisma migrate diff` entre schema combinado e banco deve
   ser vazio (mesma baseline do `verify:migration-drift` atual — drift pré-existente
   conhecido, não piorar).
7. **Revisão 24 + handoff para 00** antes de merge (mexe em `package.json` e CI).

## 5. Riscos residuais aceitos

- Ferramentas de terceiros que assumem `schema.prisma` único (alguns dashboards do
  Prisma Studio, scripts ad-hoc de agentes futuros) — mitigável documentando o layout
  em `prisma/AGENTS.md`.
- `prisma format` em multi-file pode reformatar arquivos de domínio inteiros num único
  commit de formatação — isolar em commit próprio.
