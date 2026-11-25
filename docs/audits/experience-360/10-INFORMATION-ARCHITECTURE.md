# 10 — Arquitetura de Informação e Navegação
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## 1. Estrutura atual (verificada — melhor que o esperado)

A navegação **não é mais uma sidebar de ~30 itens**. Arquitetura em 3 camadas:

- **`ModuleRail`** (`ModuleRail.tsx`): rail fixo 68px, ícones dos **11 módulos oficiais** (P01–P08, M09–M11) filtrados por permissão via `getRailModules` (`moduleRegistry.ts:396-402`). M10 mobile-only; M11 external.
- **`ModuleNavPanel`** (`ModuleNavPanel.tsx`): painel contextual 248px do módulo ativo, itens com `section`, active por prefixo mais longo; recolhimento persistido em localStorage.
- **`tabMeta.ts` + `moduleRegistry.ts`**: registro canônico de tabs/módulos com labels, ícones, accents, guards.
- **`AppBreadcrumbs`**: trilha auto-derivada + overrides dedicados (`settingsPillarNav.ts`).
- **Topbar** (`AppTopbar.tsx`): voltar, título via `TAB_META`, breadcrumbs sm+, busca→Command Palette, SyncIndicator/OfflineBadge, relógio, tema, som, notificações com contagem real, avatar, logout.
- **Command Palette** (`ui/CommandPalette.tsx`): ⌘K global, trap de foco, grupos contextual/ações/navegar/empresas/decisores com busca real debounced.
- **Camadas flutuantes**: AssistantsDock (Chatbook+Copiloto persistentes), ModuleAgentWidget (personagem IA por pilar, SSE), VoiceCommandWidget, LiveCopilotHUD, OnboardingTour.

## 2. Respostas às perguntas do prompt mestre

| Pergunta | Resposta |
|---|---|
| O usuário sabe onde está? | **Parcialmente.** Rail+painel contextual é bom; mas rotas órfãs caem em "Command Center" genérico (UX-002) e breadcrumb diverge do título em market-intelligence (UX-011). |
| Sabe o que pode fazer? | **Parcialmente.** RequireRole tem tela de bloqueio honesta; mas Command Palette **não filtra por papel** — VISUALIZADOR vê itens restritos e cai em "Acesso restrito" (UX-003). |
| Sabe como voltar? | Sim — botão voltar + breadcrumbs + catch-all. Exceção: `/app/home` mostra voltar desnecessário (UX-012). |
| Encontra rapidamente? | **Parcialmente.** Palette é forte, mas: não indexa ~10 rotas reais (war-room, failover, market-intelligence/accounts/:id, prospect/inteligente, pending-actions), inclui 8 `settings_*` legadas redundantes, sem favoritos/recentes. |
| Agrupamento lógico? | Sim — 11 módulos com seções. Mas "Pesquisa LDR"/"Hub de Inteligência"/"Pesquisa de Mercado"/"Inteligência de Mercado" = 3-4 nomes para a mesma área (UX-004). |
| Módulos fragmentados? | Sim: intelligence tem rotas órfãs duplicadas (elite-agent, pending-actions ×2); failover/resilience = mesmo componente 3×; war-room embutido em gamification + rota standalone. |
| Funcionalidades escondidas? | Sim: settings/pillars (8 rotas) sem entrada de nav — só palette/URL (UX-005); characters órfã deliberada. |
| Caminhos redundantes? | Sim: `/app` vs `/app/home` mesmo componente com active-state quebrado (UX-006); `reports`/`analytics`/`intelligence`/`sdr-diagnostic` sobreposição conceitual de "análise/IA" (UX-013). |
| Nomes de menus claros? | Majoritariamente; exceções UX-004 e UX-013. |
| Cresce sem confundir? | **Risco.** Três fontes de verdade para navegabilidade (`moduleRegistry`, `tabMeta`, `ModuleAgentWidget.navGroupsByJourney` hardcoded) — mudança de visibilidade exige editar 3 lugares (UX-010). |

## 3. Achados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| UX-001 | P1 | `/app/voice-hub/*` monta UI contra backend 503 — comentário em AppLayout promete redirect que não foi aplicado a voice-hub (só outbound/dialer redirecionam); deep-link/bookmark mostra tela falhando | AppLayout.tsx:465-478 vs 477 |
| UX-002 | P1 | Rotas órfãs/duplicadas caem no fallback `TAB_META.dashboard` → topbar "Command Center": war-room (já aba de gamification), failover+resilience (mesmo painel 3×), intelligence/elite-agent (já aba de IntelligenceHub), pending-actions ×2, characters | AppLayout.tsx:448-450,500,554-569,646; GAMIFICATION:142; IntelligenceHub.tsx:43,795; Settings.tsx:681 |
| UX-003 | P2 | Command Palette ignora permissões (sem check de papel) e inclui 8 settings_* legadas; não indexa ~10 rotas reais | CommandPalette.tsx:57-129,446-455 |
| UX-004 | P2 | 3-4 nomes para market-intelligence ("Pesquisa LDR", "Hub de Inteligência", "Pesquisa de Mercado", "Inteligência de Mercado") | moduleRegistry.ts:167,170; tabMeta.ts:178; AppBreadcrumbs.tsx:63 |
| UX-005 | P2 | Settings/pillars sem entrada de navegação — funcionalidade escondida | AppLayout.tsx:606-642; moduleRegistry sem itens |
| UX-006 | P2 | Home sem empty state no filtro + item ativo ambíguo em `/app` vs `/app/home` | CentralModulesHomeViews.tsx:55,168; moduleRegistry.ts:119 |
| UX-007 | P2 | SignalsAndRisksHub: `catch {}` silencioso — erro indistinguível de vazio | SignalsAndRisksHub.tsx:66-67 |
| UX-008 | P3 | Títulos duplicados (h1 in-page + topbar) em Integrations/CopilotoIa/Gamification; `alert()` nativo em VoiceHubView:133 | refs |
| UX-009 | P3 | Avatar topbar decorativo sem menu; **logout inexistente em mobile** | AppTopbar.tsx:239-252 |
| UX-010 | P3 | Três fontes de verdade para navegabilidade (moduleRegistry, tabMeta, ModuleAgentWidget) | refs |
| UX-011 | P3 | Breadcrumb diverge do título do topbar | AppBreadcrumbs.tsx:58-63; AppTopbar.tsx |
| UX-012 | P3 | `isHome` do topbar cobre 2 de 3 homes | AppTopbar.tsx:31 |
| UX-013 | P3 | Quick action "Relatórios de IA" aponta para "Relatórios Avançados"; sobreposição reports/analytics/intelligence/sdr-diagnostic | CommandPalette.tsx:276-281 |

## 4. Arquitetura de informação alvo (proposta — Onda 3)

1. **Fonte única de navegabilidade:** derivar palette, rail e widget de `moduleRegistry` (eliminar `navGroupsByJourney` hardcoded e `TAB_META` duplicado para guards).
2. **Resolver rotas órfãs:** decidir por cada uma — redirect para a superfície canônica (war-room→gamification, elite-agent→intelligence, pending-actions→intelligence/pending-actions, failover/resilience→settings ou remover) ou registrar TabType próprio.
3. **Voice-hub:** aplicar o redirect prometido ou reabrir o gate — decisão de produto (backend 503).
4. **Unificar nomes** de market-intelligence em um termo canônico.
5. **Palette:** filtrar por `itemVisible`/papel; remover settings_* legadas; indexar rotas reais.
6. **Conta no mobile:** avatar → menu (perfil/tema/sair) ou item no drawer.
