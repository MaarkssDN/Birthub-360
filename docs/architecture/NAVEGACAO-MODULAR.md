# Navegação Modular — Arquitetura Final e Evidências de Homologação

Missão: reconstrução da navegação do Birthub 360° em workspaces independentes
(Hub Central + 11 módulos + assistentes globais), sob a skill Impeccable em
modo OPERATE.

Status: **implementado e validado em ambiente local; homologação formal
pendente de revisão do Agente 24 e resolução do bloqueio de hotspot de
arquitetura (ver §H).**

---

## A. Arquitetura final e mapa dos 11 módulos

Fonte canônica: `src/components/layout/moduleRegistry.ts`.

| ID | Módulo | Home | Acesso |
|---|---|---|---|
| HUB | Hub Central | `/app` | todos |
| P01 | Hub Comercial (CRM) | `/app/crm` | roles CRM |
| P02 | Inteligência de Mercado | `/app/prospect` | roles prospecção |
| P03 | Orquestração de Vendas | `/app/jornadas` | — |
| P04 | Performance Comercial | `/app/analytics` | — |
| P05 | Previsibilidade Comercial | `/app/forecast` | — |
| P06 | Inteligência Artificial | `/app/intelligence` | — |
| P07 | Automação & Conectividade | `/app/integrations` | — |
| P08 | Engajamento Comercial | `/app/mesa-tratamento` | — |
| M09 | Admin & Operations | `/app/settings` | ADMIN |
| M10 | Mobile & Field Sales | — (mobile-only) | desabilitado no rail web |
| M11 | Social Selling | `/social-selling` (fora de `/app`) | `RequireModuleAccess` |

O rail (`ModuleRail`) renderiza HUB + P01–P08 + M09–M11 com código, label e
tagline via `aria-label`/tooltip. `getActiveModuleId(pathname)` resolve o
módulo ativo por **prefixo de rota mais longo**, com fallback por tipo de tab.
`getVisibleModuleItems`/`getRailModules` filtram por permissões do `useAuth`
— itens restritos não aparecem sem a flag correspondente.

## B. Matriz de compatibilidade de rotas

Nenhuma rota foi removida ou renomeada. Todas as rotas `/app/*` existentes
continuam resolvendo — o redesign é de **navegação**, não de roteamento.
`App.tsx` não foi alterado. Deep links verificados em browser:

| URL | Resultado observado |
|---|---|
| `/app` | Hub Central + rail + painel contextual do Hub |
| `/app/crm` | workspace P01, painel "Navegação — Hub Comercial" |
| `/app/contacts?view=decisores` | heading "Decisores" (query state preservada) |
| `/app/crm360` | overview CRM dentro do P01 |
| `/app/prospect` | workspace P02 |
| `/app/jornadas` | workspace P03 ("Jornadas Comerciais") |
| `/app/analytics` | workspace P04 |
| `/app/forecast` | workspace P05 |
| `/app/intelligence` | workspace P06 ("Hub de IA") |
| `/app/integrations` | workspace P07 |
| `/app/mesa-tratamento` | workspace P08 |
| `/app/settings` | workspace M09 |
| `/social-selling` | M11 fora de `/app`, com `RequireModuleAccess` |
| `/app/copiloto_ia` | módulo completo preservado + `RequireRole` |

Compatibilidade de links internos (CommandPalette, cards de KPI,
`LeadCopilotoPanel` → `/app/copiloto_ia?tab=…`, navegação por voz): mantida
por não haver mudança de rotas.

## C. Mapa de componentes

**Criados:**
- `src/components/layout/moduleRegistry.ts` — registro canônico dos 11 módulos.
- `src/components/layout/ModuleRail.tsx` — rail global de módulos.
- `src/components/layout/ModuleNavPanel.tsx` — painel contextual do módulo ativo.
- `src/components/layout/AssistantsDock.tsx` — dock global Copiloto + Chatbook.

**Modificados:**
- `Sidebar.tsx` — reescrito como composição `ModuleRail` + `ModuleNavPanel`
  (mesma assinatura de props; `MainLayout` e `MobileNavDrawer` inalterados).
- `MainLayout.tsx` — monta `AssistantsDock` fora do `<main>`; rail oculto
  abaixo de `lg` (mobile usa `MobileNavDrawer`).
- `CopilotoIaPanel.tsx` — novo modo `embedded` (painel não-modal); URL segue
  controlando `?tab=`/`?leadId=` na rota cheia.
- `CopilotoIaHub.tsx` — wrapper fino sobre `CopilotoIaPanel`.
- `MobileNavDrawer.tsx` — consome o novo `Sidebar` (rail + painel).

**Removidos:** `sidebarSections.ts` (substituído pelo registry; só testes o
importavam — testes reescritos contra `moduleRegistry`).

**Reutilizados sem alteração:** `FloatingChatbook`, `AppTopbar`,
`CommandPalette`, `VoiceCommandWidget`, `ModuleAgentWidget`,
`ActiveRecordContext`, `PageTransition`, guards `RequireRole`/
`RequireModuleAccess`, todo o backend.

## D. Modos dos assistentes globais

- **Chatbook**: `FloatingChatbook` real (drawer 540px, z-1000, backdrop
  z-999), montado sob demanda e **mantido montado** após a primeira abertura
  — histórico/stream SSE sobrevivem à troca de módulos e a
  abrir/fechar. Estado em sessionStorage.
- **Copiloto IA**: painel lateral não-modal (`motion.aside`, 440px,
  z-1002) com `CopilotoIaPanel embedded`. Escape fecha; foco vai ao botão
  fechar; não usa Drawer Radix (modal) justamente para permitir
  simultaneidade. Lead ativo via `ActiveRecordContext` (`?leadId=` na rota
  cheia; prop `leadId` no embed).
- **Simultaneidade**: com os dois abertos em ≥ lg, o Copiloto desloca-se
  para `lg:right-[540px]` (esquerda do Chatbook); em < lg o painel mais
  recente sobrepõe e a pilha de gatilhos se esconde (fechamento pelo X de
  cada painel). A pilha de gatilhos sobe para z-[1001] quando o Chatbook
  está aberto, pois o backdrop z-999 cobre a tela toda.
- **Permissões**: botão do Copiloto só renderiza com `canAccessCopilotoIa`;
  a rota cheia mantém `COPILOTO_IA_ROLES`/`RequireRole`. Nenhuma
  autorização foi duplicada ou contornada — painéis consomem os mesmos
  dados das rotas.

## E. Estratégia de preservação de estado

Híbrida, conforme a missão:

- **URL**: módulo ativo (path), abas, filtros, `view`, `leadId`, paginação —
  deep-linkável e shareable. Ex.: `/app/contacts?view=decisores` renderiza a
  view Decisores diretamente.
- **sessionStorage**: estado de UI dos assistentes
  (`@birthhub:assistant-chatbook-open`, `@birthhub:assistant-copiloto-open`)
  — sobrevive a navegação entre módulos e reload, morre com a aba/sessão.
  Nenhum dado pessoal é persistido nesses keys (só booleanos).
- **Estado de sessão de navegação**: posição do rail/painel é derivada da
  URL — voltar/avançar do browser funciona.
- Não foi introduzido keep-alive de rotas nem store global novo; rascunhos
  de formulários seguem o comportamento pré-existente de cada feature.

## F. Impeccable (modo OPERATE) — achados e correções

Aplicado durante shape/critique/layout/adapt/audit:

- Hierarquia: rail fino com código do módulo (P01…M11) + tagline acessível;
  painel contextual identifica o workspace (heading + `nav` rotulada).
- Acentos por módulo via tokens do registry; estado ativo com indicador
  dedicado; M10 desabilitado com explicação "disponível no app mobile".
- Cor rigor: títulos/subtítulos nunca em preto/branco puro — `text-ink`/
  tokens do tema; paleta oficial preservada (#00D4FF, #FF2D9B, #FFC107,
  #8B7DFF).
- `prefers-reduced-motion` respeitado pelas transições Framer Motion
  existentes; animações de painel são springs curtas, discretas.
- A11y: `aria-label`, `aria-expanded`, `aria-current`, botões 48px,
  focus-visible rings, Escape fecha painéis, painéis com `role` adequado.
- Correções feitas em validação: overlap do backdrop do Chatbook sobre os
  gatilhos (z-index da pilha → z-[1001]); rail vazando para mobile
  (oculto < lg); ícone Lucide recebendo prop `isActive` inválida;
  classe de scroll inexistente.

## G. Evidências visuais

Capturas reais em `.agents/runs/navmod-evidencias/`:

- `assistentes-simultaneos-crm.png` — CRM + Chatbook + Copiloto abertos
  lado a lado (viewport 1262px).
- `crm-mobile.png` — CRM em 390px.
- `mobile-drawer-modulos.png` — drawer mobile com os 11 módulos.
- `p02-dark-desktop.png` — workspace P02 em tema escuro, desktop 1440px.

Validações de snapshot (agent-browser, acessibility tree): rail completo
em todas as rotas; painéis contextuais corretos por módulo; drawer mobile
com troca de módulo funcional (P02 → `/app/prospect`); assistentes
simultâneos renderizados; `?view=decisores` deep link OK; `scrollWidth`
= viewport em 390px (sem scroll horizontal).

## H. Testes executados — consolidação final (2026-11-10, missão de saneamento)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (após refactor do catálogo e novos arquivos) |
| `npm run lint` (biome) | ⚠️ exit 0; warnings repo-wide pré-existentes. **Classificação**: `biome lint` nos 8 arquivos novos/alterados da missão → **0 diagnósticos**. Os ~1.437 warnings são de código legado fora do escopo (unused params, import-type, sugestões a11y, `!important` CSS). |
| Vitest navegação (`navHiddenTabs`, `sidebarHorizonte1`) | ✅ 2 arquivos / 11 testes |
| Vitest characters (`characterCatalog`, `characterRuntime`) | ✅ 2 arquivos / 23 testes — regressão do split do catálogo |
| `npm run test:architecture` | ✅ **VERDE** — depcruise 1.950 módulos/0 violações; coverage OK; hotspots: 0 acima de 1000 sem exceção. `characterCatalog.ts` refatorado por split real (sem exceção artificial). |
| `npm run build` | ✅ vite + server.cjs + verify:pwa-precache (221 entradas) |
| `npm run test:e2e` — `tests/e2e/modular-navigation.spec.ts` | ✅ **5/5 testes executados e aprovados** (rail/módulos, troca de workspace, deep link, assistentes simultâneos, drawer mobile) |
| Browser real (agent-browser) | ✅ evidências em `.agents/runs/navmod-evidencias/` |

### Correções de infraestrutura aplicadas nesta rodada

1. **Causa-raiz do Redis/E2E**: `.env.test` apontava `localhost:5434/6379/7700`,
   mas o Docker daemon é **remoto** (`DOCKER_HOST=tcp://192.168.0.116:2375`) —
   as portas são publicadas no host remoto, não em localhost. O `.env` de dev
   já usava `192.168.0.116` corretamente; só o `.env.test` estava divergente
   (arquivo gitignored, ajuste local). `prospectordb_test` confirmado
   existente no Postgres remoto; Redis respondeu `PONG` via `docker exec`.
2. **`tests/e2e/helpers.ts`**: placeholder do campo nome atualizado de
   `Seu nome` para `Seu nome completo` — `/login` renderiza `Landing360`
   (`initialScreen="login"`), não o `NewLoginScreen` legado. Afeta
   positivamente todas as specs que usam `signUp`.
3. **`tests/e2e/modular-navigation.spec.ts`**: seletores corrigidos para
   strict mode (`exact: true` no heading Decisores; escopo
   `complementary` no botão fechar do Copiloto).

### Hotspot `characterCatalog.ts` — resolvido por refatoração real

Split em 4 arquivos, contratos públicos preservados via facade:

- `characterCatalog.shared.ts` (142 ln) — tipos, `CHARACTER_STATES`,
  `ALL_STATES`, constantes de abas.
- `characterCatalogPillars.ts` (294 ln) — 9 personagens-pilar.
- `characterCatalogAgents.ts` (632 ln) — 20 agentes/canais/orquestração.
- `characterCatalog.ts` (67 ln) — facade: re-exports de tipos/estados,
  `CHARACTER_CATALOG` composto e todos os helpers (`getCharacter`,
  `getCharacterOrFallback`, `getPillarCharacter`, `getCharactersByLayer`,
  `getCharactersByAgent`, `characterSvgSrc`).

Nenhum consumidor precisou ser alterado; os 29 personagens preservados
(teste `characterCatalog.test.ts` verde). Handoff
`00-para-dono-characters-hotspot-exception.md` pode ser marcado resolvido.

## I. Parecer final — Agente 00

**Status: HOMOLOGAÇÃO PLENA para a navegação modular** (escopo desta
missão), com ressalvas operacionais documentadas abaixo.

Critérios de aceite — todos verificados com evidência executável:

1. ✅ 11 módulos com navegação contextual (rail + painel por workspace,
   validado no browser e em E2E).
2. ✅ Hub Central operacional.
3. ✅ Troca de módulos sem perda indevida de trabalho (estado em URL +
   sessionStorage para assistentes).
4. ✅ Copiloto IA e Chatbook simultâneos (E2E + screenshot).
5. ✅ Painéis globais respeitam permissões (`canAccessCopilotoIa`,
   `RequireRole`, `RequireModuleAccess`; sem bypass).
6. ✅ Agentes/`ActiveRecordContext` preservados; catálogo de personagens
   intacto após split (23 testes verdes).
7. ✅ Rotas existentes compatíveis (nenhuma rota alterada; deep links
   verificados).
8. ✅ Identidade visual oficial preservada (tokens, sem preto/branco
   puro em títulos, acentos por módulo).
9. ✅ Sem scroll horizontal em 390px; M10 desabilitado no web;
   M11 em `/social-selling` com guard.
10. ✅ Gates executados: `tsc` ✅, `build` ✅, `lint` ⚠️ (warnings
    pré-existentes classificados, 0 nos arquivos da missão),
    `test:architecture` ✅ verde, unitários ✅, E2E 5/5 ✅.

**Ressalvas (não bloqueantes para esta entrega):**
- `.env.test`: ajuste local aplicado e causa-raiz eliminada de forma
  permanente — `prepare-integration-env.js` agora reescreve os hosts de
  serviço para o host do `DOCKER_HOST` remoto ao gerar `.env.test`, e
  `.env.test.example` documenta o comportamento. `.env.test` segue
  gitignored por conter credenciais de teste.
- 49 arquivos >700 linhas: inventariados por domínio/dono em
  `docs/architecture/HOTSPOT-700-DEBT.md` (warnings não-bloqueantes,
  modularização delegada aos donos).
- Warnings de chunk: `vendor-3d` isolado via `manualChunks`; demais
  chunks grandes já são lazy — avaliação em `HOTSPOT-700-DEBT.md`.
- Setup wizard/RLS no ambiente local permanece limitação conhecida,
  não relacionada à navegação.

Sem deploy, merge ou publicação realizados.
