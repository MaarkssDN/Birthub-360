# Auditoria Frontend — UX, UI e Acessibilidade (Agentes 02/03)

- **Demanda:** DEM-20261115-001 (auditoria geral orquestrada pelo Agente 00)
- **Data:** 2026-11-15
- **Escopo:** `src/App.tsx`, navegação/layout (`src/components/layout/**`), design system (`src/components/ui/**`, `src/styles/globals.css`, `src/index.css`, `DESIGN.md`), estados de UI e formulários amostrados (`features/contacts`, `features/landing`, `features/settings`, `features/crm360`), acessibilidade transversal.
- **Método:** leitura de arquivos representativos + greps quantitativos (hex hardcoded, uso de primitivos, `window.confirm`/`alert`, ARIA). Não é auditoria exaustiva de cada uma das ~150 telas; padrões foram verificados onde se repetem.

---

## 1. ELOGIOS (evidências reais)

### Arquitetura de rotas e shell
- **Code-splitting disciplinado:** todas as ~60 rotas de `/app/*` usam `React.lazy` com `Suspense` e fallback dedicado (`src/components/layout/AppLayout.tsx:18-356`, fallback em `:357-379`). O comentário do `PageFallback` documenta decisão real de teste (substituição de `networkidle` por `data-testid`, linhas 359-362).
- **`MotionConfig reducedMotion="user"`** em `src/App.tsx:65` cobre framer-motion globalmente — complementa o `@media (prefers-reduced-motion)` de `globals.css:1583` e `:1662`. WCAG 2.3.3 tratado em duas camadas.
- **Gates de rota consistentes:** `ProtectedRoute` + `RequireRole`/`RequireModuleAccess` com comentários que registram *por que* cada gate existe (ex.: `AppLayout.tsx:421-425`, `:447-448`, `:535-538`, `:582-584`) — raro e valioso para manutenção.
- **ErrorBoundary no shell** `/app/*` (`App.tsx:166-168`) isola crash de rota autenticada.

### Design system e tokens
- **Tokens Tailwind v4 maduros:** `@theme` em `globals.css:723+` com papéis semânticos (`--color-ink`, `--surface`, `--line`, `--focus-ring`, `*-active` para texto sobre badges). Comentários em `globals.css:281-362` e `:679-703` documentam correções de contraste WCAG medidas (ex.: `--color-info` 3.06:1 → `--info-active`, badge soft 4.04:1 → 4.5:1+). Isso é engenharia de acessibilidade de verdade, não cosmético.
- **Tipografia self-hosted** com `unicode-range` e fallback TTF (`globals.css:13-119`) — elimina dependência de rede, bom para offline/Capacitor.
- **`index.css:5-8`**: anel `:focus-visible` global de 2px com token.
- **Primitivos Radix bem construídos:** `Dialog.tsx` tem focus trap, Esc, `aria-modal`, título `sr-only` fallback (Radix exige nome acessível), `preventClose` que bloqueia Esc/overlay/pointer (linhas 144-161), e surface mobile-safe `100dvh` (linha 23). `Drawer.tsx` replica o padrão com tratamento correto de `aria-describedby` (linhas 148-155).
- **`Button.tsx`**: `focus-visible:ring-focus-ring`, `disabled:` states, `aria-busy` no loading (linha 114), e regra de imutabilidade — `Magnetic` nunca em `destructive` (linha 130).
- **`Toaster.tsx`**: `role="alert"/"status"` + `aria-live` corretos por severidade (linhas 68-69), botão fechar com `aria-label`, drag-to-dismiss (linhas 60-67).
- **`VirtualTable.tsx`**: `role="row"/"columnheader"/"cell"`, região scrollável `tabIndex={0}` com `aria-label`, teclado Enter/Espaço em linhas clicáveis (linhas 122-169), skeleton de loading.
- **`ModuleRail.tsx`**: `<nav aria-label>` (linha 95), `aria-current="page"`, `aria-expanded` no toggle do painel (linha 209), `disabled`+`aria-disabled` em módulos mobile-only (linhas 139-140), `aria-hidden` em ícones/decorações.
- **`MobileNavDrawer.tsx`**: Esc fecha (linhas 15-22), backdrop é `<button aria-label>` real (linhas 29-34), `env(safe-area-inset-*)` (linha 39).
- **Formulários com validação real:** `ContactForm.tsx` usa `react-hook-form` + `zodResolver` + schema estendido localmente (linhas 29-31), `preventClose={isSubmitting}` no Dialog (linha 109), `Label htmlFor` em todos os campos, decisão documentada de `type="text"`+`inputMode` para não esconder erro zod atrás da validação nativa (linhas 148-151).
- **`ContactList.tsx`**: debounce de 300ms na busca (linhas 84-90), `EmptyState` distinto para erro (com retry) vs. vazio (com CTA) (linhas 361-382), `aria-label` contextual em todos os botões de ícone (`Ver detalhes de ${contact.name}`, etc., linhas 261-296), exclusão via `useConfirmDialog` — não `window.confirm`.
- **`ConfirmDialog.tsx`**: API imperativa `useConfirmDialog()` que substituiu `window.confirm` em massa, sobre o `Dialog` Radix (foco/Esc de graça).
- **`globals.css` documenta débito assumido** do `VirtualTable` (linhas 91-95 de `VirtualTable.tsx`) em vez de esconder — governança honesta.

---

## 2. PROPOSTAS de novas implementações

1. **Adotar `OperationalStateContainer` como padrão único dos 4 estados** (loading/empty/error/stale) exigidos pelo `DESIGN.md` — hoje o componente existe e tem **zero usos** (ver dívida #2). Migrar 2-3 telas piloto (contacts, companies, dashboard) e transformar em checklist de review.
2. **`useFieldError` / convenção de erro de formulário acessível:** padronizar `aria-describedby` apontando para o `<p>` de erro + `role="alert"` + passar `error` ao `Input` (que já suporta `aria-invalid` e borda danger — `Input.tsx:44,49`). Hoje nenhum formulário amostrado faz isso.
3. **Skip-to-content link** no `MainLayout` (`<a href="#main-content">Pular para o conteúdo</a>` + `id`/`tabIndex={-1}` no `<main>`), WCAG 2.4.1 — hoje inexistente.
4. **ErrorBoundary por rota lazy** ou boundary com `fallback` dentro de cada feature — hoje um crash em qualquer tela derruba o shell inteiro de `/app`.
5. **Toast com "Desfazer" para ações destrutivas** e duração estendida/sem auto-dismiss para erros críticos (WCAG 2.2.1 — timing ajustável).
6. **Script de auditoria de tokens** (`grep` de hex → relatório) no CI, com allowlist para landing/brand assets; hoje ~2.900 ocorrências sem guarda.
7. **Cobertura axe por rota crítica**: existe `tests/e2e/accessibility.spec.ts`; expandir para as ~15 rotas de maior tráfego (crm, contacts, settings, calendar).
8. **`VirtualTable` acessível completo**: implementar padrão ARIA grid com roving tabindex, ou oferecer variante "lista" (`<ul>`/`<li>`) para casos sem colunas complexas — as listas de CRM são o coração do produto.
9. **Command Palette**: garantir combobox/listbox ARIA completo (`role="combobox"`, `aria-activedescendant`, anúncio de resultados) — verificar se já existe em `src/components/ui/CommandPalette.tsx` e estender aos clones em `features/voice-hub`.
10. **Landing page**: reduzir o monólito `Landing360.tsx` (3.165 linhas) extraindo as telas intro/login/forgot em componentes — facilita testes de a11y e manutenção.

---

## 3. ERROS, FALHAS E DÍVIDAS

### P1 — Crítico/Alto impacto

| # | Achado | Evidência |
|---|--------|-----------|
| P1-1 | **`window.confirm`/`alert()` nativos ainda em produção** em módulos ativos — quebra o padrão visual, não é estilizável, e `alert()` bloqueia sem contexto. ConfirmDialog existe e é usado em CRM, mas voice-hub e integrations ficaram de fora. | `src/features/integrations/components/ExternalCrmPanel.tsx:452`; `src/features/voice-hub/components/CommandPalette.tsx:284` e `design-system/CommandPalette.tsx:284` (duplicado!); `src/features/voice-hub/components/studio/panels/TestSimulatorModal.tsx:226`; `src/features/voice-hub/components/VoiceHubView.tsx:133`; `src/features/voice-hub/pages/Dashboard/AgentRegistry.tsx:60`; `src/features/voice-hub/pages/Playground.tsx:227` e `pages/Dashboard/Playground.tsx:228`; `src/features/prospecting/outbound/App.tsx:365`. |
| P1-2 | **Erros de validação de formulário não são anunciados a leitores de tela.** `ContactForm` renderiza `<p className={errorClass}>` sem `role="alert"`/`aria-live`, e os `Input`/`Select` nunca recebem a prop `error` nem `aria-describedby` — o suporte a `aria-invalid` existe em `Input.tsx:49` mas nenhum call site o usa via react-hook-form. WCAG 3.3.1/4.1.3 em todos os formulários RHF do app. | `src/features/contacts/components/ContactForm.tsx:124-170` (padrão repetido em `companies`, `prospecting`, etc.). |
| P1-3 | **Sem skip-link / bypass de blocos** (WCAG 2.4.1): o shell tem rail + painel + topbar antes do conteúdo; usuário de teclado/ leitor de tela atravessa toda a navegação a cada troca de página. Nenhum "Pular para o conteúdo" em `src/`. | Ausência total — `grep -ri 'skip.*content\|pular para'` só acha "Pular" de paginação. |

### P2 — Alto

| # | Achado | Evidência |
|---|--------|-----------|
| P2-1 | **`OperationalStateContainer` (o componente que materializa os 4 estados obrigatórios do DESIGN.md) tem zero usos.** DESIGN.md §"Os 4 Estados Obrigatórios" manda usar `<OperationalStateContainer>`; na prática cada tela improvisa (ContactList monta EmptyState manual; outros usam Skeleton solto). Padrão normativo existe mas não é adotado → inconsistência garantida entre módulos. | `src/components/ui/OperationalStateContainer.tsx` (só exportado em `index.ts`, nenhum import). |
| P2-2 | **~2.963 hex hardcoded fora de `globals.css`** — dívida de tokenização massiva. Concentração: landing (`LandingAdaptive.css` 312, `Landing360.css` 134, `LandingRegenerationV4.css` 126, `Landing360.tsx` 54), `TechToolLogo.tsx` 126, `prospecting/outbound/**` ~200+, `voice-hub/**` ~100, `analytics`, `intelligence`. DESIGN.md isenta landing/login, mas os módulos internos (prospecting, voice-hub, analytics) não têm essa desculpa. | Contagem via grep; exemplos: `src/components/ui/TechToolLogo.tsx`, `src/features/prospecting/outbound/components/Sidebar.tsx` (14), `src/features/analytics/components/Analytics.tsx` (19). |
| P2-3 | **ErrorBoundary raiz com cores hardcoded e sem fallback customizável.** `components/ErrorBoundary.tsx:30-41` usa `bg-black`, `text-red-400`, `bg-white text-black` — quebra nos dois temas e foge dos tokens. E há **dois** ErrorBoundary com APIs diferentes (`components/ErrorBoundary.tsx` sem `fallback` vs `components/ui/ErrorBoundary.tsx` com `fallback` e `role="alert"`). Rotas públicas (`Landing360`, `PublicBookingPage`, `ResetPasswordScreen`) ficam **sem nenhum boundary** — crash = tela branca em página pública de agendamento. | `src/components/ErrorBoundary.tsx:30-41`; `src/App.tsx:112-123` (rotas públicas fora do boundary de `:166`). |
| P2-4 | **`VirtualTable` não implementa semântica de tabela completa** (débito assumido em comentário, mas é o componente de lista do CRM inteiro): header não focável, sem `role="grid"`, sem roving tabindex, `aria-label="Tabela de dados"` genérico idêntico em todas as instâncias (leitor de tela ouve o mesmo nome em contatos, empresas, deals). | `src/components/ui/VirtualTable.tsx:91-131,145`; usado por `ContactList.tsx:355` e outros. |
| P2-5 | **Formulário de login em monólito com validação parcialmente nativa desligada:** `Landing360.tsx` (3.165 linhas) tem `<form noValidate>` com atributos `required` mortos (nunca disparam), dependendo 100% de JS; hex hardcoded `dark:bg-[#070D18]`, `text-[#0284C7]` fora dos tokens. Pontos positivos: `aria-invalid`/`aria-describedby` no erro, `autoComplete` correto, medidor de senha com texto (não só cor). | `src/features/landing/pages/Landing360.tsx:2605,2790-2920`. |
| P2-6 | **Componentes do design system órfãos/mortos:** `OperationalStateContainer` (0 usos), `BottomSheet.tsx` (0 usos), `ModulePlaceholder.tsx` (0 usos), `ui/Modal.tsx` (0 imports, nem exportado em `index.ts`), `ui/VisualState.tsx` (2 usos). Superfície de API inflada sem adoção → duas "verdades" de UI. | `src/components/ui/index.ts`; greps de import. |

### P3 — Médio/Baixo

| # | Achado | Evidência |
|---|--------|-----------|
| P3-1 | **Rota `gamification` duplicada** em `AppLayout.tsx:479` e `:499` — a segunda nunca casa (React Router usa o primeiro match). Dead code. Idem `resilience` duplicando `failover` (`:565-580`, possivelmente alias intencional — confirmar). | `src/components/layout/AppLayout.tsx:479,499,565-580`. |
| P3-2 | **`Button` tem props mortas** `soundClick`, `soundHover`, `sound` — desestruturadas (linhas 95-97) mas nunca usadas no corpo; `shine` também é aceito e ignorado. API sugere features inexistentes. | `src/components/ui/Button.tsx:80-84,95-99`. |
| P3-3 | **`Modal.tsx` legado com padrões a11y quebrados** (apesar de morto hoje): sem focus trap, sem handler de Esc, `aria-labelledby="modal-title"` com id fixo (colide com 2 modais), `bg-black/50`/`bg-white dark:bg-slate-900` hardcoded. Se alguém reimportar, reintroduz bugs. Candidato a deletar. | `src/components/ui/Modal.tsx:17-56`. |
| P3-4 | **Design-lab exposto a qualquer usuário autenticado:** `/design-lab/command-language`, `/design-lab/components-v2`, `/design-lab/home-proposals` usam só `ProtectedRoute` — ferramenta interna de design visível em produção para todos os roles. | `src/App.tsx:88-111`. |
| P3-5 | **Toasts de erro auto-dismiss em 4,5s** (`AUTO_DISMISS_MS = 4500`, `Toaster.tsx:23,39-41`): WCAG 2.2.1 — usuário pode não ler o erro a tempo; sem hover-pause. Drag/close mitigam parcialmente. | `src/components/ui/Toaster.tsx:23,39-41`. |
| P3-6 | **Sons de UI ligados por default** (`SoundFX.enabled = true` quando sem preferência salva) — `src/lib/soundEffects.ts:18-23`. Existe toggle persistido (bom), mas opt-out deveria ser o padrão para não surpreender; verificar se o toggle é descobrível na UI. | `src/lib/soundEffects.ts:14-23,76-89`. |
| P3-7 | **`Select` de empresas no ContactForm carrega só 200 registros** sem busca/paginação e falha silenciosa (`catch` só loga) — tenant com >200 empresas não consegue vincular contato à empresa certa. | `src/features/contacts/components/ContactForm.tsx:61-66`. |
| P3-8 | **Fallback hex `#0ea5e9`** no anel de foco global caso `--ring` não esteja definido — fora dos tokens neon oficiais. | `src/index.css:6`. |
| P3-9 | **Landing variants acumuladas:** `Landing360Impeccable.tsx`, `LandingAdaptive.css`, `LandingCinematic.css`, `LandingConversionV5.css`, `LandingRegenerationV4.css`, `LandingInnovative` (`/landing-new` roteada publicamente, `App.tsx:114`) — 5+ direções visuais de landing no repo; só uma é a oficial. | `src/features/landing/pages/`; `src/App.tsx:112-114`. |
| P3-10 | **`CommandPalette` duplicado** em `src/components/ui/` e `src/features/voice-hub/components/` + `design-system/` — os clones já divergem (ambos com o `alert()` do P1-1). Risco de correção em um não propagar. | `src/features/voice-hub/components/CommandPalette.tsx:284` vs `design-system/CommandPalette.tsx:284`. |
| P3-11 | **`/hub` redireciona para `/app`** (`App.tsx:129`) embora o comentário descreva "Hub Executivo (círculos)" como destino distinto — nomenclatura/comentário dessincronizado do comportamento; confunde o próximo agente. | `src/App.tsx:124-129`. |
| P3-12 | **`PageFallback` e skeletons genéricos** (`bg-white/10`, `bg-white/5` em `AppLayout.tsx:368-376`) não seguem tokens de superfície — em tema claro o skeleton pode ficar invisível/estranho. Verificar contraste do fallback nos dois temas. | `src/components/layout/AppLayout.tsx:368-376`. |

### Persistência de achados antigos (cruzamento com auditorias prévias)
- **Hex hardcoded:** o TechDebt report de 29/09 já apontava "hardcoded" como tema dominante; **persiste e é massivo** (~2.9k ocorrências). Não houve remediação.
- **`window.confirm`:** ConfirmDialog foi criado e adotado no CRM/contacts, mas **voice-hub, integrations e prospecting/outbound ainda usam nativo** — migração parcial.
- **Débito ARIA do VirtualTable:** explicitamente documentado como "débito rastreado, não corrigido" (`VirtualTable.tsx:91-95`) — permanece aberto há múltiplas ondas.
- **Contraste WCAG nos tokens:** **melhorou** — os `*-active` variants e correções medidas em `globals.css` são trabalho recente e eficaz.
- **`Modal`/`Dialog`/`Drawer`/`BottomSheet` coexistindo:** a convergência para Radix aconteceu (Dialog+Drawer), mas os primitivos legados não foram removidos.

---

## Síntese

O design system **central** (`/app`) é maduro: tokens com contraste medido, Radix Dialog/Drawer, Toaster acessível, formulários RHF+zod, navegação modular com ARIA correto. Os problemas concentram-se em **(a)** módulos periféricos que não adotaram os primitivos (voice-hub, prospecting/outbound, integrations — `alert()`/`window.confirm`/hex), **(b)** componentes normativos órfãos (`OperationalStateContainer`), **(c)** a11y de formulário (erros não anunciados) e bypass de blocos, e **(d)** dívida de tokenização fora da landing.

**Top 3 ações recomendadas:** (1) migração dos `alert()`/`window.confirm` restantes + convenção `aria-describedby`/`role="alert"` nos erros de form; (2) skip-link + boundary por rota; (3) campanha de adoção do `OperationalStateContainer` + remoção dos primitivos mortos (`Modal`, `BottomSheet`, `ModulePlaceholder`).
