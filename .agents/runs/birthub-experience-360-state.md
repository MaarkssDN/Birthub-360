# Checkpoint — Operação Birthub Experience 360 (Fase Zero)
Data: 2026-11-19 · Autor: Agente 00 (sessão Claude Code, cloud) · Estado: FASE ZERO PARCIAL (somente leitura)

## Baseline (VERIFICADO NO CÓDIGO)
- HEAD `03546a77` (merge PR #417) · branch `claude/sleepy-hamilton-umhot9` · working tree limpo · 1 worktree.
- Stack: React 19 + Vite 6 + react-router-dom 7 (SPA, NÃO Next.js) · Tailwind 4 CSS-first (`src/styles/globals.css`) · Framer Motion 13 · Playwright 1.63 + axe · Vitest 4 · Biome (lint) · TS 6.
- Scripts reais: `typecheck`, `lint` (biome), `test:unit`, `test:integration`, `test:e2e`, `test:visual`, `test:architecture`, `build`. Não existe `design-lab` de CI específico verificado.
- `node_modules` ausente → NENHUM gate executado nesta fase (NÃO EXECUTADO).
- PRs abertos relevantes: #419 (baselines visuais Linux), #415 (P0 segurança design-lab/ErrorBoundary), #412 (retorno de login), #404/#403 (QA Onda 6). Evitar tocar esses arquivos.

## Divergências de governança (exigem decisão humana)
1. **DS-001 (P1, inconsistência objetiva):** `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 (neon #00D4FF/#FF2D9B/#FFC107, títulos obrigatoriamente neon/gradiente) vs `.claude/CLAUDE.md` (ouro #D4AF37, Deep Iris, "gradiente em texto proibido", Sora/Inter, Deep Navy) vs `globals.css` real (`--brand:#00d4ff`, `--bg:#0d0d0d` dark / `#f0efe9` light). O código segue o Design Language v2; `.claude/CLAUDE.md` está obsoleto OU o DL é que deve mudar. Regra "gradiente em título" também conflita com o seu pedido de "sem gradientes decorativos".
2. **GOV-001:** skills `birthhub-*` NÃO existem como skills (`.claude/skills`, `skills-lock.json`). Existem 7 *agents* `birthhub-*` em `.claude/agents/` e prompts `03A–03G` em `.agents/prompts/`. O mapa skill↔agente do prompt mestre é hipótese não confirmada.
3. **GOV-002:** `.agents/skills` tem ~440 skills (testland/qa etc.) — avaliar sobreposição antes de qualquer instalação externa. Nenhuma instalação feita.

## Pendente na Fase Zero
- `npm ci` + gates base; Playwright em desktop/mobile light/dark; inventário completo de rotas internas (`/app/*`, lazy modules); matriz de ownership por diretório (ler `AGENTS.md` por subpasta); auditoria de candidatos externos.
- Rotas públicas confirmadas em `src/App.tsx`: `/`, `/welcome`, `/landing-new`, `/login`, `/reset-password`, `/privacy`, `/terms`, `/privacidade/dsr/*`, `/book/:slug`, `/design-lab/*`, `/social-selling`, `/setup`, `/app/*`.
