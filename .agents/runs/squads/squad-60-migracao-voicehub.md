# Squad 60 — Inventário e Plano de Migração `/api/voice-hub/*` → endpoints canônicos

- **Autor:** Agente 60 — Aurora (coordenação; sem escrita em `src/**`)
- **Base:** `coord/squad-60` @ `93e82c220` (+ commit docs `4fe14b956`)
- **Autorização:** Orquestrador Humano §9 — "preparação da migração para endpoints canônicos do Voice Hub" (preparação apenas; execução por especialistas após deliberação de ownership)
- **Data:** 2026-11-24

---

## 1. Inventário exaustivo de call-sites legados `/api/voice-hub/*`

Grep exaustivo em `src/**`, `server.ts`, `tests/**`, `scripts/**`, `postman/**`, `docs/**` (exceto `.map`). Resultado completo — **não há outros call-sites**:

### 1.1 Call-sites de produção (5 endpoints, 3 arquivos)

| # | Arquivo:linha | Método + Path | Função | Response esperado pelo cliente |
|---|---|---|---|---|
| C1 | `src/features/voice-hub/store/workflowPersistence.ts:99` | `GET /api/voice-hub/workflow` | `loadWorkflowFromServer` — hidrata grafo do Studio (`signal`, `credentials:'include'`) | `{ workflow: { id, nodes, edges } \| null }` — valida `isWorkflowGraph` |
| C2 | `src/features/voice-hub/store/workflowPersistence.ts:153` | `POST /api/voice-hub/workflow` | `saveWorkflowToServer` — autosave; body = `workflowGraphSnapshot(nodes,edges)` (string JSON `{nodes,edges}` serializada) | `{ success:true, workflow:{ id:string, ...} }` — exige confirmação explícita |
| C3 | `src/features/voice-hub/store/studioServerActions.ts:179` | `POST /api/voice-hub/workflow/publish` | `publishWorkflowToServer` — publica fluxo (sem body) | 200 `{ workflow:{id} }` ou 422 `{ error, issues[] }` |
| C4 | `src/features/voice-hub/store/studioServerActions.ts:253` | `GET /api/voice-hub/workflow/:id/versions` | `fetchWorkflowVersions` — histórico de publicações | `{ versions: WorkflowVersionSummary[] }` |
| C5 | `src/features/voice-hub/store/studioServerActions.ts:296` | `POST /api/voice-hub/workflow/:id/versions/:version/rollback` | `rollbackWorkflowToVersion` | 200 `{ workflow:{id,nodes,edges} }` ou 422 `{error, issues}` |

### 1.2 Call-sites de teste (6 arquivos — serão atualizados na migração)

| Arquivo | Ocorrências |
|---|---|
| `src/features/voice-hub/components/studio/panels/VersionHistoryPanel.test.tsx` | linhas 44, 122, 131, 160, 167 |
| `src/features/voice-hub/store/studioServerActions.test.ts` | linhas 151, 208 |
| `src/features/voice-hub/store/useStudioStore.versionHistory.test.ts` | linhas 45, 108, 116 |
| `tests/unit/features/voice-hub-studio-persistence.test.ts` | linha 200 |
| `tests/unit/features/voice-hub-availability-gate.test.ts` | linhas 12–16 — **teste do próprio gate** (contrato fail-closed); deve ser reescrito/substituído quando o gate for levantado |

### 1.3 Menções não-call-site (somente documentação/comentários)

`src/bootstrap/routes.ts:211` (gate), `src/components/layout/AppLayout.tsx:465`, `src/components/layout/tabMeta.ts:255`, `src/features/characters/characterRuntime.ts:120`, `src/features/voice-hub/api/voiceHub.api.ts:155` (comentário), `src/features/voice-hub/pages/Results.tsx:120` (comentário).

---

## 2. Lado servidor: o que existe hoje

### 2.1 Router montado

`src/bootstrap/routes.ts:211`:
```ts
app.use('/api/voice-hub', authenticateToken, requireTenant, unavailableLegacyModule('voice-hub'));
```
→ 503 `MODULE_NOT_READY` intencional para **todo** o prefixo. Não existe router real montado.

### 2.2 Router legado COMPLETO mas NÃO montado

`src/lib/voice-hub/routes/index.ts` agrega 24 routers (`workflow`, `callLog`, `session`, `telephony`, `voiceRuntime`, `voiceOutbound`, `agent`, `organization`, `user`, `ai`, `observability`, `auditLog`, `billing`, `notification`, `apiKey`, `webhookEndpoint`, `onboarding`, `brandColor`, `metrics`, `settings`, …). **Grep prova que `routes/index.ts` não é importado por `server.ts` nem `src/bootstrap/**`** — apenas referenciado em testes (`src/lib/voice-hub/__tests__/tenant-isolation.test.ts`). Ou seja: o backend voice-hub HTTP está 100% desmontado; "reabrir o gate" não restaura nada por si só.

### 2.3 O router de workflow já implementa TODOS os 5 endpoints chamados pelo frontend

`src/lib/voice-hub/routes/workflow.routes.ts`:

| Endpoint frontend precisa | Rota legada existente | Handler → Service |
|---|---|---|
| `GET /workflow` | `router.get('/workflow', requireTenant, getWorkflowHandler)` (l.25) | `getWorkflow` → `{workflow: w \|\| null}` |
| `POST /workflow` | l.26 | `saveWorkflow` → 400/`{success:true, workflow}` |
| `POST /workflow/publish` | l.35 | `publishWorkflow` → 422 `{error, issues}` / `{success:true, workflow}` |
| `GET /workflow/:id/versions` | l.36–40 (+ rate limit 30/60s) | `listWorkflowVersions` → `{versions}` |
| `POST /workflow/:id/versions/:v/rollback` | l.42–46 (+ rate limit) | `rollbackToVersion` → 422/`{success:true, workflow}` |

Extras no mesmo router (não chamados pelo frontend hoje): `PUT/DELETE /workflow`, `/workflow/history`, `/workflow/restore`, `/workflow/duplicate`, `/workflow/comments*`, `/workflow/lock|unlock`.

### 2.4 Camada de serviço já é canônica e tenant-scoped

- `src/lib/voice-hub/services/workflowService.ts` (publish/rollback passam por `ValidationEngine` **e** `validateRuntimeCompatibility` — gate real server-side, não cosmético).
- `src/lib/voice-hub/repositories/workflowRepository.ts` usa `prisma.workflow`/`prisma.workflowVersion` — **models canônicos** do schema (`prisma/schema.prisma:5292,5318`) com `organizationId` + `deletedAt`, sempre filtrados por tenant (`findWorkflowForTenant`, `findWorkflowByIdForTenant` — nunca confia em `:id` sozinho).
- `writeAuditLog` → fila BullMQ `auditLogs` → `AuditLog` canônico (`tenantId NOT NULL`); fail-safe com warning quando `organizationId` ausente.
- Comentários no código citam handoffs do Agente 01 (adaptação a modelos canônicos, RLS `20260925000000_voice_hub_rls`, requestContext tenantId fail-closed).

**Conclusão técnica:** a implementação backend dos 5 endpoints é **completa, testada (`workflowVersioning.test.ts`) e já adaptada ao modelo canônico**. O que falta é apenas (a) decisão de montá-la e (b) eventual reforço de authz.

---

## 3. Comparação de contratos — endpoint legado → equivalente canônico

Não existe equivalente em `/api/integrations/birth-voice/*` para **workflow** (birthVoice.routes.ts cobre cold-call, call/:leadId, suppressions, connections, calls — domínio telefonia, não Studio). O equivalente canônico do workflow **é o próprio router legado adaptado** — a "migração" é de **montagem/autorização**, não de reescrita de contrato.

| Call-site | Path legado (gated 503) | Contrato frontend | Implementação existente | Equivalente canônico proposto | Auth authn | Authz hoje | Authz canônico sugerido |
|---|---|---|---|---|---|---|---|
| C1 | `GET /api/voice-hub/workflow` | `{workflow\|null}` | `getWorkflowHandler` | montar `workflow.routes.ts` sob `/api/voice-hub` OU novo `voiceWorkflow.routes.ts` em `src/features/voice-hub/` | `authenticateToken` + `requireTenant` (ambos já compatíveis — ver §4) | qualquer membro do tenant | leitura: qualquer papel autenticado (como `GET /connections`) |
| C2 | `POST /api/voice-hub/workflow` | `{success,workflow:{id}}` | `saveWorkflowHandler` + `saveWorkflowSchema` (zod: name?/nodes?/edges?) | idem | idem | **sem role gate** — VISUALIZADOR pode salvar | mutação de conteúdo: `ADMIN/GESTOR` ou manter "qualquer membro" — **decisão humana** |
| C3 | `POST /api/voice-hub/workflow/publish` | `{workflow}`/422 issues | `publishWorkflowHandler` → ValidationEngine + runtime compat | idem | idem | **sem role gate** — qualquer membro publica fluxo ativo de telefonia | **recomendo `ADMIN/GESTOR`** (altera comportamento de ligações reais) |
| C4 | `GET /api/voice-hub/workflow/:id/versions` | `{versions[]}` | `listWorkflowVersionsHandler` + rate limit 30/60s | idem | idem | sem role gate (leitura) | leitura ok |
| C5 | `POST .../versions/:v/rollback` | `{workflow}`/422 | `rollbackWorkflowVersionHandler` | idem | idem | **sem role gate** — rollback republica conteúdo | **recomendo `ADMIN/GESTOR`** |

**Divergência de authz documentada (risco):** as rotas legacy de workflow usam apenas `requireTenant` — não há `requireRole`/`hasPermission`. O padrão canônico de mutações sensíveis (`birthVoice.routes.ts`) exige `requireRole(['ADMIN','GESTOR','CLOSER','SDR'])`. Publicar/rollback de workflow altera o que o runtime de telefonia executa em ligações reais → tratar como mutação administrativa. **Recomendação:** adicionar gate de papel nos 3 endpoints de mutação (C2/C3/C5) antes de montar — mudança de 1 linha por rota usando `requireRole` do voice-hub (mapeia voice-role) ou `hasPermission` se existir capability adequada.

---

## 4. Autenticação — verificação de compatibilidade

- **Canonical mount:** `authenticateToken` popula `req.user` (AuthUser canônico).
- **Legacy `requireTenant`** (`src/lib/voice-hub/middlewares/rbac.ts:43`) → `ensureVoiceHubSession` → `voiceHubSessionOf(req)` aceita `req.user` canônico como fallback e traduz role via `voiceRoleForCanonicalRole` (`roleRepository.ts:63`). Popula `req.voiceHubUser`/`req.organizationId` exigidos pelos controllers (`req.voiceHubUser!.id` no audit).
- **Fallback Better Auth / API key `bvhk_live_*`:** `attachAuthIfPresent` existe mas workflow.routes.ts **não o usa** — atrás de `authenticateToken` não é necessário (req.user já setado). API-key callers não autenticariam por cookie — aceitável: Studio é browser/session.
- **CSRF:** `csrfGuard` global (`src/bootstrap/security.ts:221`) cobre o prefixo automaticamente.
- **Rate limit:** `applyRateLimiters` global + `workflowVersionsRateLimiter` dedicado nas rotas de versões.
- **Tenancy/RLS:** repositories sempre filtram `organizationId`; `requestContext` populado por `authenticateToken` upstream; models `Workflow`/`WorkflowVersion` sob RLS tenant_isolation.
- **Conclusão:** montar `workflow.routes.ts` atrás de `authenticateToken` é **tecnicamente compatível** — sem adaptação de auth necessária. Único gap: authz por papel (acima).

---

## 5. Plano de migração controlada (proposta — NÃO aplicada)

### Fase 0 — Deliberações pendentes (bloqueiam execução)
- **D2-ownership:** quem é dono dos subdirs voice-hub sem dono + `src/lib/voice-hub/**` (ver `squad-60-decisoes-voicehub.md` §D2b). Sem isso, ninguém pode montar router em `src/bootstrap/routes.ts` (arquivo sem dono).
- **D1-authz:** aprovar role gate `ADMIN/GESTOR` em publish/rollback/save (recomendado) ou aceitar qualquer membro.
- **Ownership de `src/bootstrap/routes.ts` + `src/lib/voice-hub/routes|services|repositories`:** propor na matriz (sugestão abaixo §6).

### Fase 1 — Montagem mínima (1 commit, especialista designado — sugestão 64-Tito ou 65-Lena conforme ownership)
1. Em `src/bootstrap/routes.ts`, substituir `unavailableLegacyModule('voice-hub')` por mount real **apenas do router de workflow**:
   ```ts
   import workflowRoutes from '../lib/voice-hub/routes/workflow.routes.js';
   app.use('/api/voice-hub/workflow', authenticateToken, requireTenant, workflowRoutes);
   ```
   - Manter `unavailableLegacyModule` para os demais subpaths (`/api/voice-hub/call-logs`, etc.) se o prefixo completo for mantido — ou avaliar montar o router em path dedicado `/api/voice-hub/workflow` e deixar o resto gated.
   - Adicionar `requireRole` (voice-hub) ou gate canônico em `publish`/`rollback`/`POST /workflow` conforme D1-authz.
2. **Não tocar** nos outros 23 routers de `routes/index.ts` — permanecem desmontados (call-logs etc. têm equivalente canônico em birth-voice).

### Fase 2 — Verificação de contrato (testes)
- `tests/unit/features/voice-hub-availability-gate.test.ts` — **reescrever**: o gate deixa de ser fail-closed para `/workflow*`; manter assert de 503 apenas para paths não migrados (se prefixo parcial for mantido).
- Teste de integração novo (sugestão `tests/integration/voice-hub-workflow-routes.test.ts`): GET vazio → `{workflow:null}`; POST grafo → `workflow.id`; publish com grafo inválido → 422 `issues`; versions → `[]`; rollback cross-tenant → 404 (isolamento).
- Re-rodar: `voice-hub-studio-persistence.test.ts`, `studioServerActions.test.ts`, `useStudioStore.versionHistory.test.ts`, `VersionHistoryPanel.test.tsx` — **nenhuma mudança de URL esperada** se o path `/api/voice-hub/workflow*` for preservado (recomendado: zero mudança no frontend).
- Manual/E2E: Studio carrega grafo, salva, publica, lista versões, rollback — em porta 22600-22699.

### Fase 3 — Decisão sobre o restante do prefixo
- Após workflow estável: decidir se `/api/voice-hub/*` restante permanece 503 permanente (recomendado — call-logs já têm canônico) ou se outros routers legados serão migrados um a um (fora de escopo atual).

### Feature-flag
**Não necessária** se a Fase 1 for montada em path dedicado `/api/voice-hub/workflow` (os outros paths continuam 503) — o blast radius é só o Studio, que hoje já está quebrado (503). Alternativa sem flag é suficiente; se o orquestrador preferir flag, `VOICE_HUB_WORKFLOW_ENABLED` env é trivial mas adiciona config não solicitada (P2 — simplicidade).

### Ordem de integração
Schema: nenhum (models já existem). Contratos: nenhum (paths preservados). Backend mount: Fase 1. Frontend: zero diff esperado. QA: Fase 2. Gate: typecheck + lint + testes de escopo → SHA congelado → Silas via Astra.

---

## 6. Proposta de distribuição de ownership (para publicação pelo Astra — NÃO auto-publicada)

### 6a. Subdirs de `src/features/voice-hub/**` hoje sem dono

| Caminho | Conteúdo | Proposta |
|---|---|---|
| `api/` | `voiceHub.api.ts` (cliente canônico, vivo) | **60 — Aurora** (contratos do squad) ou 65-Lena (consome na UI) — sugiro **65** |
| `components/` (63 arq, exceto `design-system` e `ui/`) | Studio/Landing/LiveSupervisor/NotificationCenter | **65 — Lena** (UI/UX do voice-hub) |
| `pages/` (37 arq) | Studio/Dashboard/LandingInnovative | **65 — Lena** |
| `store/` (14 arq) | Zustand studio stores, server actions, persistence | **65 — Lena** (dono funcional do Studio) |
| `hooks/` (2) | hooks do studio | **65 — Lena** |
| `lib/` (2) + `lib/studio/` | tipos/helpers de grafo | **65 — Lena** |
| `services/` (5) | services de feature | **65 — Lena** |
| `infra/` (1) | infra de feature | **60 — Aurora** (coordenação técnica) |
| `index.ts` | barrel | já é do **60** |
| `ui/` | Visualizer | já é do **65** |
| `voip/`,`sip/` | dialer stub | já é do **61** |
| `recording/` | storage stub | já é do **62** |
| `transcription/` | whisper worker stub | já é do **63** |
| `commands/` | command.processor (B-07) | já é do **64** |
| `components/design-system/` | design-system interno do voice-hub | **65 — Lena** (interface com 33-Célia para tokens canônicos) |

**Resumo proposto:** 65-Lena absorve `api|components|pages|store|hooks|lib|services` (o Studio inteiro); 60 fica com `index.ts`+`infra/`; 61–64 mantêm seus subdirs. Exceção mútua 65×64 preservada.

### 6b. Gap maior: `src/lib/voice-hub/**` (162 arquivos / ~18.7k linhas) — SEM dono na matriz

Contém: routes (24), controllers, services (workflowService, telephonyService, webhook.worker, retentionScheduler, etc.), repositories, validators, middlewares, `__tests__`. Partes **vivas**: `webhook.worker.ts` (montado em `bootstrap/workers.ts:110`), `settingRepository.ts` (usado por `organization-modules` e `settings`), `sessionRepository`/`birthhub360CallResultRepository`/`tenantRepository` (teste RLS `tests/integration/voice-hub-rls.test.ts`).

**Proposta de distribuição:**
- `src/lib/voice-hub/routes|controllers|services|validators|middlewares` → **60 — Aurora** como coordenador do domínio voice-hub backend, com execução delegada: workflow* → 64-Tito ou novo slot; telephony* → 61-Nando; callLog*/notification* → 66-Kiko/68-Paco conforme fronteira.
- `src/lib/voice-hub/repositories|infrastructure|types|lib` → **60 — Aurora** (fundação compartilhada do squad).
- Alternativa mais conservadora: todo `src/lib/voice-hub/**` → **20 — Ciro** (backend) com squad-60 como requerente — mas isso afasta o domínio do squad que o possui funcionalmente. **Recomendo a primeira** (squad-60 detém o domínio voz fim-a-fim).

### 6c. `src/bootstrap/routes.ts` e `src/api/**`

Backlog herdado (estrutura-10 §7) — sem dono. **Proposta:** Squad 20 (22-Hugo executa, 21-Zara revisa contratos). Squad 60 abre handoff formal `60→20` para o mount de workflow (Fase 1) ou pede designação explícita de um executor do squad-60 para editar o arquivo (rota única, diff de ~3 linhas + import).

---

## 7. Riscos residuais

1. **`routes/index.ts` monta 24 routers** — se alguém montar o index inteiro, expondo billing/telephony/etc. sem auditoria, seria regressão grave. Fase 1 monta **somente** `workflow.routes.ts`.
2. **Workflow genérico vs. voice:** o model `Workflow` é genérico (não voice-specific); se outro domínio quiser workflows, o path `/api/voice-hub/workflow` pode ser questionado — alternativa `/api/workflows` canônica exigiria mudar 5 call-sites + testes (diff pequeno mas fora do path preservado). Recomendado manter path para zero-diff no frontend; registrar como débito de nomenclatura.
3. **`duplicateWorkflowHandler`** tem `// mock param` no código — não expor na Fase 1 se montar router inteiro (avaliar se workflow.routes.ts deve ser fatiado para conter apenas os 5 endpoints + PUT/DELETE; comments/lock/duplicate/history/restore ficam fora até auditoria).
4. **AuditLog via BullMQ/Redis:** em ambiente sem Redis, enqueue falha silenciosamente (degrada para warning) — aceitável, documentado.
