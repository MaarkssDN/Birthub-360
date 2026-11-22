# REPOSITORY FORENSIC SNAPSHOT — RECOVERY PROGRAM V2
**Birth Hub 360° Forensic Engineering Recovery Program**
**Date:** 2026-10-05T13:21:00-03:00  
**Phase:** FASE 0 — SNAPSHOT FORENSE

---

## 1. Executive Environment Metadata

```env
AUDIT_COMMIT=3495639d16589af69325ac8bbd925158cbac09aa
AUDIT_BRANCH=main
NODE_VERSION=v22.23.2
NPM_VERSION=10.9.8
DATABASE=PostgreSQL (with vector extension) via Prisma 7.10.0
FRAMEWORK=React 19.3.0 + Express 5.2.1 + Tailwind CSS v4.1.14
BUILD_SYSTEM=Vite 6.2.3 (frontend) + esbuild 0.25.0 (Node CJS server & worker)
TEST_FRAMEWORK=Vitest 4.1.11 (Unit/Integration/Container) + Playwright 1.63.0 (E2E/Visual)
LINTER_FORMATTER=Biome 2.5.14
```

---

## 2. Git State Forensics

### 2.1 Git Status
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### 2.2 Git Branch
- Current active branch: `main`
- Tracking: `origin/main`

### 2.3 Git Log (-10)
```
3495639d1 chore(governance): ignore visual audit captures and generated html manuals in gitignore
85fc63c07 fix(ai-safety): support plural forms in toxic words regex boundary matching
5c25977cb fix(dashboard,openapi): remove merge markers in SinglePageDashboard, align openapi.yaml with sales-orchestration route, format code
8906d97aa fix(dashboard): resolve merge conflicts and apply stash changes
17917fb6a chore(scripts): add update-user-role utility script
f759d3869 fix(ci,format): resolve prettier and biome formatting check failures across components
387412d02 fix(layout,auth): Fix blank space in MainLayout, integrate OutboundApp with global AuthContext
226135ed1 feat(landing): complete vfinal visual upgrade, typography polish, and toxicity guardrail refinements
62ae13092 fix: adjust intelligence routes, db schema parsing, and UI test timeouts
6e8e1c412 ci(e2e): serve prebuilt static assets during e2e tests and add chromium runner flags
```

### 2.4 Git rev-parse HEAD
`3495639d16589af69325ac8bbd925158cbac09aa`

### 2.5 Git Diff & Diff Stat
Working tree verified clean against `origin/main`.

---

## 3. Package & Dependency Forensics

### 3.1 package.json
- **Project Name:** `react-example` (legacy package name retained)
- **Node Engine:** `>=20.0.0`
- **Key Production Dependencies:**
  - `@google/genai`: `^2.24.0`
  - `@langchain/core`: `^1.2.8`, `@langchain/langgraph`: `^1.4.8`, `@langchain/openai`: `^1.5.11`
  - `@prisma/client` & `@prisma/adapter-pg`: `^7.10.0`
  - `@whiskeysockets/baileys`: `^7.0.0-rc14`
  - `better-auth`: `^1.7.4`
  - `bullmq`: `^6.3.2`
  - `express`: `^5.2.1`
  - `framer-motion`: `^13.1.1` & `motion`: `^13.4.3`
  - `ioredis`: `^6.0.0`
  - `react`: `^19.3.0`, `react-dom`: `^19.3.0`, `react-router-dom`: `^7.18.1`
  - `three`: `^0.185.1`, `@react-three/fiber`: `^9.7.0`, `@react-three/drei`: `^10.7.7`
  - `zod`: `^4.4.3`
- **Key Dev Dependencies:**
  - `@biomejs/biome`: `^2.5.14`
  - `@playwright/test`: `^1.63.0`
  - `typescript`: `^6.0.3`
  - `vite`: `^6.2.3`
  - `vitest`: `^4.1.11`

### 3.2 package-lock.json
- **Lockfile Version:** 3
- **Total Packages in Lockfile:** 2,438

---

## 4. Configuration Manifest Forensics

### 4.1 TypeScript (`tsconfig.json`)
- Target: `ES2022`, Module: `ESNext`, Resolution: `bundler`
- Strict: `true`, noImplicitAny: `true`, strictNullChecks: `true`, strictFunctionTypes: `true`
- Path alias: `@/*` -> `./src/*`
- Excludes:
  - `node_modules`, `dist`, `server`
  - `src/lib/voice-hub`, `src/lib/voice-runtime`, `src/features/voice-hub`
  - `src/features/cadence/dialer`, `src/features/prospecting/outbound`
  - Test files: `**/*.test.ts`, `**/*.test.tsx`, `**/__tests__/**`

### 4.2 Vite Config (`vite.config.ts`)
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`, `VitePWA`
- Note: Million.js explicitly disabled in auto mode due to synthetic DOM `<slot>` interference with React input handlers.

### 4.3 Tailwind CSS
- Tailwind CSS v4.1.14 integrated via Vite plugin `@tailwindcss/vite` and `@tailwindcss/oxide`.

### 4.4 Biome Config (`biome.json`)
- Version: `2.5.11/2.5.14` schema
- Formatter: 2 spaces, lineWidth 100, single quotes for JS, double quotes for JSX
- Linter: Recommended rules with custom overrides for tests (`noExplicitAny: off`, `noNonNullAssertion: off`).

### 4.5 Vitest Configs
- `vitest.config.ts`, `vitest.unit.config.ts`, `vitest.integration.config.ts`, `vitest.container.config.ts`
- Strict coverage threshold floors configured in `vitest.unit.config.ts`:
  - Global: statements: 28, branches: 25, functions: 23, lines: 29
  - UI components: statements: 21, branches: 17, functions: 19, lines: 22
  - Automations: statements: 70, branches: 73, functions: 60, lines: 71
  - CRM core: statements: 32, branches: 30, functions: 17, lines: 33

### 4.6 Playwright Configs
- `playwright.config.ts` (testDir: `./tests/e2e`, timeout: 60s, workers: 1, serial execution)
- `playwright.visual.config.ts`

### 4.7 Docker & Container Ecosystem
- `Dockerfile`: Multi-stage build (`node:22-slim`), runs `prisma generate`, `npm run build`, and prunes devDependencies.
- Compose Files:
  - `docker-compose.yml` (Redis 7, Meilisearch v1.6)
  - `docker-compose.postgres-local.yml`
  - `docker-compose.opensource.yml`
  - `docker-compose.qdrant.yml`
  - `docker-compose.services.yml`

### 4.8 GitHub Actions CI/CD Manifest
Workflows located in `.github/workflows/`:
1. `ci.yml`
2. `qualidade-ci.yml`
3. `playwright-ci.yml`
4. `visual-regression.yml`
5. `security-trivy.yml`
6. `codeql.yml`
7. `dependency-review.yml`
8. `endpoint-latency-budget.yml`
9. `frontend-bundle-budget.yml`
10. `public-assets-budget.yml`
11. `sonarqube.yml`
12. `cd-homolog.yml`
13. `production.yaml`
14. `docker-publish.yml`
15. `deploy-pages.yml`
16. `backup-production.yml`
17. `android-build.yml`
18. `ios-build.yml`
19. `onda-2.5-validation.yml`

---

## 5. Database & Schema Forensics

### 5.1 Prisma Schema (`prisma/schema.prisma`)
- Datasource: `postgresql` with extension `vector` (pgvector)
- Generator: `prisma-client-js` with `postgresqlExtensions` preview feature
- Binary targets: `native`, `debian-openssl-3.0.x`, `linux-musl-openssl-3.0.x`
- Size: ~257 KB (~130 models, extensive multi-tenant schema)

### 5.2 Migrations (`prisma/migrations`)
- Total migration folders: **137** migrations
- Initial: `20260716232635_init`
- Latest: `20261011000000_create_custom_ai_tool_and_rls`
- Lockfile: `migration_lock.toml` present (PostgreSQL provider locked)

---

## 6. Directory Structure Forensics

### 6.1 `src/` Directory
- `bootstrap/` (app bootstrap and route definitions)
- `components/` (shared design system and UI components)
- `config/` (environment and runtime configuration)
- `contexts/` (React contexts including Auth, Theme, Socket)
- `features/` (domain features: crm, prospecting, cadence, voice-hub, automations, etc.)
- `hooks/` (React custom hooks)
- `lib/` (shared core libraries: ai, queue, security, db, telemetry)
- `pages/` (view routes)
- `shared/` (shared utilities, contracts, types)
- `styles/` (CSS styling)
- `types/` (TypeScript definition declarations)
- `utils/` (general utilities)

### 6.2 `tests/` Directory
- `container/` (Testcontainers infrastructure tests)
- `e2e/` (Playwright end-to-end test suites)
- `fixtures/` (test data fixtures)
- `helpers/` (test utilities and setup scripts)
- `integration/` (Vitest integration tests against DB/APIs)
- `load/` (k6 load testing scripts)
- `mocks/` (MSW and component mocks)
- `security/` (security, RLS, and auth test suites)
- `unit/` (Vitest unit tests)
