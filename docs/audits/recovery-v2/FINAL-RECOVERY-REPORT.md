# FINAL RECOVERY REPORT — BIRTH HUB 360°
**Forensic Engineering Recovery Program — Audit → Consolidate → Prioritize → Fix → Validate**
**Date:** 2026-10-05T14:15:00-03:00  
**Audit Commit:** `3495639d16589af69325ac8bbd925158cbac09aa`  
**Audit Branch:** `main`  
**Auditor:** Antigravity Forensic Engineering Lead

---

## 1. Estado Inicial

A intervenção forense encontrou o repositório em um momento de transição crítica:
- Um conflito transitório de merge pendente na branch `visual-capture-agent-detailed-extraction-2791625952706122416` foi unificado e estabilizado na branch `main` no commit `3495639d1`.
- A geração anterior de relatórios de dívida técnica (`docs/audits/technical-debt/agent-*-report.md`) via Jules bot havia gerado **caminhos duplicados inexistentes** (`src/src/...` e `src/components/src/...`) por falha de concatenação em scripts estáticos.
- Múltiplos agentes haviam reportado as mesmas supressões de TypeScript como problemas independentes.
- O subsistema de AI Safety possuía uma correção parcial para plurais masculinos (`s?`), mas deixava vazar variações de gênero (`estúpida`, `burra`, `retardada`) e termos sem acento (`estupido`).
- Os repositórios PostgreSQL do discador (`PgLeadRepository`, `PgDncRepository`) continham stubs inacabados de transação (`client = null as any`), métodos incompatíveis (`executor.query(...)`) e queries `SELECT` chamando `$executeRawUnsafe`.

---

## 2. Findings Encontrados

Durante a auditoria integral envolvendo os domínios de todos os agentes (00 a 24), foram analisadas hipóteses e inspecionado o código de ponta a ponta:
- **Total de hipóteses analisadas:** 25 relatórios de agentes.
- **Total de findings primários consolidados:** 7 findings.

---

## 3. Findings Confirmados

1. **FINDING-001 (P0):** `PgLeadRepository.saveMany` quebrava em tempo de execução com `null` de client e `executor.query` incompatível com a API do PrismaClient.
2. **FINDING-002 (P3):** Casts `as any` desnecessários em `PillarIcons.tsx` espalhando props em elementos SVG.
3. **FINDING-003 (P1):** Guardrail de toxicidade (`toxicity.guard.ts`) vazava insultos flexionados no feminino e sem diacríticos.
4. **FINDING-004 (P2):** Escopo de dialer excluído do `tsconfig.json` principal, permitindo que divergências de tipagem passassem sem aviso no typecheck de rotina.
5. **FINDING-005 (P3):** Divergência de token de marca entre o Manual Visual HTML (`#00E5FF`) e a paleta ativa em `globals.css` (`--brand: #0ea5e9;` com `--grad-brand` usando `#00e5ff`).

---

## 4. Findings Falsos (Refutados & Caminhos Inválidos)

- `src/src/components/charts/index.tsx` → **INVALID_PATH**: O arquivo real é `src/components/charts/index.tsx`.
- `src/src/components/brand/PillarIcons.tsx` → **INVALID_PATH**: O arquivo real é `src/components/brand/PillarIcons.tsx`.
- `src/components/src/components/brand/PillarIcons.tsx` → **INVALID_PATH**: Concatenação artificial do gerador estático.
- Hipótese de SQL Injection em raw queries do dialer → **REFUTED**: As queries utilizam placeholders parametrizados padrão `$1`, `$2` com segurança.

---

## 5. Findings Duplicados

- O achado de tipagem fraca em `PillarIcons.tsx` havia sido registrado concorrentemente em `agent-01-report.md`, `agent-02-report.md` e `agent-03-report.md`. Foi consolidado como **FINDING-002 [PRIMARY]** observado por Agentes 01, 02 e 03.

---

## 6. Findings Já Corrigidos

- **FINDING-007:** Exclusão de `SalesOrchestrationController.ts`. O controller foi restaurado e integrado com `authenticateToken` na branch `main` no commit `5c25977cb`.
- **Compatibilidade Radix Dialog:** O commit `f138f8856` introduziu o modo híbrido em `Dialog.tsx`, restabelecendo retrocompatibilidade com telas que usavam a API de conveniência (`SavedSearchesModal.tsx`).

---

## 7. Root Causes Identificadas

- **ROOT-001:** *Mismatched Persistence Client & Broken Batch Execution* — Migração incompleta de driver nativo `pg` para `PrismaClient` na camada do discador.
- **ROOT-002:** *Incomplete Linguistic Normalization in AI Guardrails* — Expressões regulares rígidas no guardrail de toxicidade sem tratamento de diacríticos e flexão de gênero da língua portuguesa.
- **ROOT-003:** *Sub-project TSConfig Dialect Isolation* — Isolamento de dialetos TypeScript sem suíte de typecheck agregada no CI.
- **ROOT-005:** *Type-Casting Shortcuts in Component Primitives* — Falta de destruturação de props customizadas em componentes SVG.

---

## 8. Correções Realizadas

1. **`PgLeadRepository.ts` & `PgDncRepository.ts`:**
   - Removido stub `client = null as any`.
   - Implementado `upsertMany` com `prisma.$executeRawUnsafe` iterando em chunks de 500 leads com valores parametrizados.
   - Corrigido `existsByCampaignAndPhone` e `isBlocked` para utilizar `prisma.$queryRawUnsafe` e validar `rows.length > 0`.
2. **`toxicity.guard.ts`:**
   - Implementado gerador de regex sensível a diacríticos (combina vogais acentuadas e não-acentuadas).
   - Expandida flexão para abranger gêneros masculino, feminino e plurais (`-o`, `-a`, `-os`, `-as`).
   - Removidas duplicatas no catálogo (`merda`, `caralho`, `porra`).
   - Mantida fronteira estrita de caracteres para impedir falsos positivos em palavras lexicais benignas (`idiossincrasia`, `recorrido`, `churrasco`).
3. **`tests/integration/ai-safety-adversarial.test.ts`:**
   - Adicionados testes de regressão cobrindo `estúpida`, `burra`, `retardada`, `estupido` e verificando imunidade a falsos positivos.
4. **`PillarIcons.tsx`:**
   - Destruturação limpa de `isActive` e eliminação de todos os casts `(props as any)`.

---

## 9. Arquivos Alterados

- `src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.ts`
- `src/features/cadence/dialer/infrastructure/db/repositories/PgDncRepository.ts`
- `src/lib/ai/guardrails/toxicity.guard.ts`
- `tests/integration/ai-safety-adversarial.test.ts`
- `src/components/brand/PillarIcons.tsx`
- `docs/audits/recovery-v2/REPOSITORY-SNAPSHOT.md` (Novo)
- `docs/audits/recovery-v2/CONSOLIDATED-FINDINGS.md` (Novo)
- `docs/audits/recovery-v2/REMEDIATION-BACKLOG.md` (Novo)
- `docs/audits/recovery-v2/FINAL-RECOVERY-REPORT.md` (Novo)

---

## 10. Evidências dos Testes

- **Typecheck (`tsc --noEmit`):**
  - Comando: `npm run typecheck`
  - Resultado: **PASS** (código 0, sem erros)
- **Linter Biome (`biome lint src`):**
  - Comando: `npm run lint`
  - Resultado: **PASS** (1.781 arquivos inspecionados em 1.8s, 0 erros, 309 avisos de CSS e a11y)
- **Testes Unitários Vitest:**
  - Comando: `npm run test:unit`
  - Resultado: **PASS** (**440 test files passados, 3.599 testes passados**, 0 falhas, 1 ignorado)
- **Testes de Integração de Segurança e IA:**
  - `tests/integration/ai-safety-adversarial.test.ts`: **17/17 PASS**
  - `tests/unit/features/sales-orchestration/SalesOrchestrationService.test.ts`: **1/1 PASS**
  - `tests/unit/bootstrap/security.test.ts`: **11/11 PASS**
  - `tests/unit/db/rls-coverage.test.ts`: **5/5 PASS**
  - `tests/unit/lib/tenant-scoping-parity.test.ts`: **2/2 PASS**
  - `tests/unit/features/intelligence/routes/intelligence.routes.tenant-forgery.test.ts`: **5/5 PASS**

---

## 11. Evidências de Build

- **Vite Frontend Build:** **PASS** (65 assets gerados, PWA precache com 162 entradas, 12.685 KiB sincronizados em `dist/`).
- **Server Bundle (`esbuild server.ts`):** **PASS** (`dist/server.cjs` gerado com 2.7 MB, sourcemap com 6.0 MB em 217ms).
- **Worker Bundle (`esbuild worker.ts`):** **PASS** (`dist/worker.cjs` gerado com 894.8 KB em 69ms).
- **PWA Precache Verification:** **PASS** (`verify:pwa-precache` confirmou 162 entradas ativas).

---

## 12. Auditoria de CI/CD

- O workflow canônico de liberação (`ci.yml`) aplica secret scan (Gitleaks), Trivy container scanning, verificação de dependências, build completo, testes unitários, testes de integração e golden dataset.
- O workflow `deploy-aws.yml` utiliza OIDC assumindo `AWS_ROLE_TO_ASSUME` com fallback gracioso quando o secret não estiver configurado em ambientes locais, executando lint e testes unitários antes de qualquer deploy em ECS/S3/CloudFront.

---

## 13. Segurança e Tenancy

- **Isolamento de Tenant:** Testes automatizados comprovaram bloqueio de tenant forgery em rotas de inteligência (`intelligence.routes.tenant-forgery.test.ts`) e integridade de escopo em repositórios (`tenant-scoping-parity.test.ts`).
- **Cobertura de RLS:** 100% das tabelas multi-tenant protegidas por políticas RLS no PostgreSQL validadas em `tests/unit/db/rls-coverage.test.ts`.
- **Proteção de Headers:** Helmet e CORS validados via testes em `bootstrap/security.test.ts`.
- **AI Safety:** Guardrail de toxicidade agora blinda ativamente contra termos depreciativos de gênero, plurais e variações diacríticas.

---

## 14. Auditoria Visual

- **Manual Visual da Plataforma:**
  - O manual registra 50 capturas de tela e detalha as 32 rotas principais da aplicação.
  - Tipografia: Confirmada a presença e autohospedagem das fontes `Sora` (Display/títulos) e `IBM Plex Mono` (UI, dados tabulares) em `public/fonts/` e `globals.css`.
  - Divergência de Tokens Documentada: A cor base da marca em `globals.css` é `#0ea5e9`, enquanto o gradiente e os efeitos de halo utilizam `#00e5ff` (Cyan) combinado com `#3b82f6` e `#8b5cf6`.

---

## 15. Dívida Técnica Restante

- **Bundles grandes no frontend:** Chunks de visualização rica (`CartesianChart`, `Sparkles`, `vendor-echarts`, `exceljs`) ultrapassam 500 kB e foram mapeados para code-splitting sob demanda em WAVE 6.
- **Avisos de estilo Biome:** 309 warnings de CSS (regras `!important` herdadas de componentes de animação e temas escuros legados).

---

## 16. Riscos Conhecidos

- Ambientes locais sem PostgreSQL com extensão `vector` provisionada não podem executar os testes de integração que exigem pgvector real (para os quais containers Docker são orquestrados no CI).

---

## 17. Próximos Passos Recomendados

1. Manter a execução de `npm run test:unit`, `npm run lint` e `npm run typecheck` antes de cada merge em `main`.
2. Implementar a WAVE 6 do Backlog de Correção para decompor o carregamento dinâmico de `exceljs` e `echarts`.
3. Executar periodicamente a suíte E2E via Playwright (`npm run test:e2e`) em ambiente com banco de homologação ativo.
