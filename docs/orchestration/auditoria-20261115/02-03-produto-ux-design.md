# Auditoria 2026-11-15 — Cluster Agentes 02/03: Produto, UX, Design e Acessibilidade

**Demanda:** DEM-20261115-001
**Escopo:** camada de produto/UX/design do frontend (`src/App.tsx`, navegação principal, `src/components/ui/`, tokens de design, padrões de páginas das features, responsividade mobile, acessibilidade).
**Método:** leitura estática do código-fonte (nenhum arquivo modificado, nenhum teste executado — auditoria por evidência de código).

---

## 1. Escopo auditado

Arquivos lidos integralmente ou em partes relevantes:

- **Montagem e rotas:** `src/App.tsx` (183 linhas, integral), `src/components/layout/AppLayout.tsx` (662 linhas, integral), `src/components/layout/MainLayout.tsx` (integral), `index.html`, `capacitor.config.ts`, `src/contexts/BrandContext.tsx`.
- **Navegação:** `Sidebar.tsx`, `ModuleRail.tsx`, `ModuleNavPanel.tsx` (436+ linhas), `AppTopbar.tsx` (integral), `MobileNavDrawer.tsx` (integral), `Drawer.tsx`, `CommandPalette.tsx` (integral).
- **Componentes UI:** `Button.tsx`, `Input.tsx`, `Select.tsx`, `Dialog.tsx`, `Drawer.tsx`, `Modal.tsx`, `Tooltip.tsx`, `BottomSheet.tsx`, `EmptyState.tsx`, `OperationalStateContainer.tsx`, `VisualState.tsx`, `PageTitleCard.tsx`, `VirtualTable.tsx`, `Toaster.tsx`, `ErrorBoundary.tsx` (`src/components/`).
- **Tokens/estilos:** `src/index.css`, `src/styles/globals.css` (trechos: fontes, `:root`, `.dark`, `@media prefers-reduced-motion`), `luxury-tokens.css`, `official-identity.css`, `elegance.css` (listados).
- **Páginas amostradas:** `ContactList.tsx` + `ContactForm.tsx` (contatos — leitura integral), `Notifications.tsx` (parcial), `CrmBoard.tsx` (Kanban, trecho), `ForecastAccuracyCard.tsx` (trecho), `CommercialIntelligence` (trechos).
- **Varreduras transversais (grep em todo `src/`):** `<div onClick>`, `tabIndex`, `<img>` sem `alt`, `<h1>` em features, `htmlFor` vs `<input>`, `logout` em layout/settings, `prefers-reduced-motion` nos estilos, uso de `Modal.tsx` vs `Dialog.tsx`.

Não auditado em profundidade: `src/features/landing/**` (páginas públicas de marketing), `src/features/voice-hub/**` (sub-app quase autônomo), `identidade-visual/**` (documentação/brandbook, não código executável), `design-system-guide/`, testes E2E.

---

## 2. Elogios

1. **Tokens de design com rastreabilidade WCAG embutida no código.** `src/styles/globals.css:247-257` documenta com medição calculada por que `--border-input` (≥3:1, WCAG 1.4.11) e `--focus-ring` existem separadamente de `--line` (decorativo, ~1.2:1). Comentários em `globals.css:312-337` registram achados reais de contraste do axe-core com valores medidos (ex.: `#d03b3b` 4.80:1 claro / 3.86:1 escuro → par `--critical`/`--critical-active`). É raro ver essa disciplina.

2. **Foco visível universal e consistente.** `src/index.css:4-8` define `:focus-visible` global; `Button.tsx:12`, `Input.tsx:7`, `ModuleNavPanel.tsx:33-35`, `ModuleRail.tsx:20` usam `focus-visible:ring-2 focus-visible:ring-focus-ring`. O `--focus-ring` é derivado de `--brand-text` (escurecido 53%) justamente porque o `--brand` cru media 2.26–2.65:1 (`globals.css:253-257`).

3. **`prefers-reduced-motion` coberto nos dois mundos.** CSS puro: `globals.css:1583-1599` zera durations com `!important` (WCAG 2.3.3); Framer Motion: `App.tsx:65` `<MotionConfig reducedMotion="user">` envolve toda a árvore; componentes individuais ainda usam `useReducedMotion`/`motion-safe:` (ex.: `EmptyState.tsx:15-21`, `Button.tsx:12`).

4. **Estados loading/vazio/erro/stale como padrão de design system.** `OperationalStateContainer.tsx` implementa `loading | empty | error | stale | ready` com skeleton, `EmptyState` com CTA e banner de dados em cache com "Última sincronização" e reconexão. `ContactList.tsx:361-382` aplica corretamente (erro ≠ vazio, com retry).

5. **Formulários com validação real.** `ContactForm.tsx` usa `react-hook-form` + `zodResolver` com schema estendido localmente (`contactFormSchema`), `<Label htmlFor>` em todos os campos, `aria-invalid` propagado por `Input.tsx:49`, `preventClose={isSubmitting}` no Dialog e comentário documentando por que `type="text" inputMode="email"` (linha 148-151). Padrão exemplar.

6. **Command Palette com foco gerenciado de verdade.** `CommandPalette.tsx:166-209`: trava de foco Tab/Shift+Tab cíclica, restaura foco ao elemento anterior ao fechar, `role="dialog" aria-modal="true"`, busca real debounced em empresas/contatos, navegação por setas + Enter, atalho ⌘K global.

7. **Semântica de navegação correta.** `ModuleRail.tsx:94` (`<nav aria-label>`), `ModuleNavPanel.tsx:200-203` (`aria-current="page"` em item ativo, `aria-expanded` no toggle do painel linha 209), `MobileNavDrawer.tsx:29-42` (backdrop com `aria-label`, `aside` com `aria-label`, Escape fecha). `aria-current` e `aria-expanded` usados corretamente.

8. **Toasts acessíveis.** `Toaster.tsx:68-69`: `role="alert"/"status"` + `aria-live` assertive/polite conforme severidade, botão de fechar com `aria-label`, dismiss por arraste.

9. **Kanban com DnD acessível.** `CrmBoard.tsx:808-815` usa `@dnd-kit` com `accessibility={{ announcements }}` e região de scroll horizontal focável (`tabIndex={0}`, `role="region"`, `aria-label` — linhas 783-790), com biome-ignore justificado.

10. **Theme-color reativo ao tema.** `BrandContext.tsx:55-66` observa a classe `.dark` via `MutationObserver` e atualiza `<meta name="theme-color">` — relevante para a barra do navegador e WebView do Capacitor.

11. **Lazy loading disciplinado.** Todas as ~60 rotas de `/app/*` usam `React.lazy` com `PageFallback` (skeleton com `data-testid`), e o chunk pesado do `OnboardingTour` é condicionado por `localStorage` antes do render (`AppLayout.tsx:382-390`) — comentário explica o porquê (chunk ~900kB).

12. **RBAC espelhado na rota, não só no menu.** `AppLayout.tsx` aplica `RequireRole` em `mesa-tratamento`, `integrations`, `automations`, `usage`, `team`, `module-access`, `forecast`, `metas`, `pipeline_ponderado`, `commercial_intelligence`, `copiloto_ia` — comentários citam achados reais de pilotos (403 cru em deep link). `RequireModuleAccess` para módulos executivos.

13. **`index.html` correto:** `lang="pt-BR"`, `theme-color`, script anti-FOUC de tema, `noscript`, fontes self-hosted.

---

## 3. Propostas de melhoria (novas implementações)

1. **Link "Pular para o conteúdo" (WCAG 2.4.1).** Não existe skip-link em lugar nenhum: `MainLayout.tsx:61` renderiza `<main>` sem `id` e sem mecanismo de bypass. Adicionar `<a href="#main-content">` como primeiro elemento focável + `id="main-content"`/`tabIndex={-1}` no `<main>` resolve navegação por teclado em todas as telas de uma vez.

2. **Migrar `MobileNavDrawer` para Radix Dialog** (ou extrair o padrão de `Drawer.tsx`). Hoje o drawer mobile é overlay customizado sem focus trap, sem `role="dialog"`/`aria-modal`, sem retorno de foco — `MobileNavDrawer.tsx:26-43`. Como a navegação principal no mobile depende 100% dele, é o caminho de teclado mais usado no app e o menos protegido.

3. **Semântica de combobox na Command Palette.** Adicionar `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` no input e `role="listbox"`/`role="option"` nos resultados, para leitores de tela anunciarem "opção 3 de 12" em vez de uma lista de botões soltos.

4. **Associação erro↔campo nos formulários.** `ContactForm.tsx:126` renderiza `<p className={errorClass}>` sem `id`, e o input não recebe `aria-describedby`. Estender `Input`/`Label` (ou criar `Field` wrapper) para gerar `aria-describedby` + `aria-errormessage` eliminaria a lacuna em todos os ~270 usos de `placeholder=`/formulários do app.

5. **Tabela acessível real ou grid ARIA completa.** `VirtualTable.tsx` usa `role="row"/"columnheader"/"cell"` sem ancestral `role="table"/"grid"` (comentário nas linhas 91-97 admite o débito). Alternativa mais barata: envolver em `role="grid"` com `aria-rowcount` e anunciar "linha X, clicável" via `aria-label` nas linhas com `onRowClick` (hoje `tabIndex=0` + Enter/Espaço existem, mas a linha não tem nome acessível nem role de ação — `VirtualTable.tsx:158-169`).

6. **Estado de "carregando rota" anunciado.** `PageFallback` (`AppLayout.tsx:357-379`) é skeleton visual sem `role="status"`/`aria-live`/`aria-busy` — screen reader não sabe que a página está carregando. Um wrapper com `role="status" aria-label="Carregando módulo"` resolve.

7. **Logout acessível no mobile.** Hoje o botão de sair é `hidden sm:flex` (`AppTopbar.tsx:258`) e não existe em nenhum outro lugar da UI (nem drawer, nem Settings — verificado por grep). No app Capacitor não há como encerrar sessão. Adicionar item "Sair" no `ModuleNavPanel` (visível em `mobile`) ou no drawer.

8. **`<title>` dinâmico por rota.** Não há `document.title` por página — todas as ~60 telas compartilham o título da landing. Um hook `usePageTitle(meta.label)` no `MainLayout` melhora histórico do navegador, abas e leitores de tela.

9. **Toast com pausa ao hover/focus (WCAG 2.2.1).** `Toaster.tsx:39-41` auto-dispensa em 4.5s sem pausa — erro some antes de ser lido. Pausar o timer em `onMouseEnter`/`onFocusWithin` é implementação pequena.

10. **Componente `Field`/`FormField` no design system.** Hoje cada form repete `space-y-2` + `Label` + `Input` + `<p className={errorClass}>` manualmente (`ContactForm.tsx:24` define `errorClass` localmente). Um wrapper com erro associado por id reduziria dívida e garantiria `aria-describedby` em todos.

11. **`ConfirmDialog`/`Dialog` mobile:** verificar se todos os diálogos customizados convergiram para Radix `Dialog`/`Drawer` — `Modal.tsx` (62 linhas, implementação paralela sem focus trap, sem Escape, com `bg-white` hardcoded) está **sem nenhum import** no codebase (grep: 0 usos). Remover ou deprecar formalmente.

12. **Linter de a11y no CI.** O projeto já usa biome com regras a11y (há `biome-ignore` justificados em `VirtualTable.tsx:1`, `CrmBoard.tsx:782-789`), mas convém um gate `axe-core`/`pa11y` no Playwright sobre as rotas principais — vários débitos documentados em comentários ("débito rastreado") só seriam pegos por teste automatizado.

13. **Contraste de `VisualState NO_DATA`.** `VisualState.tsx:82-86`: `text-white/40` sobre `bg-white/5` — no tema claro isso é texto branco 40% sobre fundo quase branco (~1:1 de contraste). Trocar por tokens `text-ink-2`/`bg-surface-2` ou definir par por tema.

14. **Breadcrumbs só no desktop.** `AppTopbar.tsx:127`: `<AppBreadcrumbs className="hidden sm:flex" />` — em telas <640px não há indicação de hierarquia além do título do módulo. Avaliar versão compacta ("Módulo › Página").

---

## 4. Erros, falhas e dívidas técnicas

### P0
Nenhum encontrado. Não há quebra funcional de navegação, perda de dados ou exposição de PII evidenciada nesta camada.

### P1

| # | Achado | Evidência |
|---|--------|-----------|
| P1-1 | **Múltiplos `<h1>` por página.** O `AppTopbar` renderiza `<h1>` com o label do módulo em toda rota `/app/*`, e dezenas de features renderizam outro `<h1>` próprio. Viola estrutura de headings (WCAG 1.3.1) e confunde navegação por headings. | `AppTopbar.tsx:128`; exemplos de segundo h1: `ActivityList.tsx:334`, `ChatbookHub.tsx:68`, `CommercialIntelligenceHub.tsx:190`, `DailyPlanHub.tsx:527`, `CompanyDetail.tsx:173`, `Editor.tsx:166`, `GamificationView.tsx:84`, `WarRoomArenaView.tsx:268`, `PropostasList.tsx:127`, `ModuleAccessAdmin.tsx:100`, `CentralModulesHome.tsx:148`, `WorkspaceReadySection.tsx:45`. `PageTitleCard` já suporta `as="h2"` (`PageTitleCard.tsx:79-96`) — a correção é sistemática, não por tela. |
| P1-2 | **Impossível fazer logout no mobile/Capacitor.** Botão de sair é `hidden sm:flex` no topbar; não há logout no `MobileNavDrawer`, `ModuleNavPanel`, nem em Settings (grep `logout` em `src/features/settings` e `src/components/layout` só acha `AppTopbar.tsx:257`). | `AppTopbar.tsx:252-264`; ausência confirmada por busca em todo `src/`. |
| P1-3 | **Drawer mobile sem gestão de foco.** `MobileNavDrawer` é overlay customizado: sem focus trap, sem `role="dialog"`/`aria-modal`, sem mover foco para dentro ao abrir nem devolver ao fechar. Escape funciona (`MobileNavDrawer.tsx:13-22`), mas Tab sai para o conteúdo atrás do backdrop. É o único caminho de navegação <1024px. | `MobileNavDrawer.tsx:12-44`. |

### P2

| # | Achado | Evidência |
|---|--------|-----------|
| P2-1 | **`VisualState` NO_DATA ilegível no tema claro.** `text-white/40` sobre `bg-white/5` fixos, sem par dark/light — no claro mede ~1:1. | `src/components/ui/VisualState.tsx:82-86`. |
| P2-2 | **Erros de formulário não associados ao campo.** Mensagens de erro renderizadas como `<p>` solto sem `id`; inputs não recebem `aria-describedby`/`aria-errormessage`. Afeta todos os formulários que seguem o padrão de `ContactForm`. | `ContactForm.tsx:126,140,152` (padrão repetido); `Input.tsx:49` só propaga `aria-invalid`. |
| P2-3 | **Command Palette sem semântica de combobox.** Resultados são botões em `<div>`s; input não tem `role="combobox"`/`aria-activedescendant`; setas só funcionam com foco no input (se o foco cair num resultado, ↑/↓ não navegam — só o `onMouseEnter`/clique). | `CommandPalette.tsx:410-475`. |
| P2-4 | **Rota duplicada `gamification`.** `<Route path="gamification">` declarada duas vezes com o mesmo elemento; a segunda é dead code e indica merge/edição descuidada. | `AppLayout.tsx:479` e `AppLayout.tsx:499`. |
| P2-5 | **`ErrorBoundary` fora do sistema de tokens e sem `role="alert"`.** Fundo `bg-black` fixo, texto `text-red-400` hardcoded, botão `bg-white text-black` — ignora tema claro/escuro e tokens; tela de erro não é anunciada a screen readers. | `src/components/ErrorBoundary.tsx:29-42`. |
| P2-6 | **`Modal.tsx` é implementação paralela abandonada.** Sem nenhum import no codebase (grep: 0 usos), mas permanece em `components/ui` com problemas: sem Escape, sem focus trap, sem fechamento por backdrop, cores hardcoded (`bg-white dark:bg-slate-900`). Risco de reuso acidental. | `src/components/ui/Modal.tsx` (arquivo inteiro); contagem de imports = 0. |
| P2-7 | **Sem skip-link / landmark bypass.** Nenhum "Pular para o conteúdo"; `<main>` em `MainLayout.tsx:61-69` não tem `id` nem `aria-label`. WCAG 2.4.1. | `MainLayout.tsx:61`; grep `skip|Pular` sem resultado em `src/`. |
| P2-8 | **Toast auto-dismiss sem pausa (WCAG 2.2.1).** 4.5s fixos, sem `onMouseEnter`/`onFocusWithin` pausando; mensagens de erro podem sumir antes da leitura. | `Toaster.tsx:39-41`. |
| P2-9 | **`VirtualTable` sem role de tabela/grid ancestral.** `role="row"`/`columnheader`/`cell` órfãos de `role="table"`/`grid"`; linhas clicáveis têm `tabIndex`+Enter/Espaço mas nenhum nome acessível nem indicação de ação. Débito reconhecido em comentário ("débito rastreado") mas não corrigido. | `VirtualTable.tsx:91-169`. |

### P3

| # | Achado | Evidência |
|---|--------|-----------|
| P3-1 | **`PageFallback` não anuncia loading.** Skeletons sem `role="status"`/`aria-busy`; screen reader não percebe a troca de rota. | `AppLayout.tsx:357-379`. |
| P3-2 | **Props mortas em `Button`.** `soundClick`, `soundHover`, `sound`, `shine` são desestruturadas e nunca usadas — API pública sugere funcionalidade inexistente. | `Button.tsx:80-83,96-99` (destruturadas; corpo não referencia). |
| P3-3 | **`document.title` estático.** Nenhuma rota atualiza o título da aba/janela; todas as telas de `/app/*` compartilham o título da landing. | `index.html:15`; ausência de `document.title` em `MainLayout`/páginas. |
| P3-4 | **Breadcrumbs ocultos no mobile.** `hidden sm:flex` remove a única indicação de hierarquia <640px. | `AppTopbar.tsx:127`. |
| P3-5 | **`BottomSheet` com `id` fixo.** `aria-describedby="bottom-sheet-description"` hardcoded colide se dois sheets existirem; `setActiveSnapPoint={() => {}}` torna `activeSnapPoint` controlado-morto. | `BottomSheet.tsx:41-42,53,69`. |
| P3-6 | **`<img>` sem `alt` em pontos pontuais.** 22 `<img>` no código; a maioria tem `alt`, mas alguns (avatares/listagens) precisam de revisão — ex.: `ModuleAgentWidget.tsx:304,391`, `Settings.tsx:207`, `Team.tsx:349` (verificar `alt=""` decorativo vs ausente). | grep `<img` sem `alt=` retornou 19 ocorrências candidatas (algumas podem ter `alt` via spread). |
| P3-7 | **Placeholders como único rótulo em parte dos forms.** 269 `placeholder=` vs 336 `<label`/`htmlFor` em features — cobertura boa mas não total; inputs só com placeholder perdem o rótulo ao digitar (WCAG 3.3.2/1.3.1 em casos específicos). Amostragem necessária por formulário. | contagens via grep em `src/features`. |
| P3-8 | **`useSidebarState`/`useNavigationState` — verificar limpeza:** `Sidebar.tsx:32-35` lê `localStorage` no `useState` initializer sem `try/catch` — em WebView com storage bloqueado pode lançar. (Padrão já usado com `try/catch` em `BrandContext.tsx:44-49`, inconsistência menor.) | `Sidebar.tsx:32-35`. |
| P3-9 | **Módulos "mobile-only" desabilitados no rail desktop.** `ModuleRail.tsx:139-140` usa `disabled` + `aria-disabled` (correto), mas `title` explica — sem link para download/explicação do app. UX de descoberta, não bug. | `ModuleRail.tsx:141-145`. |

---

## 5. Resumo executivo

A camada de produto/UX/design do Birth Hub 360 está **acima da média** para um codebase deste tamanho: tokens com contraste calibrado e documentado, foco visível universal, `prefers-reduced-motion` coberto em CSS e Framer Motion, Command Palette com focus trap real, formulários com react-hook-form+zod e labels associados, estados loading/vazio/erro/stale padronizados via `OperationalStateContainer`, navegação modular com `aria-current`/`aria-expanded` corretos e RBAC espelhado nas rotas.

Os débitos concentram-se em **três pontos sistêmicos**: (1) estrutura de headings — `<h1>` duplicado entre topbar e páginas (P1, correção sistemática via `PageTitleCard as="h2"`); (2) o drawer mobile é o elo mais fraco de acessibilidade (sem focus trap/role dialog) e o logout não existe fora do desktop (P1, crítico para Capacitor); (3) semântica ARIA incompleta em componentes compostos — Command Palette sem combobox, VirtualTable sem grid/table ancestral, erros de form sem `aria-describedby` (P2, um wrapper `Field` resolveria em massa).

Recomenda-se tratar P1-1/P1-2/P1-3 como uma única onda de "a11y estrutural" (02+03), e P2-4/P2-6 como saneamento rápido de dead code. Nenhuma evidência de violação de tenancy, LGPD ou segurança nesta camada.
