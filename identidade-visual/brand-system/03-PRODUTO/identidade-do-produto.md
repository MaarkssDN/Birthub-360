# 03 — Identidade do Produto

**Propósito:** registrar a filosofia de experiência, os princípios de UX e o modelo mental do usuário do Birth Hub 360°, distinguindo o que é **experiência observada** (evidência verificável no código/documentos) do que é **experiência recomendada** [PROPOSTO].

**Escopo:** produto web (React/Vite/Tailwind 4) + app mobile Capacitor Android. Não cobre identidade de marca (cores/tipografia → `02-IDENTIDADE-VISUAL/`) nem motion (→ `05-MOTION/`).

**Estado da informação:** CONFIRMADO nas fontes citadas, salvo itens marcados [PROPOSTO] ou NÃO VERIFICADO. Data de referência: 2026-11-19.

**Fontes:** `PRODUCT.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md` (v4.0.0), `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/moduleRegistry.ts`, `src/components/layout/tabMeta.ts`, `documentacao-aplicacao/inventario/mapa-de-navegacao.md`, `DESIGN.md`, `docs/BrandConstitution.md`, `_FATOS-CANONICOS.md`.

**Documentos relacionados:** `principios-de-ux.md`, `arquitetura-da-informacao.md`, `mapa-de-modulos.md`, `inventario-de-rotas.md`, `inventario-de-telas.md`, `jornadas-do-usuario.md`, `ux-writing.md`.

---

## 1. O que o produto é (e não é)

**Evidência — `PRODUCT.md`:** o Birth Hub 360° é o "Sistema Operacional de Revenue Intelligence", projetado para unificar inteligência preditiva, orquestração de vendas e execução em tempo real. O próprio documento declara: "Não é um CRM convencional: conecta dados, decisões automatizadas e cadências ativas" (Produto). Posicionamento pinado em `identidade-visual/v2/FONTE-DE-VERDADE.md` §2: "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence".

Consequência de UX observada: a plataforma **não segue a metáfora de CRUD de CRM** (listas + formulários); segue a metáfora de **cockpit operacional de receita** — dashboards, KPIs, filas de ação, agentes de IA e workspaces por módulo.

## 2. Experiência observada (evidências)

### 2.1 Entry point em dois atos
- `/` e `/welcome` → `Landing360` com `initialScreen="intro"`: hero + emblema + CTA único "Explorar Hub", **sem formulário de login à vista** (decisão registrada em comentário de `src/App.tsx:81-93`, revisada em 11/09/2026 por pedido explícito do usuário). O formulário existe apenas em `/login` (`Landing360 initialScreen="login"`).
- Autenticado que cai em `/` é redirecionado ao Hub automaticamente (guard dentro do WelcomeScreen).
- Rotas legadas de marca aposentadas: `/select-brand` → `/welcome`, `/hub` → `/app` (`src/App.tsx:130,139`); rotas `/treinamento-birthhub360`, `/proposta-comercial`, `/hub-inteligencia-marketing` foram aposentadas (comentário `src/App.tsx:146-151`).

### 2.2 Destino pós-login: Hub de módulos, não o CRM
- `/app` (index e `home`) → `CentralModulesHome` — "Home Central dos 11 Módulos — primeira tela apresentada pós-login" (`AppLayout.tsx:410-412`). O CRM `/app/crm` continua existindo, acessível a partir dos módulos (`App.tsx:132-138`).
- Comentário canônico: módulos executivos ficam fora do CRM "por pedido explícito do usuário" e "nunca confia em e-mail nem em papel: a autorização real vem de ModuleAccessGrant no banco" (`src/App.tsx:140-145`).

### 2.3 Navegação por módulo (rail + painel contextual)
- Sidebar global substituída por **rail de módulos + painel contextual**: `src/components/layout/ModuleRail.tsx`, `ModuleNavPanel.tsx`, `Sidebar.tsx`, registro canônico `moduleRegistry.ts` (comentário `moduleRegistry.ts:14-25`).
- 12 entradas: Hub Central (fora da numeração) + 11 módulos P01–P08, M09–M11 (`moduleRegistry.ts:27-39,371`). Cada módulo tem `tagline`, `accent`, `home` e `items` com sub-rotas reais — "toda tela continua deep-linkável em /app/*" (`moduleRegistry.ts:23-24`).

### 2.4 Navegação por jornada comercial (modelo mental)
- `documentacao-aplicacao/inventario/mapa-de-navegacao.md` §"Mapa de Navegação": os grupos seguem a **jornada comercial Captar → Qualificar → Relacionar → Fechar → Analisar**, mais "IA & Capacitação" e "Administração". A ordem dos grupos muda por papel (Closer, Gestor/Admin, Visualizador, SDR/padrão) — os mesmos itens, sem esconder por reordenação; apenas itens condicionais são escondidos por RBAC.
- Nota de divergência histórica: esse mapa descreve a Sidebar pré-registry; a estrutura atual é a de módulos do `moduleRegistry.ts`. As duas camadas coexistem: o rail organiza por **módulo**; dentro de cada módulo, os itens seguem a lógica da jornada (ex.: P01 = pipeline, gestão, propostas; P02 = prospecção, LDR). O agrupamento textual por jornada permanece na documentação e, parcialmente, nos painéis.

### 2.5 Shell fixo e camadas globais
- `AppLayout` monta `OnboardingGate` → `MainLayout` → rotas; overlays fixos: `OnboardingTour` (lazy, só na 1ª visita via `localStorage '@prospector:has_seen_tour'` — `AppLayout.tsx:391-394`) e `LiveCopilotHUD` (lazy, sempre montado — `AppLayout.tsx:657-659`).
- Todos os providers globais em `src/App.tsx:66-78`: `MotionConfig reducedMotion="user"`, `I18nProvider`, `ThemeProvider`, `ExperienceModeProvider`, `BrandProvider`, `AuthProvider`, `DailyClosingProvider`, `ActiveRecordProvider`, `ClickSpark`.

### 2.6 Gates de acesso como parte da experiência
- `ProtectedRoute` (autenticação), `RequireRole` (papéis ADMIN/GESTOR/etc.), `RequireModuleAccess` (concessão `ModuleAccessGrant`), `OnboardingGate` (obrigatoriedade de setup) — `src/components/layout/`.
- Rotas protegidas retornam o usuário ao estado correto em vez de erro cru: comentário em `AppLayout.tsx:424-429` registra que `mesa-tratamento` ganhou `RequireRole` porque VISUALIZER via o item e tomava 403 cru — padrão aplicado depois a `copiloto_ia`, `commercial_intelligence`, `usage`, `team`, `module-access`, `failover`, `resilience`, `forecast`, `metas`, `pipeline_ponderado`.
- Redirects honestos para módulos indisponíveis: `/app/dialer/*` → `/app/cadence`; `/app/outbound/*` → `/app/dashboard` (503 `MODULE_NOT_READY` intencional de `legacyModuleGate`, handoff 17→12 — `AppLayout.tsx:465-478`).

### 2.7 Densidade executiva como padrão
- `PRODUCT.md` imperativo 3: "Resposta sub-segundo, Command Palette global (⌘K) e layouts de alta densidade (Bento Grids)". `src/components/ui/` tem ~95 arquivos (Button cva com ~13 variants, VirtualTable, StatsGrid, Bento) e DESIGN.md cataloga 30 componentes oficiais. Evidência de densidade real: `AdaptiveDashboard`, `CentralModulesHome` com "círculos", `CrmBoard` kanban.

### 2.8 Estados e honestidade de dados
- 4 estados obrigatórios por módulo: Loading (Skeleton), Empty (EmptyState+CTA), Error (causa+retry), Stale (timestamp de sync), via `<OperationalStateContainer>` (`_FATOS-CANONICOS.md` §16, DESIGN.md cap.5).
- Regra dura de `PRODUCT.md`: "Zero Mock em Produção: Proibido inventar dados. Na ausência de dados, exibir Zero State explícito."

### 2.9 Dark-first / neon
- Paleta Neon homologada em 2026-10-11 (`_FATOS-CANONICOS.md` §18): dark canônico `#0D0D0D` + superfícies `#14141A/#1C1C24`, marca cyan `#00D4FF`, pink `#FF2D9B`, gold `#FFC107`, íris `#8B7DFF` (`identidade-visual/birthhub360/tokens/birthhub360.css:9-117`, espelhado em `src/styles/globals.css`). Rampas light AA existem; overrides de contraste em `src/styles/official-identity.css:62-107,264-315`.

### 2.10 Acessibilidade e movimento
- WCAG 2.2 AA inegociável (`DESIGN.md`, `docs/BrandConstitution.md`): contraste ≥4.5:1 texto, foco visível 2px+offset 3px, targets 44×44px (`_FATOS-CANONICOS.md` §14).
- Motion real: `src/lib/motion.ts` (~573 linhas, Framer Motion 13; 114 arquivos .tsx importam framer-motion), `MotionConfig reducedMotion="user"`, hooks que desativam em touch/`prefers-reduced-motion` (`_FATOS-CANONICOS.md` §7).

### 2.11 Mobile e offline
- Capacitor Android (`android/`, `capacitor.config.ts`); PWA com Workbox; M10 é módulo mobile-only (`moduleRegistry.ts:348-357`); jornadas J18 especifica offline-first com fila de sync (`BIRTHUB360_JORNADAS_OPERACIONAIS.md:301-312`).

### 2.12 LGPD-by-design
- Páginas públicas DSR: `/privacidade/dsr/verificar` e `/privacidade/dsr/acompanhamento` (`src/App.tsx:125-126`); `PRODUCT.md` exige sanitização de PII e exclusão/anonimização do titular; isolamento multi-tenant com RLS.

## 3. Modelo mental do usuário

**Evidência consolidada:**

- **Persona primária:** operadores comerciais (SDR, BDR, Closer) + liderança (Gestor, Diretor, Founder) — `PRODUCT.md` §Users.
- **Unidade de trabalho:** o *deal/oportunidade* como entidade central navegável (CrmBoard → LeadDetailDrawer → propostas → atividades), com contexto lateral (empresas, decisores, atividades) — `src/features/crm/`.
- **Unidade de tempo:** o *dia comercial* — `daily-plan` (Plano Diário), `activities` (Tarefas), `calendar`, notificações; jornada J05 define SLA de primeiro contato de 15min/2h (`BIRTHUB360_JORNADAS_OPERACIONAIS.md:111-124`).
- **Unidade de inteligência:** o *agente/assistente* — `LiveCopilotHUD` global, `AssistantsDock`, `intelligence/elite-agent`, `pending-actions`, personagens/agentes (`src/features/characters/`).
- **Navegação mental:** módulo = domínio de decisão (o que eu faço), jornada = sequência (Captar→…→Analisar). O rail responde "onde estou no pipeline de trabalho"; a jornada responde "em que etapa do ciclo de receita estou".

## 4. O que torna a experiência reconhecível como produto único

Síntese das evidências (não é citação literal de um documento):

1. **Cockpit, não formulário:** entrada por dashboards, KPIs, filas de ação e cards — não por CRUD.
2. **Módulos com identidade própria:** 12 workspaces com tagline + accent + ícone animado (`PillarIcons`), cada um deep-linkável.
3. **IA presente mas explicável:** HUD vivo, Elite Agent, pending-actions, scores "explicáveis" (ex.: ICP Score 88/100 com justificativas — J03), Monte Carlo com intervalo de confiança (J14). Nunca "caixa-preta".
4. **Personagens como camada de marca:** 29 SVGs de avatares-pilar e personagens-agente servidos em runtime (`src/features/characters/`, `public/brand/characters/`).
5. **Dark-first com neon de assinatura:** superfícies escuras, gradientes `--grad-brand/--grad-cta`, glows, tipografia Sora/Inter/IBM Plex Mono.
6. **Velocidade como valor:** PageTransition, suspense com fallback, VirtualTable, densidade alta, Command Palette ⌘K.

## 5. Experiência recomendada [PROPOSTO]

Itens que **não** são evidência atual, mas recomendação deste documento para consolidação do Brand System:

- **[PROPOSTO] Ritual de entrada único:** padronizar que todo login caia em `CentralModulesHome` (hoje é o index de `/app`, mas `/` mostra a landing — o caminho autenticado é Landing360→login→`/app`). Formalizar como "momento de marca" documentado.
- **[PROPOSTO] Camada de jornada sobre o rail:** hoje a navegação é por módulo; a jornada Captar→…→Analisar existe na documentação e parcialmente na UX. Recomenda-se expor explicitamente a etapa da jornada no AppBreadcrumbs/ExecutiveHeader [a verificar implementação atual de `AppBreadcrumbs.tsx`/`ExecutiveHeader.tsx`].
- **[PROPOSTO] Estados de módulo como contrato de marca:** os 4 estados obrigatórios existem (DESIGN.md cap.5); recomenda-se tratá-los como parte da identidade de experiência (visual e verbal) nos guias de `04-DESIGN-SYSTEM/` e `08-GUIAS-DE-IMPLEMENTACAO/`.
- **[PROPOSTO] Coerência de sub-apps:** `landing/`, `prospecting/outbound/` e `voice-hub/design-system/` têm design próprio divergente (`_FATOS-CANONICOS.md` §12). Recomenda-se roadmap de convergência — decisão pendente do Coordenador (não é decisão de documentação).

## 6. Decisões pendentes relevantes para o produto

Do consolidado `_FATOS-CANONICOS.md` §19 que afetam a experiência: grafia oficial do nome (pendente), mapeamento módulo→accent (`data-module`→`--module-accent`), contraste do CTA gradiente em light (~3:1), destinos dos CSS mortos e sub-apps divergentes, homologação do sistema V2, motion em 2 níveis (Comercial/Operacional — proposta não homologada).

## 7. Lacunas (NÃO VERIFICADO)

- Métricas reais de latência/sub-segundo do imperativo 3 (não há evidência de benchmark no repo consultado).
- Cobertura completa de Command Palette ⌘K (componente existe em `src/components/ui/CommandPalette`; escopo de comandos não auditado aqui).
- Estado atual de `ExperienceModeProvider` (modo Operate vs outros modos) — declarado em `DESIGN.md` como escopo `/app/*`; implementação não auditada nesta missão.
- Persistência real de todas as telas (débito conhecido: "settings de pilar não persistem" — `.agents/runs/audit-2026-11-18/ux-completude.md`, DEBT list).

---
*Documento gerado na missão Brand System 03-PRODUTO. Fontes primárias citadas inline; evidências consolidadas em `../_FATOS-CANONICOS.md`.*
