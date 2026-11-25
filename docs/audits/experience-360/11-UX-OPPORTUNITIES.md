# 11 — Oportunidades de Expansão da Experiência
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22
**Regra do prompt:** cada proposta exige problema, usuário, evidência, valor, complexidade, risco, dependências, custo e critérios de aceite. Hipóteses, não ordens.

## Já existente (não propor de novo)

Command Palette ⌘K com busca real · ModuleRail + ModuleNavPanel contextual · breadcrumbs · notificações com contagem real · ActiveRecordContext · OnboardingTour · AssistantsDock persistente · ModuleAgentWidget por pilar · SyncIndicator/OfflineBadge · gamificação com pontos/leaderboard · Next Best Action (C.1) · round-robin por score (C.2) · telemetria voice (C.3).

## Propostas priorizadas

### OPP-01 — Criação manual de lead/oportunidade na UI — P1 produto
- **Problema:** jornada primária de CRM ausente; `createLead` backend pronto e ocioso.
- **Usuário:** CLOSER/SDR/ADMIN.
- **Evidência:** `LeadUseCases.ts:66`, `LeadController.ts:62`; ausência de form na UI; palette removeu no-op.
- **Valor:** habilita operação CRM real sem depender de import/prospecting.
- **Complexidade:** M (form + modal + rota API já existe; tratar intent na palette).
- **Risco:** baixo-médio (contrato Zod já existe em createLead; testar posse/duplicidade).
- **Dependências:** Agente 04 (CrmBoard), 21 (contrato), 02 (palette/rotas).
- **Aceite:** criar lead pela UI persiste, aparece no kanban correto, round-robin atribui, erro de duplicado exibido.

### OPP-02 — Menu de conta no topbar (perfil/tema/sair) — P2
- **Problema:** avatar decorativo; logout inexistente em mobile (RSP-007, UX-009).
- **Valor:** acesso a perfil (agora editável pós-UX-09), tema, logout em todos os viewports.
- **Complexidade:** P. **Aceite:** menu acessível por teclado, logout visível em 390px.

### OPP-03 — Recentes/Favoritos na Command Palette — P2
- **Problema:** palette não tem memória; rotas reais não indexadas.
- **Base existente:** `ActiveRecordContext` + histórico de navegação pode alimentar "Recentes" sem backend.
- **Complexidade:** M. **Aceite:** ⌘K mostra últimos 5 destinos; favoritos persistem em localStorage.

### OPP-04 — Fonte única de navegabilidade — P2 arquitetura
- **Problema:** 3 fontes (moduleRegistry, tabMeta, ModuleAgentWidget.navGroupsByJourney).
- **Valor:** mudança de visibilidade em 1 lugar; palette passa a filtrar por papel de graça.
- **Complexidade:** M-G. **Risco:** médio (refactor de nav). **Dependência:** Agente 02.

### OPP-05 — Estados de erro distinguíveis de empty — P2
- **Problema:** `SignalsAndRisksHub` catch silencioso; `alert()` nativo; padrões mistos toast/inline.
- **Valor:** usuário nunca confunde "falhou" com "não há dados" — requisito LGPD/confiança.
- **Complexidade:** P-M por tela. **Aceite:** zero `catch {}` silencioso em features; zero `alert()`; contrato empty-vs-error documentado.

### OPP-06 — Resolver rotas órfãs — P1 higiene
- **Problema:** war-room/failover/resilience/elite-agent/pending-actions/characters com título errado e superfícies duplicadas.
- **Valor:** fim de confusão "Command Center" genérico; menos superfície de manutenção.
- **Complexidade:** P por rota (decisão + redirect). **Aceite:** cada rota órfã tem destino canônico ou TabType próprio.

### OPP-07 — Virtualização de tabelas — P3 performance percebida
- **Problema:** VirtualTable em só 3 arquivos; listas grandes em `.map`.
- **Valor:** scroll fluido em CRM/propostas/forecast com volume real.
- **Complexidade:** M por tela. Priorizar ForecastHub/JourneyTab/SwarmDashboard.

### OPP-08 — Densidade de dados configurável — P3
- **Problema:** telas densas fixas; profissionais de operação pedem densidade.
- **Base:** tokens de espaçamento inexistentes (DS-004) — pré-requisito.
- **Complexidade:** G. Adiar para pós-launch salvo demanda real.

### OPP-09 — Command palette → ações de escrita — P3
- **Problema:** palette só navega/busca; ações rápidas são navegação disfarçada.
- **Cuidado:** ações destrutivas/irreversíveis exigem confirmação; começar só com criação (lead/atividade/tarefa).
- **Complexidade:** M. Depende de OPP-01.

### OPP-10 — Onboarding guiado por papel — P3
- **Problema:** primeiro acesso depende de exploração; WorkspaceHome tem estados mas não tour por papel.
- **Valor:** ativação mais rápida para SDR/CLOSER/GESTOR.
- **Complexidade:** M-G. Validar com dados de uso antes.

## Rejeitadas nesta rodada (complexidade sem valor demonstrado)

- Dashboards totalmente configuráveis por drag-drop (custo alto, `DashboardBuilderModal` já existe parcialmente — evoluir incrementalmente).
- Editor visual de pipelines (regra atual: funil via API já resolve).
- Temas customizados por usuário além de light/dark (fora do DS oficial).
