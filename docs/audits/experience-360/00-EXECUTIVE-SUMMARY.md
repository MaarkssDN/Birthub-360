# 00 — Resumo Executivo: Operação Birthub Experience 360
**Data:** 2026-11-22 · **Base auditada:** `origin/main @ 0d790443d` (worktree `Birthub-360-audit-main`)
**Método:** reconciliação da Fase Zero anterior (2026-11-19) + 4 auditorias especializadas paralelas (rotas/IA, design system/CSS, componentes, performance/a11y/responsividade) + verificação direta dos achados anteriores. Sem execução de app nesta sessão — evidência é código + inventário visual do Agente 14.

## A. Estado real da plataforma

**Veredito:** plataforma SaaS substancial e em melhor estado do que o histórico de dívidas sugere. A navegação foi modernizada (ModuleRail + painel contextual + Command Palette ⌘K), o design system existe e é majoritariamente seguido, code splitting é agressivo e correto, e a infraestrutura de testes (unit/integration/e2e/visual/axe/k6/budgets) é incomumente madura.

**Pontos fortes:**
- 59 rotas lazy + manualChunks afinado; libs pesadas (three, echarts, pdf, excel, tiptap) isoladas.
- Guards RequireRole/RequireModuleAccess com telas honestas; kanban com rollback; deep links preservados.
- Tokens neon DL v2.0 fiéis em cores e motion; fontes self-hosted; temas light/dark funcionais.
- Testes: 7.366 unit verdes; axe ~40 rotas; visual regression com ~150 baselines; budgets em CI.
- Correções recentes verificadas: UX-02/03/07/09/11 resolvidos; perfil editável; auth morta removida.

**Problemas críticos (P1):**
1. `/app/voice-hub` expõe UI contra backend 503 — redirect prometido não aplicado (`AppLayout.tsx:465-478`).
2. Rotas órfãs/duplicadas (~7 superfícies) exibem título genérico errado e duplicam features já embutidas.
3. `/app/characters` falha contraste (1,52:1) e força paleta dark no tema claro.
4. `KanbanBoard.tsx:19` — elemento `role="button"` focável sem ação (a11y).
5. `useFetch` central sem cancelamento/race-guard + 5 providers sem memo — débito de render em todo o app.
6. Criação manual de lead inexistente na UI com backend pronto — gap de produto P1.

**Principais inconsistências:**
- 4 padrões de título de página; 3 fontes de verdade de navegabilidade; 3 mecanismos de tema CSS; 2 camadas de tokens sem precedência documentada; DL v2.0 desatualizado vs implementação (fontes, radius, tons).
- 797 `!important` (772 na landing intocável); ~3.889 classes arbitrárias; ~85-90 tsx de produto com hex literal; legado Vancouver/coolors no DS global.
- Command Palette ignora permissões e não indexa ~10 rotas reais.

**Barreiras de lançamento:** nenhuma P0. P1s são corrigíveis em ondas curtas. Risco maior é **processo**: muitas decisões de produto/DS pendentes de humano (DL revisão, criação de lead, voice-hub, settings pilar, characters).

## B. Descobertas concretas (amostra — detalhe nos docs 01-15)

| Área | Top achados |
|---|---|
| Navegação | voice-hub 503 exposto; 7 rotas órfãs; palette sem filtro de papel; settings/pillars escondidas; logout ausente no mobile |
| Design System | tokens empilhados 2×; DL divergente (fontes/radius/light-pink); sem tokens de spacing/breakpoints; `.bh-card` 2×; policing de títulos frágil |
| CSS | 530 `!important` na landing; index.css/luxury-tokens órfãos; hub-orbit usa prefers-color-scheme (ignora app); z-index sem escala; #00E5FF não-token |
| Componentes | 23 modais custom (focus trap amostral); TableRow voice-hub role=button sempre; `alert()` ×7; 4 padrões de título; showcases em ui/ |
| A11y | axe critical/serious em 19/70 rotas; KanbanBoard role morto; TableRow bug; backlog de labels admitido; contraste residual pink/gold p/ texto pequeno |
| Responsivo | 0 overflow a 390px (medido); modais voice-hub w-[450-560px] sem max-w; mobile-sweep cobre 37/~57 módulos; logout mobile ausente |
| Performance | useFetch sem cancel; precache SW de todos chunks (~1.78MB); providers sem memo; VirtualTable em 3 arquivos; Landing360 monolítica |

## C. Redesenho recomendado (síntese)

Não há necessidade de reescrita. A evolução correta é **incremental e governada**:

1. **Concluir higiene de navegação** (Onda 2): uma fonte de verdade, rotas órfãs resolvidas, palette que respeita permissões, conta acessível no mobile.
2. **Fechar débito de fundação** (Onda 3): revisar DL, documentar precedência de tokens, codificar spacing/breakpoints/z-index, unificar tema e motion — tudo em produto, sem tocar landing.
3. **Resolver gaps de jornada** (Onda 4): criação de lead, settings pilar, erro≠empty transversal.
4. **Expansão só após base estável** (Ondas 5-6): recentes/favoritos, virtualização, ações de escrita.

## D. Plano de transformação

- **Imediatas (Onda 1):** 8 correções P1 cirúrgicas de baixo risco — ver `13-IMPLEMENTATION-ROADMAP.md`.
- **Estruturais (Onda 2-3):** navegação única + tokens/CSS de produto.
- **Por módulo (Onda 5):** crm → cadence → voice-hub → intelligence → market-intelligence → settings.
- **Pós-lançamento:** densidade configurável, dashboards customizáveis, onboarding por papel.

## E. Backlog executável

`12-PRIORITIZED-BACKLOG.md` — ~60 itens com ID, evidência, dono (Agente), onda e status. Itens que exigem decisão humana listados na seção final.

## F. Riscos

- **Regressão visual:** qualquer mudança de token afeta 70+ rotas → `test:visual` baseline obrigatório antes da Onda 3.
- **Conflito de ownership:** `ui/`+`styles/`→03, `layout/`→02 — esta operação não implementa; gera handoffs.
- **DL desatualizado:** implementar tokens conforme DL atual sem revisão humana criaria divergência documentada.
- **Hub-orbit prefers-color-scheme:** correção pode mudar visual do hub em cenários SO/app divergentes — validar com usuário.

## G. Critérios de lançamento

**Antes de disponibilizar:**
- P1s da Onda 1 zerados (voice-hub redirect, rotas órfãs, characters contraste, KanbanBoard, useFetch, providers).
- axe critical/serious = 0 nas rotas de lançamento (hoje 19/70 com violações).
- `test:visual` baseline + regressão zero.
- Criação de lead OU decisão explícita de adiamento.

**Pode ficar para fases posteriores:**
- Legado Vancouver/coolors (landing-adjacente), densidade configurável, virtualização completa, onboarding por papel, SEO/landing (fora de escopo).

## Limitações desta auditoria (honestidade exigida)

- Sem execução de app: estados verificados por código + inventário do 14 (carga/axe, não interação).
- Sem Lighthouse/RUM: CWV não medido.
- Sem screen reader: a11y é estática + axe.
- Auditoria de componentes por subagente pode ter cobertura parcial em 545 tsx — achados são evidência, não exaustão.
- `test:visual` nunca executado — não há baseline comparável ainda.
