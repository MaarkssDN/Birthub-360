# 02 — Rotas e Telas: Cobertura da Auditoria
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## 1. Classificação de cobertura

| Classe | Quantidade | Observação |
|---|---|---|
| Auditada no código | ~85 | Rotas identificadas em `src/App.tsx` + `src/components/layout/AppLayout.tsx` |
| Auditada visualmente (carga apenas) | 70 (`/app/*`, ADMIN) | Agente 14, 2026-11-19 — desktop/mobile × light/dark, sem interação |
| Com axe executado | 70 | 19 com violações crítico/sérias; 51 limpas |
| Bloqueada por papel | parcial | Apenas ADMIN executado; GESTOR/SDR/MESA/COPILOTO/COMMERCIAL_INTEL não varridos |
| Com snapshot visual baseline | 0 | `test:visual` não executado nesta operação |
| Interações auditadas | ~15 fluxos | análise estática de formulários/kanban/drawers |

## 2. Rotas públicas (sem autenticação)

| Rota | Componente | Status |
|---|---|---|
| `/` | redirect → `/app` ou landing conforme sessão | código |
| `/welcome`, `/landing-new` | Landing variants | **intocável** (decisão 03A/03G) |
| `/login` | Login | **intocável** |
| `/reset-password` | ResetPasswordScreen | código |
| `/privacy`, `/terms` | páginas legais | código |
| `/privacidade/dsr/verificar`, `/privacidade/dsr/acompanhamento` | DSR LGPD público | código |
| `/book/:slug` | PublicBookingPage (calendar) | código |
| `/select-brand`, `/hub` | redirects | código |
| `*` | redirect catch-all | código |
| `/social-selling`, `/setup`, `/design-lab/{command-language,components-v2,home-proposals}` | protegidas especiais (ADMIN) | código |

## 3. Rotas `/app/*` (~73 em AppLayout.tsx)

Agrupadas por módulo de feature (detalhe arquivo:linha em `src/components/layout/AppLayout.tsx`):

| Grupo | Rotas | Feature |
|---|---|---|
| Home | `/app`, `/app/home`, `/app/index`, `/app/workspace` | home, workspace |
| CRM core | `/app/crm`, `/app/crm360`, `/app/mesa-tratamento*`, `/app/signals-risks(+radar, deal-risks)` | crm, crm360, mesa-tratamento, signals-risks |
| Inteligência | `/app/intelligence(+elite-agent, pending-actions)`, `/app/pending-actions`, `/app/copiloto_ia*` | intelligence, copiloto-ia |
| Cadastro | `/app/companies`, `/app/contacts`, `/app/activities`, `/app/prospect`, `/app/prospect/inteligente` | companies, contacts, activities, prospecting |
| Voz | `/app/voice-hub/*` | voice-hub |
| Comercial | `/app/cadence`, `/app/playbooks`, `/app/jornadas`, `/app/processos`, `/app/roteiros`, `/app/chatbook`, `/app/roleplay`, `/app/gamification`, `/app/qualification_matrix`, `/app/objections_matrix`, `/app/topic_training` | sales-orchestration, cadence, gamification, roleplay |
| Integrações/BI | `/app/bitrix`, `/app/reports`, `/app/integrations`, `/app/knowledge`, `/app/analytics`, `/app/winloss`, `/app/war-room`, `/app/market-intelligence(+hub, accounts/:id, deck)` | integrations, knowledge, analytics, market-intelligence |
| Prospecção | `/app/propostas`, `/app/commercial_intelligence*`, `/app/daily-plan`, `/app/sdr-diagnostic`, `/app/public-leads` | proposals, commercial-intelligence |
| Operação | `/app/calendar`, `/app/notifications`, `/app/automations`, `/app/usage*`(ADMIN), `/app/editor`, `/app/team*`, `/app/module-access*`(ADMIN) | calendar, notifications, automations, document-editor, team, module-access |
| Config | `/app/settings`, `/app/settings/pillars(/:pillar)`, `/app/settings_{hub,market,sales,performance,predictability,ai,automation,engagement}` | settings |
| Outros | `/app/characters`, `/app/failover*`, `/app/resilience*`, `/app/forecast*`, `/app/metas*`, `/app/pipeline_ponderado*` | characters, predictability |
| Redirects | `/app/dialer/*`, `/app/outbound/*` | aliases legados honestos |

## 4. Cobertura por tela — estados verificados no código

Verificação transversal executada pelo Agente 14 (carga) + análise estática desta operação:

- **Loading/skeleton:** presente na maioria das listagens via hooks de query; nem todas as telas têm skeleton dedicado (ver achado UX-STATE-01 no backlog).
- **Empty states:** `EmptyState` compartilhado existe (`src/components/feedback/EmptyState.tsx`); cobertura desigual entre módulos — gamificação já corrigida (UX-03), settings de pilar honesto.
- **Error states:** padrão dominante = toast + mensagem inline; inconsistências residuais catalogadas em `06-COMPONENT-AUDIT.md` e `12-PRIORITIZED-BACKLOG.md`.
- **Deep links:** `?lead=<id>` tratado com contexto preservado (UX-11 corrigido, `LeadDetailDrawer.tsx:199`).

## 5. Telas com problemas confirmados nesta operação

| Tela | Problema | Severidade | Evidência |
|---|---|---|---|
| `/app/characters` | H1 `var(--warn)` #FFC107 sobre superfície clara ≈1,52:1 (axe); página força paleta dark (`white/5`, `text-white`) mesmo no tema claro — inconsistência de tema; HTTP 500 observado no inventário do 14 (verificar se persistia na base) | P1 a11y / P2 UI | `CharacterGalleryView.tsx:204-211`, `globals.css:273,350-355` |
| `/app/crm` (kanban Negócio) | `DEAL_COLUMNS` fallback hardcoded com nomes de pilotos de cliente ("Piloto VTECH", "Piloto Logística") — mitigado por `dynamicColumns` via API + `STAGE_DISPLAY_LABELS`, mas fallback ainda viola a regra "dados de funil vêm de API" | P2 residual | `CrmBoard.tsx:64-98,127,170` |
| Settings de pilares | 3 de 4 abas placeholder (permissoes/automacoes/integracoes) — agora com disclaimer honesto e "Em breve"; apenas "Ferramentas & Regras" persiste | P3 residual | `PillarSettingsPlaceholder.tsx:68-70,270,399` |
| Criação manual de lead | Inexistente na UI; ação "Nova oportunidade" removida da Command Palette por ser no-op; backend `createLead` existe e não é exposto | P2 produto | `CommandPalette.tsx:324-325`, `LeadUseCases.ts:66` |
| `/app/editor` | 429 no inventário do 14 — classificado como artefato de carga; revalidar | P3 | relatório 14 |

## 6. Pendências de cobertura

- Varredura visual com papéis não-ADMIN (GESTOR, SDR, MESA_TRATAMENTO, COPILOTO_IA, COMMERCIAL_INTELLIGENCE).
- `test:visual` com baselines Playwright — nunca executado nesta operação.
- Interações: formulários submetidos, kanban drag, drawers, modais — apenas análise estática.
- Rotas `/design-lab/*` (protegidas ADMIN) — fora do escopo de produção.
