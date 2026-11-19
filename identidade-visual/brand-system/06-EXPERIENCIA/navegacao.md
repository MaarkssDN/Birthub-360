# Navegação

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** documentar o modelo de navegação do produto: shell, hierarquia, navegação por perfil e transições de página.
- **Escopo:** `src/components/layout/`, `src/components/ui/CommandPalette.tsx`, `src/App.tsx`, `documentacao-aplicacao/inventario/mapa-de-navegacao.md`.
- **Estado da informação:** CONFIRMADO em 2026-11-19.
- **Fontes:** arquivos citados inline + `_FATOS-CANONICOS.md` §8/§9.
- **Relacionados:** `05-MOTION/transicoes.md`, `responsividade.md`, `landing-pages.md`.

---

## 1. Arquitetura do shell

O app autenticado usa `AppLayout` → `MainLayout` (`src/components/layout/AppLayout.tsx`, `MainLayout.tsx`), que compõe:

| Componente | Papel | Evidência |
|---|---|---|
| `Sidebar` | Duas camadas: `ModuleRail` (rail fixo de ícones dos 11 módulos + Hub) + `ModuleNavPanel` (navegação contextual do módulo ativo) | `Sidebar.tsx:1-20` (docblock), `ModuleRail.tsx`, `ModuleNavPanel.tsx` (338 linhas) |
| `AppTopbar` | Barra superior contextual; dispara `onOpenMobileNav` e busca ⌘K | `AppTopbar.tsx`, `MainLayout.tsx:62` |
| `AppBreadcrumbs` | Breadcrumbs de localização | `AppBreadcrumbs.tsx` |
| `MobileNavDrawer` | Drawer de navegação mobile (contrato `mobileOpen` preservado pela Sidebar) | `MobileNavDrawer.tsx`, `Sidebar.tsx` docblock, `MainLayout.tsx:54` |
| `CommandPalette` | Busca/comandos global, atalho ⌘K/Ctrl+K | `src/components/ui/CommandPalette.tsx:152-155` |
| `PageTransition` | Wrapper de transição de rota (ver `05-MOTION`) | `PageTransition.tsx` |
| `OnboardingTour`, `LiveCopilotHUD` | Shell fixo lazy nas rotas `/app` | `_FATOS-CANONICOS.md` §9 |

## 2. Modelo de módulos

`src/components/layout/moduleRegistry.ts` é o **registro canônico dos 11 módulos oficiais** (P01–P08 pilares + M09–M11 complementares; Hub Central fora da numeração). Docblock (linhas ~14-22):

- "Cada módulo é um workspace independente: a Sidebar global virou um rail de módulos + painel contextual".
- "Entrar em outro módulo exige 'sair' do atual" — troca de módulo é navegação de primeiro nível.
- "O estado interno de cada módulo é rota" — **toda tela continua deep-linkável em `/app/*`** (nada de estado local sem rota).

`moduleThemes.ts` define acentos por módulo (`NavAccent`/`TabType` de `tabMeta.ts`).

## 3. Rotas (resumo verificado)

- Router: `react-router-dom` v7, `BrowserRouter` em `main.tsx`; `/app/*` → `AppLayout` (`_FATOS-CANONICOS.md` §9).
- `/app` tem ~50 rotas: `home`, `dashboard`, `workspace`, `prospect`, `crm`, `crm360`, `signals-risks`, `intelligence`, `companies`, `contacts`, `activities`, `cadence`, `playbooks`, `jornadas`, `processos`, `roteiros`, `chatbook`, `roleplay`, `gamification`, matrizes, `bitrix`, `reports`, `integrations`, `knowledge`, `analytics`, `winloss`, `war-room`, `market-intelligence`, `propostas`, `daily-plan`, `sdr-diagnostic`, `calendar`, `notifications`, `automations`, `editor`, `settings` (+pillars), `characters`.
- Rotas com `RequireRole`/`RequireModuleAccess`: `mesa-tratamento`, `copiloto_ia`, `commercial_intelligence`, `forecast`, `metas`, `pipeline_ponderado`, `usage/team/module-access` (ADMIN), `failover/resilience` (ADMIN|GESTOR).
- Todas as rotas `/app/*` são `React.lazy` + `Suspense` + `PageTransition` (`src/App.tsx`).
- Catch-all `*` → `/welcome`.

## 4. Navegação por perfil

`documentacao-aplicacao/inventario/mapa-de-navegacao.md` documenta **ordens de grupos diferentes por papel**: Closer, Gestor/Admin e SDR/padrão veem os mesmos grupos em ordens distintas. Achados correlatos:

- `settingsPillarNav.ts` — navegação de settings por pilar.
- "Comercial Inteligente" visível apenas para Gestor/Admin (`canAccessCommercialIntelligence`) — mapa-de-navegacao §grupos.
- Settings de equipe/módulo só para `ADMIN`.
- Gate em camadas: `RequireRole` + `requireRole` backend + `ModuleAccessGrant` + `legacyModuleGate` 503 (auditoria `.agents/runs/audit-2026-11-18/ux-completude.md`, seção "Saudável").

## 5. Command Palette (⌘K)

- Atalho global `(metaKey||ctrlKey)+k` em `CommandPalette.tsx:152-155`; também disparada pela busca do topbar.
- Ações de criação (ex.: "Nova oportunidade") navegam com `intent` — **dívida conhecida UX-01**: `CrmBoard` não lê o intent `open-create` (`.agents/runs/audit-2026-11-18/ux-completude.md`).

## 6. Transição entre páginas

Toda troca de rota `/app/*` passa por `PageTransition` → `pageTransitionClean` (220ms enter / 150ms exit, opacity+translate; ver `05-MOTION/transicoes.md`). Rotas públicas (landing/login) **não** usam `PageTransition` — têm motion próprio.

## 7. Mobile

Abaixo de `lg` (1024px), `Sidebar` esconde rail+painel (`hidden lg:flex`, `Sidebar.tsx:61-64`) e a navegação migra para `MobileNavDrawer` + `AppTopbar` (ver `responsividade.md`).

## 8. Lacunas

- `MobileNav.tsx` é apenas re-export de `MobileNavDrawer` (2 linhas).
- Breadcrumbs (`AppBreadcrumbs`) existem, mas cobertura por rota **NÃO VERIFICADA** exaustivamente.
- Não há "voltar" contextual dedicado além do breadcrumb/browser back.
