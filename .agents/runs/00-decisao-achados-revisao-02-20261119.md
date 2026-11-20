# Run 00 — Decisão sobre achados da revisão estática do Agente 02 (commit f8d4bc76)

Data: 2026-11-19
Coordenador: Agente 00
Origem: relatório de revisão estática do Agente 02 (Produto e UX), verificado pelo 00 contra `origin/main`.

## Verificação dos achados

| # | Achado do 02 | Estado em `origin/main` | Decisão |
|---|---|---|---|
| 1 | Deep link pós-login quebrado (`ProtectedRoute` salva `state.from`, `Landing360` forçava `/app`) | **JÁ CORRIGIDO** — `Landing360.tsx` em main usa `postLoginTarget` (linhas ~530-537) que lê `location.state.from`, preserva `pathname + search` e sanitiza (só caminhos internos, rejeita `//`). Usado em `callbackURL` e `navigate` (linhas 833, 921, 930, 936, 1005, 3016, 3048). O #310 foi fechado sem merge, mas a correção entrou por outro PR. | Resta apenas o **aceite E2E**: sessão anônima acessando deep link com path+query, autenticando e caindo no destino original. → handoff 00→08. |
| 2 | `ErrorBoundary` expõe `error.message` + `error.stack` na UI | **CONFIRMADO EM MAIN** — `src/components/ErrorBoundary.tsx:33,36` ainda renderiza mensagem e stack. #310 fechado sem merge; a correção não entrou por outro PR. | Hotfix novo necessário. Dono atribuído: **Agente 02** (superfície global de erro/UX; arquivo raiz de `src/components/` sem dono explícito → escalado ao 00, que delega ao 02). → handoff 00→02, prioridade alta. |
| 3 | Paleta documentada diverge da `main` (`globals.css` neon nos dois temas) | **CONFIRMADO** — `globals.css:265-279` (light) e `:590-609` (dark) usam tokens neon. PR #368 (migração paleta oficial, ex-#310) está OPEN com **gates vermelhos**: `build` FAILURE, `SonarQube` FAILURE, `Visual Regression` FAILURE, `Visual Regression Gate` FAILURE, `Central Birth Hub 360 / application gate` FAILURE. 100 arquivos, +7768/-2238. QA visual desktop/mobile/2 temas pendente conforme o próprio PR registra. | **Decisão 00: #368 NÃO integra no estado atual.** Não há hotfix funcional separado a extrair — o deep link já está em main e o ErrorBoundary vai por PR próprio do 02. O #368 volta ao dono (03 — `src/styles/` e tokens) para remediar gates vermelhos e concluir QA visual antes de nova revisão do 24. → handoff 00→03. Revisão do 24 exigida após gates verdes. |
| 4 | Jornada DSR pública pendente | **DESBLOQUEADO** — #381 (backend: `dsrRequest.routes/schema/service` + migration `20261117231500_data_subject_request_dsr`) e #385 (frontend: `DsrVerifyPage`, `DsrStatusPage`, `DsrRequestForm` embutido em `/privacy`, rotas `/privacidade/dsr/verificar` e `/privacidade/dsr/acompanhamento`) **ambos MERGED em 2026-11-18**. A dependência #385→#381 está satisfeita. | Resta o **aceite conjunto** com dados sintéticos: solicitação → confirmação por e-mail → acompanhamento → download do dossiê. → handoff 00→08 (E2E), com verificação de persistência real pelo 22 e ciência LGPD do 21 quando aplicável. |

## Handoffs abertos nesta decisão

- `.agents/handoffs/onda-review-20261119/00-para-02-errorboundary-stack-exposto.md` — alto
- `.agents/handoffs/onda-review-20261119/00-para-08-aceite-deeplink-pos-login.md` — normal
- `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md` — alto
- `.agents/handoffs/onda-review-20261119/00-para-08-aceite-dsr-jornada-publica.md` — alto

## Despacho (2026-11-19)

Descoberta durante o despacho: a correção do ErrorBoundary **já existe** no PR **#415**
(`agente/00-p0-security-extract-310`, worktree `wt-310-extract`, 4 arquivos) — mas com 3 gates
vermelhos (`build`, `SonarQube`, `application gate`). Handoff 00→02 atualizado para verificação
+ remediação de gates em vez de implementação nova.

Worktrees isolados criados/usados (§17):

| Agente | Worktree | Branch | Missão |
|---|---|---|---|
| 02/08 | `C:\Github\wt-310-extract` (existente) | `agente/00-p0-security-extract-310` | Diagnosticar/corrigir gates vermelhos do #415 (ErrorBoundary já corrigido lá) |
| 08 | `C:\Github\wt-08-deeplink` (novo) | `agente/08-aceite-deeplink-20261119` | Aceite E2E deep link anônimo path+query + caso open-redirect |
| 08 | `C:\Github\wt-08-dsr` (novo) | `agente/08-aceite-dsr-20261119` | Aceite DSR completo com dados sintéticos |
| 03 | `C:\Github\wt-368-rebase` (existente) | `agente/00-paleta-oficial-migracao` | Diagnosticar/corrigir 5 gates vermelhos do #368 |

Execução em background; resultados consolidados pelo 00 ao receber os relatórios.
Gate de integração e revisão 24 permanecem pendentes até as entregas chegarem.

### Resultado parcial — PR #415 (agente/02-08)

- Causa raiz única dos 3 gates vermelhos: `tests/unit/bootstrap/frontend.test.ts` importava
  `frontend.ts` → `vite`/`esbuild`, que aborta sob jsdom ("TextEncoder instanceof Uint8Array
  incorrectly false").
- Correção: pragma `// @vitest-environment node` no teste (+4 linhas, 1 arquivo). 13/13 testes
  passando localmente. Commit `8a956fd9e` pushed para `agente/00-p0-security-extract-310`.
- Pendente: confirmar `gh pr checks 415` verde após re-run do CI (~30min). Depois: revisão 24.

### Resultado — deep link E2E (agente/08)

- `tests/e2e/deeplink.spec.ts` criado: aceite positivo (path+query preservados pós-login) +
  2 casos negativos de open-redirect. Execução real (Express+Vite+Postgres+Redis): **3/3
  passed**, duas rodadas. Nenhum defeito de produto encontrado.
- PR aberto: **#426**. Pendente: CI + revisão 24 antes do merge.

### Resultado — DSR público (agente/08)

- **ACEITO sem bloqueadores.** Jornada completa verificada com dados sintéticos contra
  Postgres real + RLS: submit→202→persistência (`enc:v1:` em repouso, tokens só hash)→
  anti-enumeração→status (só metadados)→verify→dossiê restrito ao titular→token uso único→
  rate-limit 429→RLS tenant intruso invisível.
- Novo `tests/integration/dsr-public-journey.test.ts` 5/5 + unit LGPD 35/35 + tsc limpo.
- Limitações: e-mail via mock de `sendEmail` (sem SMTP local); jornada browser↔API não
  executada ponta a ponta (UI por MSW, API por integração real).
- PR aberto: **#428** + handoff de aceite `08-para-00-aceite-dsr-publico.md` (resolvido).

## Riscos restantes

- #368 acumula 100 arquivos e 5 gates vermelhos — risco de retrabalho se a paleta for decidida de outra forma; decisão de produto/identidade visual pendente do humano (11) se houver divergência intencional entre doc e implementação.
- ErrorBoundary em main segue expondo stack trace — vazamento de detalhe técnico em UI protegida (severidade baixa-média, mas trivial de corrigir).
- Aceites E2E (deep link, DSR) dependem de ambiente com backend + e-mail; se não houver sandbox de e-mail, registrar limitação explicitamente (AGENTS.md §29/§30).
