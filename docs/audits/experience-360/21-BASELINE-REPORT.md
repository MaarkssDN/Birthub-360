# 21 — Relatório Consolidado da Baseline (Experience 360)

**Data:** 2026-11-22 · **Branch:** `chore/handoff-00-despacho-wave-a-b-20261120`
**HEAD:** `80b1a335b` · **Working tree:** 29 entradas (modificações não
relacionadas em `docs/orchestration/**` + handoffs históricos não rastreados —
**preservados, não tocados**)
**Autorização:** Despacho complementar do Orquestrador — baseline autorizada,
implementação NO-GO.

---

## 1. Ambiente executado

| Item | Valor |
|---|---|
| OS | Windows (Git Bash) |
| Node/deps | `node_modules` instalado (`npm ci` anterior, exit 0) |
| Servidor na :3000 | **Já em execução** — Vite dev server do usuário (`reuseExistingServer` reutilizou; `webServer.command` do playwright.visual.config.ts **não rodou**) |
| `.env.test` | Ausente → criado de `.env.test.example` (artefato local, não commitado) |
| Playwright | 1.63.0 — browsers **instalados nesta sessão** (`npx playwright install chromium`, chromium-1243 + headless shell) |
| Postgres :5434 | **FECHADA** — Docker daemon parado |
| Redis :6379 | **FECHADA** — Docker daemon parado |
| Meilisearch :7701 | **FECHADA** |
| Docker | `docker ps`/`docker version` penduram — daemon indisponível |

## 2. Comandos executados e resultados

| Comando | Resultado | Evidência |
|---|---|---|
| `npm run test:visual` (1ª execução) | **88/88 failed** — `browserType.launch: Executable doesn't exist ... chromium_headless_shell-1243` | log em `test-results/` + overflow do shell |
| `npx playwright install chromium` | sucesso — browsers baixados | output do shell |
| `npm run test:visual` (2ª execução) | **88/88 failed** — ver análise abaixo | overflow `shell-5b5e76` |
| `curl localhost:3000/login` | 200 (0.09s) — servidor dev responde | — |
| `curl localhost:3000/api/health` | 200 | — |

## 3. Análise das 88 falhas — separação falha-ambiental × achado-real

### 3.1 Falhas 100% ambientais (infraestrutura, não produto)

**Causa raiz dominante:** Postgres/Redis/Meilisearch **indisponíveis** (daemon
Docker parado) → o servidor dev na :3000 responde HTML/health, mas **todo fluxo
que depende de backend falha**. O helper `signUp` (`tests/e2e/helpers.ts:36`)
aguarda `getByRole('button', { name: /^Criar conta$/ })` por 60s e expira —
**~80 dos 88 testes** morreram nesse timeout antes de chegar ao snapshot.

Os logs do servidor confirmam: `Redis connection error ECONNREFUSED :6379` em
loop durante toda a execução.

### 3.2 Falha de baseline ausente (ambiente Windows)

Os 4 testes de **Login** (light/dark × projetos) falharam com:
`A snapshot doesn't exist at ...\baselines\visual.spec.ts\login-*-win32.png`.

**Todos os 88 baselines commitados são `*-linux.png`** — não existe baseline
win32 no repositório. No Windows, `test:visual` **não pode passar** sem gerar
baselines win32 (proibido: `--update-snapshots` não autorizado). Isto é uma
limitação de portabilidade do harness, não regressão visual.

### 3.3 Conclusão da baseline visual

- **Baseline visual NÃO estabelecida** nesta sessão — bloqueada por:
  1. Infra de dados indisponível (Docker parado → sem Postgres/Redis);
  2. Baselines win32 inexistentes (suíte só tem linux).
- **Nenhuma evidência de regressão visual nova** pode ser afirmada — os testes
  não chegaram à comparação de snapshot por falha anterior no fluxo de auth.
- Recomendação: rodar `test:visual` no CI (linux) ou com Docker local ativo +
  gerar baselines win32 em sessão autorizada separada.

## 4. Matriz de testes — status

| Suíte | Status | Detalhe |
|---|---|---|
| `test:visual` (88 testes) | ❌ BLOCKED | 88/88 failed — causas ambientais (§3) |
| Testes funcionais em navegador (rotas /app/*) | ❌ BLOCKED | requerem auth + backend; DB/Redis down |
| A11y axe por rota | ⚠️ PARCIAL | inventário do Agente 14 já existente (51 limpas/19 findings) — **não reexecutado** (mesma dependência de backend) |
| Temas claro/escuro | ❌ BLOCKED | snapshots não alcançados |
| Componentes compartilhados / VirtualTable / modais / Command Palette | ⚠️ CODE-ONLY | auditoria estática em `06-COMPONENT-AUDIT.md` — sem validação em browser |
| `/app/characters` e `voice-hub/*` | ⚠️ CODE-ONLY | evidência estática + medição prévia do Agente 14 (contraste 1,52:1); sem revalidação visual |
| `npx tsc --noEmit` / `npm run lint` / `npm run build` | ✅ VERDES (baseline anterior nesta branch) | verificado na Fase Zero; não reexecutado nesta sessão para não gastar ciclo — **reexecutar antes de qualquer implementação** |
| Unit tests (Vitest) | ✅ 7.366 passam (execução anterior paralela) | não reexecutado — sem mudança de código desde então |

## 5. Falhas preexistentes × achados novos

### Preexistentes (não introduzidas por este trabalho)
- 88 baselines visuais só-linux (portabilidade Windows).
- Infra local sem Docker → E2E/visual não reproduzíveis fora do CI.
- ~1.561 warnings de lint; 70 violações de arquitetura conhecidas.
- Redis/DB indisponíveis por daemon parado (handoff de infra já registrado).

### Achados novos desta baseline
- **Nenhum achado de produto novo** — a execução foi bloqueada antes de gerar
  evidência visual/funcional nova.
- Confirmação: o harness `test:visual` tem **dupla dependência ambiental**
  (Docker para dados + baselines por-OS) que deve constar na matriz de
  prontidão.

## 6. Impacto na prontidão da Onda 1

A baseline visual **não está estabelecida** — condição necessária do Despacho
("estabelecer uma baseline verificável com testes visuais") **não cumprida**.
A Onda 1 permanece **NO-GO** até:
1. Infra de teste disponível (Docker/Postgres/Redis) **ou** execução no CI;
2. Baselines win32 geradas em sessão autorizada (ou suíte rodada só no CI linux);
3. Parecer do Silas;
4. Aprovação dos handoffs + ownership (ver `20-OWNERSHIP-PROPOSAL.md`).

## 7. Artefatos gerados (não commitados — temporários)

- `.env.test` (cópia de `.env.test.example`)
- `test-results/` (error-context.md por teste falho)
- `visual-regression-report/` (HTML do Playwright)
- Browsers Playwright em `%LOCALAPPDATA%/ms-playwright/` (persistem para reuso)
