# REMEDIATION BACKLOG — RECOVERY PROGRAM V2
**Birth Hub 360° Forensic Engineering Recovery Program**
**Date:** 2026-10-05T14:15:00-03:00  
**Status:** ACTIONABLE & PRIORITIZED

---

## WAVE 1 — BLOCKERS (P0)

### REM-001
- **ID:** REM-001
- **ROOT_CAUSE:** ROOT-001: Mismatched Persistence Client & Broken Batch Execution
- **FINDINGS:** FINDING-001
- **DOMAIN:** Cadence & Dialer Persistence
- **SEVERITY:** P0
- **FILES:** `src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.ts`
- **DEPENDENCIES:** Prisma Client
- **FIX_STRATEGY:**
  1. Remove `const client = null as any;` stub in `saveMany`.
  2. Implement `upsertMany` using `this.prisma.$executeRawUnsafe` with chunking and proper parameterized value lists.
  3. Ensure `existsByCampaignAndPhone` uses `$queryRawUnsafe` rather than `$executeRawUnsafe` to correctly evaluate existence.
- **VALIDATION:** Create unit test executing `saveMany`, `save`, and `existsByCampaignAndPhone` with mocked PrismaClient.
- **REGRESSION_RISK:** Low; localized entirely to `PgLeadRepository.ts`.

---

## WAVE 2 — SECURITY & DATA (P1)

### REM-002
- **ID:** REM-002
- **ROOT_CAUSE:** ROOT-002: Incomplete Linguistic Normalization in AI Guardrails
- **FINDINGS:** FINDING-003
- **DOMAIN:** AI Safety & Guardrails
- **SEVERITY:** P1
- **FILES:** 
  - `src/lib/ai/guardrails/toxicity.guard.ts`
  - `tests/integration/ai-safety-adversarial.test.ts`
- **DEPENDENCIES:** None
- **FIX_STRATEGY:**
  1. Add diacritic normalization before matching (e.g. normalizing accented characters so `estupido` matches `estúpido`).
  2. Expand regex inflections to cover feminine and plural forms (`-a`, `-as`, `-o`, `-os`).
  3. Deduplicate toxic word constants in `TOXIC_WORDS_PT`.
  4. Ensure `lastIndex` reset on RegExp instances with `g` flag during redaction.
- **VALIDATION:** Run `npx vitest run tests/integration/ai-safety-adversarial.test.ts` including new test assertions for `estúpida`, `estupido`, `burra`, `retardada`.
- **REGRESSION_RISK:** Very low; only broadens detection of verified slurs without matching valid Portuguese words (verified boundary safety).

---

## WAVE 3 — ARCHITECTURE (P2)

### REM-003
- **ID:** REM-003
- **ROOT_CAUSE:** ROOT-003: Sub-project TSConfig Dialect Isolation & Hidden Scope
- **FINDINGS:** FINDING-004
- **DOMAIN:** Test & Build Infrastructure
- **SEVERITY:** P2
- **FILES:**
  - `package.json`
  - `tsconfig.voice.json`
- **DEPENDENCIES:** TypeScript compiler
- **FIX_STRATEGY:**
  1. Add `typecheck:voice` script in `package.json`: `"typecheck:voice": "tsc -p tsconfig.voice.json --noEmit"`.
  2. Ensure dialer and voice packages pass typecheck and are executed in CI quality gate.
- **VALIDATION:** Run `npm run typecheck:voice` and verify 0 compilation errors.
- **REGRESSION_RISK:** None.

---

## WAVE 4 — TEST & CI (P2)

### REM-004
- **ID:** REM-004
- **STATUS:** RESOLVED (2026-10-08 - Agente 08)
- **ROOT_CAUSE:** ROOT-004: Incomplete Pre-deploy Checks in Secondary Workflows
- **FINDINGS:** Pre-deploy gate disparity in `deploy-aws.yml`
- **DOMAIN:** DevOps & CI/CD
- **SEVERITY:** P2
- **FILES:** `.github/workflows/deploy-aws.yml`
- **DEPENDENCIES:** GitHub Actions
- **FIX_STRATEGY:**
  1. Align `deploy-aws.yml` steps to require `npm run typecheck` in addition to `npm run lint` and `npm run test:unit`.
- **VALIDATION:** Step `- run: npm run typecheck` inserido antes de lint e test:unit em `.github/workflows/deploy-aws.yml`.
- **REGRESSION_RISK:** None.

---

## WAVE 5 — PRODUCT & UX (P3)

### REM-005
- **ID:** REM-005
- **ROOT_CAUSE:** ROOT-005: Type-Casting Shortcuts in Component Primitives
- **FINDINGS:** FINDING-002
- **DOMAIN:** Design System / Brand Components
- **SEVERITY:** P3
- **FILES:** `src/components/brand/PillarIcons.tsx`
- **DEPENDENCIES:** React & Framer Motion
- **FIX_STRATEGY:**
  1. Destructure `isActive` cleanly from `PillarIconProps` across all pillar icons (`HubIcon`, `IntelligenceIcon`, `OrchestrationIcon`, `PerformanceIcon`, `ForecastIcon`, `AIIcon`, `AutomationIcon`, `EngagementIcon`).
  2. Forward remaining `...props` to SVG without `(props as any)`.
- **VALIDATION:** `npm run typecheck` and `npm run lint`.
- **REGRESSION_RISK:** None; preserves all visual and animated behavior.

---

## WAVE 6 — PERFORMANCE (P3)

### REM-006
- **ID:** REM-006
- **ROOT_CAUSE:** ROOT-006: Large Monolithic Vendor Chunks in Single-Page Bundles
- **FINDINGS:** FINDING-005 / Rollup chunk size warnings during Vite build
- **DOMAIN:** Frontend Performance
- **SEVERITY:** P3
- **FILES:** `vite.config.ts`
- **DEPENDENCIES:** Rollup / Vite
- **FIX_STRATEGY:**
  1. Fine-tune `manualChunks` in `vite.config.ts` for heavy visualization engines (`echarts`, `exceljs`, `three`) so they are strictly on-demand.
- **VALIDATION:** `npm run build` and bundle budget check.
- **REGRESSION_RISK:** Low.

---

## WAVE 7 — CLEANUP (P4)

### REM-007
- **ID:** REM-007
- **ROOT_CAUSE:** ROOT-007: Stale Artifacts in Test/Documentation Directories
- **FINDINGS:** Temporary audit files and ghost reports from previous bot runs
- **DOMAIN:** Repository Hygiene
- **SEVERITY:** P4
- **FILES:** `docs/audits/technical-debt/`
- **DEPENDENCIES:** Git
- **FIX_STRATEGY:**
  1. Archive old hypothesis reports into `docs/audits/technical-debt-legacy-archive/` with notice pointing to Recovery Program V2.
- **VALIDATION:** Clean git status.
- **REGRESSION_RISK:** None.
