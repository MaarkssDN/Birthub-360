# Auditoria READ-ONLY — Visão transversal Agente 00 (arquitetura/dívida)
**Base:** `main @ b54060ad1`.

## Achados

### ARQ-01 — Cluster voz legado morto: `src/features/ai-voice/` + `src/features/voice/` sem consumidor de produção — P1
~15 arquivos compilam e passam gates mas só testes os referenciam. VOZ-03/04/05 vivem aqui → código inseguro dormente sob typecheck.

### ARQ-02 — Feature `proposals/` órfã — P1
Só services; zero imports em src/. proposalAutomation gera UUIDs/URLs fabricados (assinatura simulada).

### ARQ-03 — temporal-workers + crawlee: código quebrado não-compilável — P1
Importam `@temporalio/*` e `crawlee` ausentes do package.json; excluídos do tsconfig → cemitérios invisíveis aos gates.

### ARQ-04 — Rotas órfãs confirmadas: job-roles.routes.ts, settings.routes.ts — P2

### ARQ-05 — `public/design-lab/` publica ~100 arquivos de lab interno em produção — P2
Vite copia public→dist→imagem; `identidade-v2/` é documentação/entrega de agente acessível publicamente.

### ARQ-06 — `agente-codigo-local/`: segundo app completo (Vite/Express/Firebase, deps próprias) — P2
Lockfiles geram waivers de segurança; eval/new Function; acoplado via `react-example: file:..`.

### ARQ-07 — `// @ts-nocheck` em 4 componentes React de produção (orbs 3D/brand) — P2
BirthHubOrbit360, Gamified3DOrb, BrandOrb, RevenueSignalOrb — typecheck "0 erros" não cobre esses arquivos.

### ARQ-08 — Duplicação framer-motion + motion (mesma lib, 2 pacotes) — P2
Imports mistos em ~65 arquivos; dobra bundle e fontes de MotionConfig.

### ARQ-09 — ≥15 deps provavelmente mortas (dompurify c/ 6 waivers Trivy, @elevenlabs/client, wavesurfer, twilio, socket.io server, ffmpeg…) — P2
Confirmar com `npx knip` (configurado).

### ARQ-10 — 4-5 stacks de cliente LLM paralelos (ai SDK, langchain, gateway próprio, routers groq/ollama, flowise) — P2
Fallback/custo/observabilidade divergem por feature.

### ARQ-11 — TechDebt JSON: P1 Security/Database é >90% ruído regex — P2
188 Security P1 = majoritariamente falsos positivos (fixtures de teste, skills, migrations aplicadas). Válidos: `scripts/create-user-marcelin.ts:23` fallback senha '00000000'; `.env.test` no tree. **Não usar JSON como backlog sem triagem.**

### ARQ-12 — Allowlist gitleaks ampla: `.agents/runs/.*\.md$` — P2
Segredo real colado em relatório futuro passa no scan. Auditar handoff-secrets.md + runs.

### ARQ-13 — 13 exceções de hotspot vencem em bloco 2026-11-30; vários a <3% do teto — P3
marketIntelligenceCompany 1015/1020, LeadDetailDrawer 1023/1100, Landing360Impeccable 1020/1050, intelligence.routes 1053/1100, leads.routes 1439/1500, workflowRuntime 1436/1500, Landing360 3173/3500. +30 waivers Trivy também vencem ~2026-11-30. Gate pode falhar em massa.

### ARQ-14 — PRODUCTION-READINESS.md "RELEASE APPROVED" de 08/10 está ~7 semanas stale — P2
Cita provedores descontinuados que ainda aparecem em Dockerfile/security.ts; não menciona clusters mortos nem exceções vencendo. Re-emitir parecer ou marcar snapshot.

### ARQ-15 — TODOs produtivos: praticamente nenhum crítico — P3

## Top-5 dívidas arquiteturais
1. Cemitérios invisíveis ao typecheck (temporal-workers, crawlee, outbound, voice-hub frontend).
2. Dois clusters de voz paralelos mortos (maior complexidade do repo = mais abandonado).
3. Exceções de hotspot/waivers vencendo em bloco → gate pode falhar de um dia p/ outro.
4. Stack IA fragmentada + deps mortas + animação duplicada → toda correção transversal custa N pontos.
5. Governança de evidência dessincronizada (TechDebt 90% ruído, readiness doc stale, gitleaks allowlist ampla).
