# 03 — Jornadas do Usuário: Estado Atual e Propostas
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Método:** análise estática dos caminhos de dados + inventário visual do Agente 14. Jornas marcadas "não executada" carecem de validação em browser.

## Perfis de usuário (inferidos dos guards)

| Papel | Acesso |
|---|---|
| ADMIN | tudo, incl. usage, team, module-access, setup, design-lab |
| GESTOR | mesa-tratamento, copiloto_ia, commercial_intelligence, forecast/metas/pipeline, failover/resilience |
| CLOSER/SDR | mesa-tratamento, copiloto_ia |
| MESA_TRATAMENTO | mesa-tratamento |
| COPILOTO_IA | copiloto_ia |
| COMMERCIAL_INTELLIGENCE | commercial_intelligence |
| VISUALIZADOR/outros autenticados | rotas sem guard — inclui items que a palette mostra mas RequireRole bloqueia (UX-003) |

## Jornadas críticas auditadas

### J1 — Pipeline CRM (kanban)
**Estado atual:** `/app/crm` → CrmBoard com colunas dinâmicas via API (`dynamicColumns`) + fallback `DEAL_COLUMNS` hardcoded; drag com optimistic update + rollback; spinner/EmptyState/retry; toasts em mutações. `formatStageLabel` mapeia nomes legados de pilotos → labels canônicos.
**Problemas:** fallback hardcoded viola "dados de funil via API" (residual UX-10→P2); sem título in-page (topbar "Pipeline CRM" cobre); `KanbanBoard.tsx:19` role=button morto (a11y P1).
**Estado futuro:** eliminar fallback ou torná-lo último recurso explícito com aviso; título de página consistente; kanban drag acessível por teclado.

### J2 — Criação manual de lead/oportunidade
**Estado atual:** **inexistente.** Leads nascem de prospecting/promote ou import Bitrix. Backend `LeadUseCases.createLead` existe (posse CLOSER/SDR, bloqueio de duplicado empresa+funil, round-robin por score — trilha C.2). Command Palette removeu a ação no-op "Nova oportunidade" (correção honesta).
**Problemas:** jornada primária de CRM ausente; capacidade do backend ociosa.
**Estado futuro:** `LeadForm`/`DealForm` modal a partir da palette/toolbar do board; decisão de produto pendente (DEC-UX-01).

### J3 — Configuração de pilar (settings/pillars/:pillar)
**Estado atual:** 8 rotas acessíveis só por palette/URL; `PillarSettingsPlaceholder` — só "Ferramentas & Regras" persiste via `/api/settings/pillars/:pillar`; demais abas com disclaimer honesto + "Em breve".
**Problemas:** funcionalidade essencialmente escondida (UX-005); 3/4 abas não salvam (UX-08 residual).
**Estado futuro:** entrada de nav por módulo; decidir implementar persistência real das outras abas ou reduzi-las (DEC-UX-02).

### J4 — Voz/Telefonia (voice-hub)
**Estado atual:** rota montada mas backend `legacyModuleGate` responde 503 MODULE_NOT_READY; comentário em AppLayout promete redirect que não cobre voice-hub; tabs ocultas da nav mas rota acessível por URL.
**Problemas:** UX-001 P1 — tela falhando visível.
**Estado futuro:** aplicar redirect prometido ou reabrir gate (decisão de produto com backend).

### J5 — Primeiro acesso / onboarding
**Estado atual:** OnboardingTour lazy gated por localStorage; `/setup` wizard ADMIN; WorkspaceHome com estados NO_JOB_ROLE/NO_WORKSPACE_DEFINITION honestos.
**Problemas:** tours/checklists prometidos em PlaybooksHub ("Roteiros & Checklists") — verificar completude ponta a ponta.
**Estado futuro:** checklist de ativação por papel (hipótese — validar valor).

### J6 — Busca/navegação global
**Estado atual:** Command Palette ⌘K com busca real em companies/contacts (debounced), grupos contextual/ações/navegar; trap de foco.
**Problemas:** ignora permissões; inclui settings_* legadas; não indexa ~10 rotas; sem favoritos/recentes; "Relatórios de IA" mal rotulado (UX-013).
**Estado futuro:** derivar de moduleRegistry único; filtrar por papel; recentes baseados em `ActiveRecordContext` (já existe!); renomear quick actions.

### J7 — Feedback de operações
**Estado atual:** padrão toast (`lib/toast`) em CrmBoard/MesaTratamento; Settings usa inline custom; VoiceHubView usa `alert()` nativo (:133); SignalsAndRisksHub engole erro (`catch {}` → parece vazio, UX-007).
**Estado futuro:** padronizar em toast + estado de erro distinguível de empty; proibir `alert()` e catch silencioso em features.

## Síntese por severidade de jornada

- **P1:** J2 (criação de lead ausente — gap de produto), J4 (voice-hub 503 exposto).
- **P2:** J1 residual (fallback hardcoded), J3 (settings escondidas), J6 (palette), J7 (feedback inconsistente).
- **Saudável:** guards RequireRole/RequireModuleAccess honestos; kanban com rollback; estados empty/error majoritariamente presentes; deep links preservados.
