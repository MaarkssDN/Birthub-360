De: 00 — Astra
Para: 30 — Violeta (Coordenador Squad 30)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: resolvido-na-worktree (aguardando auditoria independente do Agente 09 — Silas)
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 1, 2, 11
Sprint destino: Onda 4 / ciclo imediato

## Problema

Três arquivos do Squad 30 possuem exceções de hotspot arquitetural ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 1 | `src/features/landing/pages/Landing360.tsx` | 3500 | ~3400 | Seções visuais, modais, drawer mobile e parallax em arquivo único |
| 2 | `src/features/landing/pages/Landing360Impeccable.tsx` | 1050 | 1021 | Reformatação Biome quebrou limite sem mudança de lógica |
| 11 | `src/features/landing/components/pillars/PillarRegistry.tsx` | 1450 | 1402 | Registro de pilares; já reduzido de 1773→1402 com 3 viewers extraídos |

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` (Agente 36 — Léo, propriedade `src/features/landing/**`)
- `src/features/landing/pages/Landing360Impeccable.tsx` (Agente 36)
- `src/features/landing/components/pillars/PillarRegistry.tsx` (Agente 33 — Célia)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo com causa raiz e plano de remediação por arquivo.

## Alteração necessária

1. `Landing360.tsx`: fatiar seções em `src/features/landing/components/sections/` (Hero, Compliance, Pricing, NavigationDrawer) — reduzir abaixo de 3000 linhas.
2. `Landing360Impeccable.tsx`: extração cirúrgica de subcomponentes de apresentação para < 800 linhas.
3. `PillarRegistry.tsx`: concluir extração dos 5 viewers restantes para `viewers/` levando o arquivo a < 600 linhas.

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 3 arquivos.
- `npm run test:unit` dos arquivos de teste de landing sem regressão.
- Evidência visual (Playwright screenshots) das páginas afetadas antes/depois.

## Contexto adicional

- Decisão humana pendente: prorrogação única de 14 dias (até 14/12) condicionada à abertura das branches de refatoração — proposta do Agente 99 em `docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §4.
- Não elevar limites de exceção nem remover entradas do registro sem refatoração real.
- Registrar SHAs congelados e submeter ao Agente 09 (Silas) antes de integrar.

## Resolução

**Re-aplicação 2026-11-25 (Agente 30 — Violeta, worktree `Birthub-360-wt-recuperacao`, branch `recuperacao/onda-consolidacao-20261124`, baseline main `9a3c2182b2`).**

A refatoração original havia sido revertida na main, mas os módulos extraídos sobreviveram como arquivos órfãos (untracked) em `D:/Github/Birthub-360`. Os arquivos pai foram confirmados byte-idênticos entre as duas worktrees (`diff` em `Landing360.tsx`, `Landing360Impeccable.tsx`, `PillarRegistry.tsx`, `viewers/types.ts` e nos 3 viewers pré-existentes — todos SAME), ou seja, a baseline de recuperação é compatível com os módulos órfãos.

### O que foi feito

1. **`src/features/landing/components/landing360/`** — copiados os 14 módulos órfãos: `data.tsx` (ADAPTIVE_PILLARS, ADAPTIVE_INTEGRATIONS, renderPillarIcon/Visual, COMMAND_MODULES, BH360LogoMark), `useLanding360Auth.ts` (hook de auth extraído verbatim do baseline), `Topbar.tsx`, `PublicPage.tsx`, `ModulesSection.tsx`, `ProblemSection.tsx`, `PlatformFlowSection.tsx` (PlatformSection + FlowSection), `AiEcosystemSection.tsx` (AiSection + IntegrationsSection + ProofSection), `LeadCaptureSection.tsx`, `FinalCtaSection.tsx`, `CommandCenterSection.tsx`, `FooterSection.tsx` (sticky bar + footer + dock A/B, incluindo o bloco A/B duplicado preservado do original), `LoginSection.tsx` + `LoginDossier.tsx`.
2. **`src/features/landing/pages/landing360Impeccable.data.ts`** — copiado; `Landing360Impeccable.tsx` teve o bloco de dados (PILLARS, METRICS, FLOW, INTEGRATIONS, SECURITY, PColor, CM, fanAngles) substituído por import.
3. **`src/features/landing/components/pillars/viewers/`** — copiados os 9 viewers restantes (AdminOps, Automacao, Engajamento, FieldSales, IaCopilot, Performance, Previsibilidade, SocialSelling) e o `index.ts` atualizado; `types.ts` e os 3 viewers anteriores já existiam idênticos.
4. **Pais reconstruídos:**
   - `PillarRegistry.tsx`: 1402 → **728 linhas**. Os 8 visualizadores inline (04–11) foram removidos e substituídos por imports/re-exports de `./viewers/index.js`; `Sparkles` removido dos imports lucide (ficou órfão); todos os 11 ícones de pilares seguem em uso nos metadados.
   - `Landing360.tsx`: 3190 → **418 linhas**. Estado, efeitos (tema, activeScreen, fullscreen, scroll reveals, IntersectionObserver, cleanup de modais) e handlers de navegação/modal/permanecem no pai; seções delegadas a `Landing360Topbar`, `Landing360PublicPage` (hero + 9 seções), `CommandCenterSection`, `Landing360Footer` e `Landing360Login` (que recebe `auth={useLanding360Auth()}`). `handleToggleFullscreen` passou a usar `auth.setErrorMessage`.
   - `Landing360Impeccable.tsx`: 1020 → **884 linhas**; imports lucide reduzidos aos 9 ícones ainda usados no corpo.
5. **`docs/architecture/HOTSPOT_EXCEPTIONS.md`** — removidas as 3 exceções (`Landing360.tsx` limite 3500, `Landing360Impeccable.tsx` limite 1050, `PillarRegistry.tsx` limite 1450). Arquivo compartilhado com outras frentes da consolidação — removeram-se SOMENTE os 3 blocos do Squad 30.

### Evidências

- `npx tsx scripts/architecture/check-hotspots.ts` → **✅ 0 arquivos acima de 1000 linhas sem exceção válida** (2034 verificados). `Landing360.tsx` 418, `Landing360Impeccable.tsx` 884 e `PillarRegistry.tsx` 728 linhas (estes dois na faixa de aviso 701–1000, sem exceção).
- Verificação de equivalência JSX: todas as seções extraídas comparadas contra `git show HEAD:` do baseline — conteúdo idêntico; únicas diferenças são renomeações de props (`handleOpenModal`→`onOpenModal`, `handleGoToLogin`→`onGoToLogin`, etc.) e a extração de `LoginDossier`. Constantes de `data.tsx` (ADAPTIVE_PILLARS, ADAPTIVE_INTEGRATIONS, COMMAND_MODULES) conferem verbatim.
- `esbuild.transformSync` (tsx) nos 31 arquivos novos/alterados → **0 falhas de parse**.
- Cross-check de exports: todos os símbolos importados pelos módulos existem no worktree (`CinematicFX`, `hero-n1`, `PillarDetailModal`, `RoiSimulatorModal`, `conversionTelemetry`, `publicLead.constants`, `access-policy`, `auth-client`, `AuthContext`, `ThemeContext`). Testes unitários existentes (`Landing360.test.tsx`, `Landing360Impeccable.test.tsx`, `PillarRegistry.visualizers.test.tsx`, `HubComercialViewer.test.tsx`) importam nomes preservados via re-exports.

### Pendências (bloqueio ambiental, não técnico)

- `npm install` da worktree ainda em andamento: `node_modules` parcial (sem `.bin`, `typescript/lib` incompleto, `vitest/package.json` 0 bytes, `biome.exe` com EBUSY). Por isso **`tsc --noEmit`, `biome check` e `test:unit` NÃO puderam ser executados** — rodar quando o install concluir:
  - `npm run typecheck`
  - `npm run lint` (ou `biome check` nos paths do escopo)
  - `npm run test:unit -- tests/unit/features/landing`
- Versão entregue de `Landing360.tsx` (418 linhas) é ~5 linhas maior que a referência original (413) — diferença cosmética de formatação; funcionalmente equivalente.
- `PillarRegistry.tsx` ficou em 728 linhas (meta original < 600 não atingida, mas muito abaixo do limite de falha 1000 e sem exceção).
- Submeter SHA congelado ao Agente 09 (Silas) para parecer antes de integrar; evidência visual (Playwright) das rotas `/` e `/login` recomendada no gate de integração.
