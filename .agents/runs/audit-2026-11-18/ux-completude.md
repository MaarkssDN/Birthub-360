# Auditoria READ-ONLY — Agente 02 · Produto/UX completude funcional
**Data:** 2026-11-18 | **Base:** `main @ b54060ad1` + WIP moduleRegistry/moduleThemes ignorado. Método: leitura estática do caminho de dados; sem execução do app.

## Achados

### UX-01 — Não existe criação manual de lead/oportunidade na UI — P1, Alta
`src/lib/db.ts:127` (`leadsDB.create` existe), `useDatabase.ts:176-183` (`createLead` sem consumidor), `CrmBoard.tsx` sem handler de criação, `CommandPalette.tsx:307-312`. Palette "Nova oportunidade" navega com intent `open-create` que **CrmBoard nunca lê**. Leads só nascem de prospecting/promote ou import Bitrix.
Correção: LeadForm/DealForm + tratar intent; ou remover ação da palette.

### UX-02 — Botão "Abrir Roteiros & Checklists" sem onClick — P2, Alta
`PlaybooksHub.tsx:219-224`. Morto em produção (P03).

### UX-03 — Gamificação esconde erro de API como empty state — P2, Alta
`GamificationView.tsx:47-52,210-214`. catch só console.warn → "Nenhuma atividade comercial registrada" quando API falhou.

### UX-04 — War Room Arena: score é heurística local, não IA — P2, Média-Alta
`WarRoomArenaView.tsx:116,219`. Sem chamada api/fetch; SAMPLE_OBJECTIONS hardcoded; score /100 exibido como avaliação. Verificar copy renderizada (:503-624) — se sugere IA, é defeito.

### UX-05 — Código morto: auth components legadas + SPA outbound inteira + PromptStudio — P3, Alta
`WelcomeScreen/LoginScreen/NewLoginScreen/LandingLoginSplitScreen/OrbitalSystem` (só se referenciam; entrada real é Landing360); `prospecting/outbound/**` SPA completa não referenciada (backend 503); `PromptStudio.tsx` órfão (`tabMeta.ts:71`).

### UX-06 — SelfDrivingCrmService com InMemoryOptOutRepository — P3, Alta
`selfDrivingCrm.service.ts:20,403`. Só consumido por testes; se ligado, opt-outs LGPD não persistem.

### UX-07 — KPI "Volume em Pipeline" exibe R$ 0 quando backend retorna null — P3, Alta
`db.ts:202-203` documenta `pipelineValue: number|null` ("UI exibe '—'"), mas `SinglePageDashboard.tsx:82,174-181` faz `?? 0` → "R$ 0". Número fabricado visualmente.

### UX-08 — 3 de 4 abas de settings de pilar são placeholders não persistidos — P3, Alta
`PillarSettingsPlaceholder.tsx:69-70,386-403`. Só "Ferramentas & Regras" persiste; disclaimer honesto mas admin pode achar que configurou.

### UX-09 — Perfil somente leitura; sem edição de nome/senha/avatar — P3, Alta
`Settings.tsx:197-232`. Verificar se `auth-extra.routes.ts` expõe update — se sim, falta só UI.

### UX-10 — Funil "Negócio" com estágios hardcoded de pilotos de cliente — P2, Alta
`CrmBoard.tsx:62-89` DEAL_COLUMNS: 'Piloto VTECH', 'Piloto Birthub 360 Profile', 'Piloto Logística'. Contradiz ICP genérico; tenant novo herda estágios de outro cliente. Verificar se backend `CrmPipelineStage` já é dinâmico e UI é que está hardcoded.

### UX-11 — Deep link ?lead=<id> inválido fecha drawer silenciosamente — P3, Média
`LeadDetailDrawer.tsx:184-187` catch → toast genérico + onClose. Mensagem não distingue "não existe" de falha de rede.

## Saudável
- ~50 rotas resolvem; catch-all→/app; redirects legados honestos.
- Forms críticos (Company, Contact, Proposta, Cadência, Knowledge, PillarSettings) chamam API real com error handling.
- Feature gates reais em camadas (RequireRole + requireRole + ModuleAccessGrant + legacyModuleGate 503).
- Sem mocks de KPI em produção; contratos honestos ("Indisponível").
- Kanban drag com optimistic update + rollback; forms aguardam resposta.

## Top-5 journeys
1. Cadastrar oportunidade manualmente — inexistente (UX-01).
2. Kanban Negócio — colunas são nomes de pilotos de cliente (UX-10).
3. Gamificação — erro vira "sem atividade" (UX-03); War Room heurística (UX-04).
4. Settings de pilar — 3/4 abas não salvam (UX-08).
5. Playbooks→Roteiros — botão morto (UX-02).
