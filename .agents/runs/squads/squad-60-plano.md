# Plano do Squad 60 — Voz, Telefonia e Mensageria Omnichannel

- **Coordenador:** Agente 60 — Aurora
- **Demanda:** DEM-20261123-001 (arquitetura 10 squads / 10 coordenadores)
- **Runtime:** Devin (subagente)
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-60/wt-coord`
- **Branch:** `coord/squad-60`
- **SHA base:** `93e82c22024ccc9ca48abad6b29e855cbd4157f9` (corte da topologia oficial)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`
- **Lease:** `.agents/runs/leases/squad-60.lease` (expira em 4h sem heartbeat)
- **Faixa de portas do squad:** 22600–22699 (estrutura-10 §4)
- **Data:** 2026-11-24

## 1. Estado verificado

| Item | Evidência |
|---|---|
| Worktree + branch criados | `git worktree add ... -b coord/squad-60 93e82c220`; `HEAD = 93e82c220`, branch `coord/squad-60` |
| Registro global | `.agents/runs/REGISTRO_GLOBAL_100_AGENTES_20261124.md` §Squad 60: agentes 60–69 todos PREPARADO exceto 65 (ATIVO, delivery em `dem-20261123-onda3/wt-65-voice-hub`, HEAD `b8a39713e`) |
| Ownership | `.agents/MATRIZ_PROPROPRIEDADE.md` §Squad 60: 60→`voice-hub/index.ts`; 61→voip/sip; 62→recording; 63→transcription; 64→commands; 65→ui; 66→notifications/inbox; 67→templates; 68→realtime; 69→opt-out |
| Exclusão mútua | estrutura-10 §4 regra 7: 65 (`ui/**`) × 64 (`commands/**`) nunca editam cruzado |
| Entrega 65 | 5 commits em `agente/65-voice-hub-onda3` (`b8a39713e`): endpoint canônico `birth-voice/calls` (fim do 503 legado em Results), ações mortas na landing, a11y (scope=col, rótulos), toast global |

## 2. Decisões Pendentes — Documento de Decisão para o Orquestrador Humano

> **Documento canônico atualizado (v2, 2026-11-24):** `.agents/runs/squads/squad-60-decisoes-voicehub.md` — D1–D3 com texto técnico completo e evidências; preparação técnica da migração autorizada pelo Orquestrador §9 em `.agents/runs/squads/squad-60-migracao-voicehub.md`. O esboço original segue abaixo para histórico.

> **NÃO EXECUTAR sem aprovação humana.** Consolidado pela coordenação do squad; evidências verificadas na base `93e82c220`.

### D1 — Reabertura do `legacyModuleGate` para `/api/voice-hub/*` (`src/bootstrap/routes.ts:211`)

**Contexto:** `app.use('/api/voice-hub', authenticateToken, requireTenant, unavailableLegacyModule('voice-hub'))` retorna 503 `MODULE_NOT_READY` intencional. O comentário em `routes.ts:209-210` exige que routers legados "nunca executem contra o banco compartilhado antes de adapters verificados".

**Evidência nova (esta coordenação):**
- `src/features/voice-hub/api/voiceHub.api.ts` (199 linhas) **não chama mais** `/api/voice-hub/*` — usa exclusivamente `/api/integrations/birth-voice/*` e `/api/integrations/3cx/*` (canônico, tenant-scoped).
- **Porém** código vivo ainda depende do prefixo gated:
  - `src/features/voice-hub/store/studioServerActions.ts:179,253,296` → `POST /api/voice-hub/workflow/publish`, `GET .../versions`, `POST .../rollback`
  - `src/features/voice-hub/store/workflowPersistence.ts:99,153` → `GET/POST /api/voice-hub/workflow`
  - `src/features/voice-hub/components/studio/panels/VersionHistoryPanel.test.tsx` → idem
- Ou seja: reabrir o gate sem antes migrar essas chamadas = rotas legacy executando contra banco compartilhado sem adapter verificado (viola a regra do próprio `routes.ts`).

**Opções para decisão humana:**
- **(a) Recomendada — migração primeiro:** criar endpoints canônicos `/api/voice-hub/workflow*` equivalentes (ou mover para `/api/integrations/birth-voice/workflow*`) com schema Zod + tenancy verificada, migrar os 3 call-sites acima, e só então remover `unavailableLegacyModule('voice-hub')`. Ownership de `src/bootstrap/routes.ts` e `src/api/**` é **inexistente na matriz** → exige designação (sugestão: handoff formal ao Squad 20 / Agente 22 Hugo, com revisão de 21 Zara para contratos).
- **(b) Feature-flag por sub-rota:** manter gate e liberar apenas `/api/voice-hub/workflow` após auditoria do service correspondente — exige mapear qual service atende essas rotas hoje (hoje não há router montado; seria implementação nova, não reabertura).
- **(c) Manter fail-closed:** aceitar 503 permanente no Studio e remover as chamadas mortas junto com D2.

**Impacto:** decide se o Voice Hub Studio (gravação/edição/workflows) fica funcional ou é formalmente descontinuado.

### D2 — Destino do "~80% dead code" em `src/features/voice-hub/**`

**Inventário na base `93e82c220`:** ~130 arquivos fonte / ~29.000 linhas.

| Subdir | Arquivos | Situação |
|---|---:|---|
| `components/` | 63 | UI legada do Studio/Landing — parcialmente viva via `App.tsx` lazy import de `pages/LandingInnovative` |
| `pages/` | 37 | páginas do Studio/Dashboard — parcialmente alcançáveis |
| `store/` | 14 | Zustand stores; `studioServerActions`/`workflowPersistence` chamam `/api/voice-hub/*` gated (ver D1) |
| `services/` | 5 | inclui `__tests__`; `callRecord.sentiment.unit.test.ts` |
| `hooks/`, `lib/`, `api/` | 2+2+1 | `api/voiceHub.api.ts` é o cliente canônico (vivo) |
| `ui/` | 1 | `Visualizer.tsx` (65/Lena) |
| `voip/`, `sip/` | 1 (`dialer.ts`) | stub para 61/Nando |
| `recording/` | 1 (`storage.ts`) | stub para 62/Sol |
| `transcription/` | 1 (`whisper.worker.ts`) | stub para 63/Lira |
| `commands/` | 1 (`command.processor.ts`) | contrato B-07 implementado + teste unitário existente (`tests/unit/features/voice-hub/commandProcessor.test.ts`) — **não referenciado por nenhum call-site de produção** (grep: só o próprio arquivo e o teste) |
| `infra/` | 1 | — |

**Opções para decisão humana:**
- **(a) Recomendada — reconciliação de ownership antes de poda:** a MATRIZ atribui subdirs a 61–65, mas `components/`, `pages/`, `store/`, `services/`, `hooks/`, `lib/`, `infra/`, `api/` **não têm dono** na matriz (só `index.ts` é do 60 e `ui/**` do 65). Sem essa reconciliação, nenhum agente pode legalmente podar ou evoluir ~70% da árvore. Proposta: designar `components|pages|store|services|hooks|lib|infra|api/**` ao Squad 60 (sugestão: 60 coordena, 65 continua em `ui/**` + landing) ou marcar como legado congelado.
- **(b) Poda cirúrgica pós-D1:** após D1 decidida, remover somente arquivos comprovadamente inalcançáveis (análise de imports + knip), em fatias por subdir, cada uma com teste de não-regressão.
- **(c) Status quo congelado:** declarar todo o restante "legacy read-only" até decisão de produto sobre o Studio.

### D3 — Drift de governança local: `src/features/voice-hub/AGENTS.md`

O arquivo local declara "Dono: **Agente 12 — Voz e Telefonia**" e cita handoffs com "Agente 02/03/07/16" — numeração do roster **legado**, incompatível com a matriz atual (12 = Vera/Pietro? não — 12 é Vera de Migrações; o dono real hoje é o Squad 60). Viola AGENTS.md global §5 (prompts/registros desatualizados). **Proposta:** atualizar o cabeçalho para apontar a MATRIZ_PROPRIEDADE vigente ou arquivar o arquivo — **edição pendente de autorização** (arquivo dentro de `voice-hub/**`, owner ambíguo conforme D2-a).

## 3. Backlog priorizado do squad (após decisões)

| # | Agente | Missão | Prioridade | Dependência |
|---|---|---|---|---|
| 1 | 64 Tito | B-07: conectar `command.processor.ts` a um fluxo real OU documentar que é contrato-futuro; garantir que nenhum caminho confirme comando sem commit (hoje: sem call-site → risco é código morto, não falso positivo) | **Alta** | D2 (ownership de `commands/**` já é do Tito) |
| 2 | 67 Teca | Sanitização PII em templates (`notifications/templates/sanitizer.ts`, 87 linhas — stub inicial); alinhar com 07-Íris | **Alta** (PII) | Handoff formal 67→07 |
| 3 | 69 Eli | Opt-out/STOP (`notifications/opt-out/optout.service.ts`, 148 linhas); cross-check com 08-Dora (revogação) | Alta | Handoff 69→08 |
| 4 | 66 Kico | Inbox unificado (`notifications/inbox/router.ts`, 26 linhas — stub); overlap WhatsApp com Squad 50 (56-Luna) | Média | Handoff 60→50 |
| 5 | 68 Paco | Realtime WS/SSE (`notifications/realtime/websocket.server.ts` 78 linhas + `sse.service.ts`); interface 84-Pia | Média | Handoff 60→80 |
| 6 | 62 Sol | Gravação/storage de áudio (`recording/storage.ts`, 100 linhas); LGPD retenção → 07-Íris + 98-Safira | Média | Handoff 62→07/98 |
| 7 | 63 Lira | STT/diarização (`transcription/whisper.worker.ts`, 109 linhas); interface 62/75 | Média | após 62 |
| 8 | 61 Nando | VoIP/SIP/WebRTC (`voip/dialer.ts`, 71 linhas); Hotspot #9 `workflowRuntimeService.ts` ~1480 linhas vence 30/11 | Média | após D1/D2 |

## 4. Handoffs cross-squad a emitir (formais, em `.agents/handoffs/squad-60/`)

- **60 → 00/Astra + Orquestrador Humano:** documento de decisões D1–D3 (este arquivo, seção 2).
- **60 → 20 (Ciro/Hugo/Zara):** ownership de `src/bootstrap/routes.ts` + `src/api/**` inexistente; necessário para qualquer reabertura/migração de `/api/voice-hub/workflow*`.
- **60 → 50 (Atlas/Luna):** fronteira inbox unificado (66-Kiko) vs conectores WhatsApp (56-Luna) — quem é dono do roteamento multicanal.
- **60 → 07 (Íris) + 08 (Dora):** PII em áudio/transcrição (62/63) e revogação de consentimento (69).
- **60 → 90 (Safira 98):** storage de áudio — segredos/credenciais de storage.
- **60 → 80 (Pia 84):** push/deep links para notificações realtime (68).

## 5. Restrições operacionais registradas

- Sem push, sem PR, sem merge em `main`/`integracao/*`; merge apenas em `integracao/squad-60` quando criada pelo fluxo oficial.
- Não tocar `integracao/onda-3-dem20261123` nem worktrees `dem-20261123-*` (exceto leitura de evidências já feita).
- SHA congelado → Agente 09 (Silas) via Astra; parecer divergente no mesmo SHA = REPROVADO por padrão (estrutura-10 §6.2).
- Máx. 3 executores concorrentes (`agente/<id>-<slug>-s60`, `wt-<id>` em `squads/squad-60/`); capacidade real via `scripts/orchestration/capacity-scheduler.ts`.
- `run_subagent` indisponível neste runtime → executores serão despachados sequencialmente ou por novas sessões; coordenação segue prioritária.
- Portas efêmeras do squad: 22600–22699.

## 6. Primeira missão real executada (evidência)

**Missão:** reconhecimento de base para as decisões D1–D2 (read-only, sem alteração de código).

**Comandos/evidências:**
- `git worktree list`, `git show 93e82c220:...REGISTRO_GLOBAL...` — baseline do squad confirmado.
- `find src/features/voice-hub -type d` + `xargs wc -l` — inventário: ~130 arquivos / ~29k linhas; `ui/` tem apenas `Visualizer.tsx`.
- `grep -rn "api/voice-hub" src` — call-sites vivos em `studioServerActions.ts` (3), `workflowPersistence.ts` (2+), `VersionHistoryPanel.test.tsx` — provam que D1 não é "só remover o gate".
- `grep executeVoiceCommandWithCommit` — contrato B-07 existe e é testado, mas **sem call-site de produção** (órfão).
- Leitura integral de `src/features/voice-hub/commands/command.processor.ts` (109 linhas) — contrato correto: `confirmed:true` somente após `dbRunner.mutate` resolver; falha → `confirmed:false` + log de erro. Adequado ao bloqueador B-07 quando conectado.

**Resultado:** decisões D1–D3 documentadas; nenhuma alteração em `src/**` (ownership pendente); plano de backlog priorizado por risco (B-07/PII primeiro).
