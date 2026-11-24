# Run — Agente 64 (Tito) · Squad 60 · DEM-20261123-001

- **Missão:** B-07 — conectar `src/features/voice-hub/commands/command.processor.ts` (órfão) a um fluxo real OU documentar como contrato-futuro.
- **Runtime:** Devin (subagente)
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-60/wt-64`
- **Branch:** `agente/64-voice-commands-s60` (base `integracao/onda-3-dem20261123` @ `5422d99c3e`)
- **Lease:** `.agents/runs/leases/squad-60-wt64.lease` (portas 22600–22699)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`
- **Data:** 2026-11-24

## 1. Investigação — quem deveria chamar o processor

Grep exaustivo (`createVoiceCommandRouter|processVoiceCommand|command.processor|voice-command-router|confirmation.manager|intent.parser|permission.guard`) em `src/**`, `tests/**`, `scripts/**`:

- **Zero call-sites de produção** — apenas os 5 arquivos de `commands/**` e testes.
- Pipeline completo no diretório (mais amplo que o inventário do plano, que citava 1 arquivo): `intent.parser.ts` (185 ln), `permission.guard.ts` (58), `confirmation.manager.ts` (87), `command.processor.ts` (134), `voice-command-router.ts` (327) + `__tests__/voiceCommandRouter.test.ts` (20 testes, coberto por `vitest.unit.config.ts` include `src/**/__tests__`).

### Call-sites naturais investigados (todos fora do ownership 64)

| Candidato | Arquivo | Dono (MATRIZ_PROPRIEDADE) | Veredito |
|---|---|---|---|
| Endpoint de comando em sessão de voz | `src/lib/voice-hub/routes/voiceRuntime.routes.ts` + `controllers/voiceRuntime.controller.ts` (`interactVoiceSessionHandler` é o padrão análogo, l.119-146) | **60 — Aurora** (`src/lib/voice-hub/**`) | ponto natural, mas arquivo de outro dono |
| Montagem HTTP do prefixo | `src/bootstrap/routes.ts:211` (`unavailableLegacyModule('voice-hub')`) | **22 — Hugo** | bloqueado; ver `squad-60-migracao-voicehub.md` |
| Consumidor WS/tempo real | `src/features/voice-hub/notifications/realtime/**` (68-Paco) | 68 | não consome transcripts hoje |
| Hook de voz browser | `src/features/voice-hub/hooks/useVoiceConversation.ts` | **65 — Lena** | client-side; precisaria de endpoint antes |
| Transcrição STT server | `src/features/voice-hub/services/realtimeTranscription.service.ts` | **63 — Lira** | emite transcripts, não comandos |
| Pipeline paralelo `src/features/voice/**` + `src/features/ai-voice/**` | `voice-command-executor.service.ts`, `sip-webrtc-bridge.service.ts`, `ai-voice-orchestrator.service.ts` | **SEM DONO na matriz** (órfãos; zero call-sites de produção) | caminho alternativo legado, não canônico B-07 |
| `src/lib/voice-runtime/**` (SessionManager, IntentEngine, PostCallFollowupAutomation) | SessionManager.handleUserText → intentEngine.analyzeIntent (só classifica; follow-up pós-chamada só sugere tarefa, não executa mutação de comando) | **SEM DONO na matriz** | não executa comandos hoje |

**Conclusão:** não existe call-site dentro de `commands/**` nem ponto de montagem seguro já existente → caminho 3 da missão: contrato-futuro documentado + handoff com proposta de wiring completa.

## 2. Alterações realizadas

| Arquivo | Mudança |
|---|---|
| `src/features/voice-hub/commands/voice-command-router.ts` | Docblock: seção "STATUS (2026-11-24)" marcando contrato-futuro + referência ao handoff e ao teste de contrato. Zero mudança de lógica. |
| `tests/unit/features/voice-hub/voiceCommandContract.test.ts` | **NOVO** — 7 testes provando o contrato comando→confirmação→commit que o call-site futuro deve exercitar (needs_confirmation sem tocar executor; confirm → executed+confirmed:true; execução única; falha de commit → confirmed:false; não-crítico direto; cancelamento; executor_not_bound). |
| `.agents/handoffs/squad-60/64-para-60-voice-commands-wiring.md` | **NOVO** — proposta completa de wiring: endpoint `POST /voice-runtime/sessions/:sessionId/command`, mapeamento status→HTTP, VoiceCommandExecutorRegistry com executores por tipo, regras B-07 invioláveis, nota multi-instância (confirmações em memória). |

Nenhum arquivo fora de `commands/**` foi editado. `src/bootstrap/routes.ts` (22-Hugo), `src/lib/voice-hub/**` (60-Aurora) e executores CRM (Squad 40) permanecem intocados.

## 3. Gates executados

| Comando | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts` (commandProcessor + voiceCommandRouter + voiceCommandContract) | **30/30 testes passam** (3 arquivos) |
| `npx tsc --noEmit` | **limpo** (exit 0) |
| `npx vitest run` (config default) nos mesmos arquivos | 10/10 passam; o router test só roda via `vitest.unit.config.ts` (include `src/**/__tests__`) — comportamento esperado |

Gate de integração completo (`test:architecture`, `test:unit` integral, `test:integration`, `test:e2e`) **não executado** — diff cirúrgico (docblock + 1 arquivo de teste novo + docs); recomenda-se ao integrador rodar no SHA congelado. Sem push/PR/merge.

## 4. Achados reportados ao coordenador

1. **B-07 pipeline órfão confirmado e agora documentado** — contrato executável em `voiceCommandContract.test.ts`.
2. **Risco B-07 adjacente:** `src/features/voice/voice-command-executor.service.ts:340-352` (`handleTransferCall`) retorna `executed:true, verified:true` sem persistência. Path `src/features/voice/**` e `src/features/ai-voice/**` **ausentes da MATRIZ_PROPRIEDADE** (órfãos, sem call-site de produção). Detalhado no handoff §5.
3. **`src/lib/voice-runtime/**` também fora da matriz** — SessionManager/IntentEngine não executam mutações de comando hoje (IntentEngine só classifica; PostCallFollowupAutomation só sugere tarefa), mas é o runtime que alimentaria transcripts ao router quando montado.

## 5. Pendências / próximo passo

- **60-Aurora:** deliberar wiring conforme handoff `64-para-60-voice-commands-wiring.md` (endpoint + registry + mount via 22-Hugo + executores Squad 40).
- **Astra/Orquestrador:** ownership de `src/features/voice/**`, `src/features/ai-voice/**`, `src/lib/voice-runtime/**` (órfãos na matriz).
- **Silas (09):** parecer sobre SHA do commit desta branch quando congelado.
