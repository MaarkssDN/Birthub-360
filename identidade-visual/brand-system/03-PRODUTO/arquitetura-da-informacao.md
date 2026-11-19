# 03 — Arquitetura da Informação

**Propósito:** documentar a estrutura de informação do produto: Hub Central + Workspaces Modulares + Assistentes Globais; navegação por jornada comercial; shell (rail + painel contextual, CommandPalette); diferenças por perfil.

**Escopo:** área autenticada `/app/*` e rotas top-level (`/social-selling`, `/setup`, `/design-lab/*`). Não cobre landing/login públicos (ver `inventario-de-rotas.md`).

**Estado da informação:** CONFIRMADO em código, salvo ressalvas marcadas. Data de referência: 2026-11-19.

**Fontes:** `src/components/layout/moduleRegistry.ts`, `src/components/layout/AppLayout.tsx`, `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `ModuleRail.tsx`, `ModuleNavPanel.tsx`, `AssistantsDock.tsx`, `AppTopbar.tsx`, `ExecutiveHeader.tsx`, `AppBreadcrumbs.tsx`, `src/components/ui/CommandPalette.tsx`, `src/components/layout/tabMeta.ts`, `documentacao-aplicacao/inventario/mapa-de-navegacao.md`, `_FATOS-CANONICOS.md`.

**Documentos relacionados:** `mapa-de-modulos.md`, `inventario-de-rotas.md`, `inventario-de-telas.md`, `jornadas-do-usuario.md`.

---

## 1. Modelo estrutural em três camadas

### 1.1 Hub Central (centro neural)

- **Evidência:** `HUB_MODULE` em `moduleRegistry.ts:110-125` — código `HUB`, label "Hub Central", tagline "Command Center e Meu Espaço", `home: '/app'`, accent `gold`, ícone `LayoutDashboard`.
- **Itens:** "Portal dos 11 Módulos" (`/app/home`), "Cockpit Operacional" (`/app/dashboard`), "Meu Espaço" (`/app/workspace`), "Plano Diário" (`/app/daily-plan`), "Notificações" (`/app/notifications`).
- **Posicionamento canônico** (`moduleRegistry.ts:14-19`): o Hub é "o centro neural da plataforma (Command Center + Meu Espaço), não um dos 11 módulos — vive fora da numeração oficial". O logo da aplicação já é o acesso ao Hub; o rail mostra apenas os 11 módulos (`getRailModules`, `moduleRegistry.ts:396-402`).

### 1.2 Workspaces Modulares (11 módulos)

- **Evidência:** `PRODUCT_MODULES` em `moduleRegistry.ts:127-369` — 11 entradas: P01 Hub Comercial, P02 Inteligência de Mercado, P03 Orquestração de Vendas, P04 Performance Comercial, P05 Previsibilidade Comercial, P06 Inteligência Artificial, P07 Automação & Conectividade, P08 Engajamento Comercial, M09 Admin & Operations, M10 Mobile & Field Sales, M11 Social Selling.
- **Cada módulo é um workspace independente:** `tagline`, `accent` (`NavAccent`), `home` (rota de entrada), `items` (destinos internos com `tab`, `label`, `path`, `query`, `section`, `requires`), `extraTabs`/`extraPaths` (rotas pertencentes sem item de nav), `availability` e `external` (`moduleRegistry.ts:76-95`).
- **Regra estrutural** (`moduleRegistry.ts:21-25`): "a Sidebar global virou um rail de módulos + painel contextual; os destinos internos de cada módulo são `items` aqui — nunca estado local sem rota (toda tela continua deep-linkável em /app/*)".
- Detalhe por módulo: `mapa-de-modulos.md`.

### 1.3 Assistentes Globais

- **Evidência de componentes:** `AssistantsDock.tsx` (dock de assistentes no layout), `LiveCopilotHUD` (overlay global lazy — `AppLayout.tsx:657-659`), `intelligence/elite-agent` (`EliteCommercialAgentWorkspace`), `pending-actions`/`intelligence/pending-actions` (`AIPendingActionsInbox` — inbox de ações de IA pendentes de aprovação), `OnboardingTour` (overlay lazy na 1ª visita — `AppLayout.tsx:391-394,651-655`), personagens/agentes em `src/features/characters/` e `public/brand/characters/`.
- **Distinção:** assistentes globais vivem **fora** da hierarquia de módulos — estão sempre acessíveis no shell, reforçando a metáfora de "camada de inteligência sobre o trabalho", não "mais um módulo".

## 2. Navegação por jornada comercial

- **Evidência:** `documentacao-aplicacao/inventario/mapa-de-navegacao.md` — os grupos de menu seguem a jornada **Captar → Qualificar → Relacionar → Fechar → Analisar**, complementados por "IA & Capacitação" e "Administração". A ordem dos grupos muda por papel (Closer, Gestor/Admin, Visualizador, SDR/padrão) — "os mesmos grupos, sem nenhum item escondido por reordenação; só o RBAC dos itens condicionais esconde item de verdade".
- **Mapeamento jornada → módulo/rota (síntese):**

| Etapa da jornada | Destinos típicos (fonte: mapa-de-navegacao.md + moduleRegistry.ts) |
|---|---|
| Captar | Prospecção (`/app/prospect`), Prospecção Inteligente (`/app/prospect/inteligente`), Pesquisa LDR e Hub de Inteligência (`/app/market-intelligence*`) — módulo P02 |
| Qualificar | Empresas (`/app/companies`), Contatos & Decisores (`/app/contacts?view=decisores`), Mesa de Tratamento (`/app/mesa-tratamento`), Matriz de Qualificação (`/app/qualification_matrix`) — P01/P03/P08 |
| Relacionar | Agenda/atividades (`/app/activities`), Calendário (`/app/calendar`), Cadências (`/app/cadence`) — P03 |
| Fechar | Pipeline CRM (`/app/crm`), Cockpit CRM (`/app/crm360`), Propostas (`/app/propostas`) — P01 |
| Analisar | Comercial Inteligente (`/app/commercial_intelligence`), Analytics (`/app/analytics`), Win/Loss (`/app/winloss`), Relatórios (`/app/reports`) — P04/P05 |
| IA & Capacitação | Hub de IA (`/app/intelligence`), Copiloto IA (`/app/copiloto_ia`), Chatbook, Roleplay, Matrizes de objeções, Academy, Base de Conhecimento, Editor — P03/P06 |
| Administração | Notificações, Guia Bitrix24, Integrações, Automações, Consumo de IA, Equipe, Configurações — P07/M09 |

- **Ressalva de vigência:** o mapa textual acima reflete a Sidebar documentada em 26/08/2026; a navegação vigente é o rail por módulo (`moduleRegistry.ts`). A jornada permanece como **lógica de agrupamento dentro dos módulos** e como narrativa de produto (ver `jornadas-do-usuario.md`).

## 3. Shell de navegação (rail + painel contextual)

- **Componentes** (`src/components/layout/`): `ModuleRail.tsx` (trilho de ícones dos 11 módulos + acesso ao Hub via logo), `ModuleNavPanel.tsx` (painel contextual com os `items` do módulo ativo, seções e gates `requires`), `Sidebar.tsx` (orquestração + `Sidebar.css`), `ModuleNavPanel`/`AppTopbar`/`ExecutiveHeader`/`AppBreadcrumbs` (contexto superior), `MobileNav`/`MobileNavDrawer` (navegação mobile).
- **Resolução de módulo ativo:** `getActiveModuleId(pathname)` (`moduleRegistry.ts:424-445`) — prioridade ao prefixo mais longo entre `items`/`home`/`extraPaths`; fallback por `TabType`; fallback Hub. Isso garante que deep-links como `/app/signals-risks/radar` ou `/app/settings/pillars/ai` realcem o módulo correto.
- **Gates de visibilidade:** `getRailModules`/`getVisibleModuleItems` (`moduleRegistry.ts:373-402`) filtram por permissões: `requires: 'copilotoIa' | 'commercialIntelligence' | 'operations' | 'admin'` → `canAccessCopilotoIa`, `canAccessCommercialIntelligence`, `canManageOperations`, `isAdmin`. M10 sempre visível ("informa que é o app mobile"); M11 sempre visível (a rota top-level aplica `RequireModuleAccess`).
- **Exceções de navegação:** rotas em `NAV_HIDDEN_TABS` (`tabMeta.ts`) — ex.: `voice-hub`, `outbound`, `dialer` seguem resolvendo para P08 mas estão fora da navegação (503 `MODULE_NOT_READY` intencional — `moduleRegistry.ts:321-328`, `AppLayout.tsx:465-478`).

## 4. Command Palette (⌘K)

- **Evidência:** `src/components/ui/CommandPalette.tsx` existe no design system (~95 arquivos ui); `PRODUCT.md` imperativo 3 declara "Command Palette global (⌘K)" como parte da velocidade operacional.
- **Observação:** os redirects de settings preservam compatibilidade com "Command Palette, navigationBus (voz)" — comentário `AppLayout.tsx:599-605`, indicando que a paleta é (ou era) um ponto de entrada de navegação global.
- **NÃO VERIFICADO nesta missão:** escopo exato de comandos, atalho efetivo e cobertura de todos os módulos — registrar para auditoria futura em `04-DESIGN-SYSTEM/` ou `06-EXPERIENCIA/`.

## 5. Diferenças por perfil

### 5.1 Papéis e gates (evidência)

| Papel | Evidência |
|---|---|
| `ADMIN` | `RequireRole` em `/app/team`, `/app/module-access`, `/app/usage`, `/app/settings` (admin), `/app/failover`, `/app/resilience` (este último ADMIN\|GESTOR), `/setup`; itens `requires:'admin'` no M09 (`moduleRegistry.ts:339-344`) |
| `GESTOR` | `/app/failover`, `/app/resilience` (ADMIN\|GESTOR); Lead Approval Deck é fluxo do Gestor (J04); `canAccessCommercialIntelligence` libera itens P06 |
| `CLOSER`/`SDR`/`BDR` | Roles padrão do produto (`PRODUCT.md` §Users); mesa-tratamento exige ADMIN/GESTOR/CLOSER/SDR (`MESA_TRATAMENTO_ROLES` — `AppLayout.tsx:425-429`); `copiloto_ia` exige "SDR ou superior" (`AppLayout.tsx:451-453`) |
| `VISUALIZADOR` | Não acessa itens `requires` nem rotas gated; o bug histórico de ver item e tomar 403 cru foi corrigido com `RequireRole` na rota (`AppLayout.tsx:424-429`) |
| Módulo concedido | `RequireModuleAccess` verifica `ModuleAccessGrant` no banco — "nunca confia em e-mail nem em papel" (`App.tsx:144-145`); usado em `/social-selling` |

### 5.2 Ordem de navegação por papel

- **Evidência:** `mapa-de-navegacao.md` — Closer, Gestor/Admin, Visualizador e SDR/padrão têm **ordens de grupos diferentes** (mesmos grupos; sem itens escondidos por reordenação).
- **Implementação vigente:** a reordenação por papel deve ser verificada em `Sidebar.tsx`/`tabMeta.ts` — **NÃO VERIFICADA** nesta missão se a lógica por `UserRole`/`JobRole` ainda existe após a migração para o rail de módulos (o `WorkspaceHome` resolve estado por `UserRole` real com módulos `locked` — `AppLayout.tsx:415-421`). Registrar como ponto de auditoria.

### 5.3 Workspace por cargo

- **Evidência:** `/app/workspace` → `WorkspaceHome` — "Workspace do cargo (JobRole) do usuário autenticado"; resolve READY/NO_JOB_ROLE/NO_WORKSPACE_DEFINITION via `GET /api/workspace/me`; módulos/quick actions vêm `locked` quando o `UserRole` não atinge o gate (`AppLayout.tsx:415-421`). É a camada de personalização por perfil dentro do Hub.

## 6. Mapa estrutural (síntese)

```
Landing360 (/, /welcome, /login)  →  /app
                                        │
                        ┌───────────────┼────────────────┐
                   HUB (gold)      Módulos P01–P08   M09–M11
                   /app,home,      workspaces         admin/mobile/social
                   dashboard,      com rail+painel
                   workspace,      contextual
                   daily-plan,
                   notifications
                                        │
              Camada transversal: AssistantsDock · LiveCopilotHUD ·
              OnboardingTour · OnboardingGate · CommandPalette (⌘K) ·
              AppBreadcrumbs · ExecutiveHeader/AppTopbar
```

- **Persistência de estado:** todas as rotas `/app/*` são `React.lazy` + `Suspense` + `PageTransition`; `*` dentro de `/app` redireciona para `/app` (`AppLayout.tsx:647`); `*` global → `/welcome` (`App.tsx:182`).

## 7. Decisões pendentes e lacunas

- **[PROPOSTO] Jornada visível no shell:** a jornada Captar→…→Analisar é narrativa documental; não há evidência de indicador de "etapa da jornada" na UI vigente — candidato a item de `09-PLANO-DE-EVOLUCAO/`.
- **NÃO VERIFICADO:** implementação exata de CommandPalette, cobertura de comandos por módulo e atalho.
- **NÃO VERIFICADO:** reordenação de navegação por papel pós-migração para rail de módulos.
- **Conflito documental:** `mapa-de-navegacao.md` (26/08/2026) precede o registry de módulos; recomenda-se atualizar o inventário quando o rail for a fonte vigente — dono do arquivo: Agente 11 (`documentacao-aplicacao/**`).

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*
