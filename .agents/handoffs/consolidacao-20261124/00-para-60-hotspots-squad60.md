De: 00 — Astra
Para: 60 — Aurora (Coordenador Squad 60)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: resolvido
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 6, 9
Sprint destino: Onda 4 / ciclo imediato

## Problema

Dois arquivos do Squad 60 possuem exceções de hotspot arquiteturais ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 6 | `src/features/voice-hub/components/design-system/index.tsx` | 1200 | ~1150 | Catálogo/barrel export agregador de componentes de telefonia/áudio |
| 9 | `src/lib/voice-hub/services/workflowRuntimeService.ts` | 1500 | ~1480 | Motor de execução de fluxos de chamada (IVR/URAs), eventos de áudio |

## Arquivo(s) envolvido(s)

- `src/features/voice-hub/components/design-system/index.tsx` (Agente 65 — Lena)
- `src/lib/voice-hub/services/workflowRuntimeService.ts` (Agente 61 — Nando)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo.

## Alteração necessária

1. `design-system/index.tsx`: desmembrar barrel em exportações pontuais ou sub-pastas por categoria (áudio, discador, controles).
2. `workflowRuntimeService.ts`: decompor lógica de transição de nós e adapters de TTS/STT em classes de execução separadas. Preservar comportamento do motor IVR e contratos de eventos de áudio.

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 2 arquivos.
- Testes unitários de voice-hub e do motor de workflow sem regressão.
- B-07: comandos de voz devem continuar executando ações comprovadas — não alterar semântica.

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branches de refatoração.
- Agente 65 (Lena) entregou na Onda 3 (`b8a39713e`, APROVADO) — coordenar ownership em `src/features/voice-hub/**`.
- Registrar SHAs congelados e submeter ao Agente 09 antes de integrar.

## Resolução

**Agente 60 — Aurora · 2026-11-25 · worktree `Birthub-360-wt-recuperacao` (branch `recuperacao/onda-consolidacao-20261124`)**

A refatoração revertida foi recuperada a partir dos arquivos órfãos deixados em `D:/Github/Birthub-360` (somente leitura). Os dois hotspots foram de fato modularizados sem alteração semântica — verificado por diff: os módulos extraídos são cópias verbatim dos blocos removidos dos pais (únicas diferenças: keywords `export` adicionadas, comentários de seção e imports próprios).

### Alterações aplicadas

1. `src/features/voice-hub/components/design-system/index.tsx`: 1098 → **632 linhas**.
   - Removidos os blocos "13. TABS SYSTEM"–"19. TOAST" (Tabs, Breadcrumb, Table/TableHead/TableRow/TableCell, Modal, Timeline, Tooltip, Toast/useToast/ToastContainer).
   - Novos módulos: `feedback.tsx` (139 ln), `modal.tsx` (123 ln), `table.tsx` (86 ln), `tabs.tsx` (127 ln) — cópias dos órfãos.
   - `index.tsx` agora faz `export * from` dos 4 módulos; API pública inalterada (testes `index.test.tsx` e `components/index.test.tsx` importam `Modal`/`Tabs` via barrel — cobertos).
   - Imports ajustados: removidos `motion/react`, `useEffect/useRef/useState`, `usePrefersReducedMotion`, `ChevronRight`, `X`, `FOCUSABLE_SELECTOR` (só usados pelos blocos extraídos); mantidos os usados pelo restante do catálogo.

2. `src/lib/voice-hub/services/workflowRuntimeService.ts`: 1436 → **541 linhas**.
   - Tipos/constantes/helpers puros → `workflowRuntimeShared.ts` (413 ln); executores de nó + `validateRuntimeCompatibility` → `workflowRuntimeNodes.ts` (574 ln).
   - O pai mantém a orquestração de turnos (`advanceUntilInteraction(Async)`, `initializeWorkflowRuntime`, `prepareWorkflowTurn(Internal)`, `resumeAfterTool`, `getWorkflowOpeningQuestion`, `attachVoiceOverride`, `pendingInterruptTurn`) — diff confirma cauda **byte-idêntica** à baseline.
   - Superfície pública preservada via re-exports explícitos: `mapRuntimeProvider`, `validateRuntimeCompatibility`, e os tipos `RuntimeProvider`, `RuntimeNodeType`, `WorkflowNode`, `WorkflowRuntimeState`, `VoiceOverride`, `TransferDetails`, `PreparedWorkflowTurn` (internos como `RuntimeNode`/`RuntimeEdge`/`RuntimeConfig` permanecem não-exportados, como antes).
   - Consumidores verificados: `telephonyService.ts`, `workflowService.ts`, `telephony.controller.ts` e os 4 testes (`telephonyService.*.test.ts`, `workflowRuntimeService.knowledgeTool.test.ts`) importam apenas símbolos re-exportados.
   - **B-07 preservado**: nenhuma semântica de comando/execução alterada — o motor IVR, contratos de eventos de áudio (`voice`/`resolveVoiceOverride`/`getRuntimeVoiceOverride`) e o fluxo `tool_pending` → `resumeAfterTool` estão intactos (movidos verbatim).

3. `docs/architecture/HOTSPOT_EXCEPTIONS.md`: removidos os 2 blocos de exceção (itens 6 e 9). Obs.: o arquivo já continha edições de outros squads nesta worktree — a remoção foi cirúrgica, somente os 2 blocos do Squad 60.

### Validação

- `npm run check:hotspots` (via tsx de worktree irmã `wt-08-dsr`, pois `node_modules` local estava em instalação concorrente): **✅ 2034 arquivos, 0 acima de 1000 sem exceção** — os 2 arquivos saíram da lista (632 e 541 linhas, abaixo até do limite de aviso).
- `biome check` (v2.5.14 standalone; projeto pinna ^2.6.8) nos 8 arquivos: **0 erros**, 7 warnings — todos pré-existentes/herdados verbatim da baseline (`useImportType` no `import React`, `noDelete`+`suppressions/unused` no `applyToolFallback`, `useSemanticElements` no `TableRow`); não introduzidos pela refatoração.
- `organizeImports` aplicado pelo biome nos 2 serviços; line endings CRLF preservados (atenção: `sed -i` converte para LF — recompor CRLF ao final).
- `tsc --noEmit` e `vitest`: **não executáveis no momento** — `node_modules` da worktree está em `npm install` ativo (package.json ausentes em react/vitest/etc.). Transpile sintático (ts.transpileModule) OK nos 8 arquivos; recomendo re-rodar `npm run typecheck` e `vitest run -c vitest.unit.config.ts src/lib/voice-hub src/features/voice-hub` quando o install concluir.

### Órfãos de origem incerta (NÃO integrados — reporte ao 00)

Em `D:/Github/Birthub-360` restam como untracked, **byte-idênticos** a arquivos já versionados nesta worktree (verificado com `diff -rq`):
- `src/features/voice-hub/commands/{confirmation.manager,intent.parser,permission.guard,stt-adapter,voice-command-router}.ts` e `commands/__tests__/`
- `src/features/voice-hub/services/__tests__/`
- `src/features/voice-hub/transcription/{sttTranscript.contract.ts,__tests__/}`

São duplicatas residuais de trabalho já integrado (commands/transcription pertencem aos Agentes 63/64, não a esta refatoração de hotspots). Podem ser removidos do diretório principal sem perda — decisão do 00.

### Pendências para o 00 / gate de integração

- Submeter SHAs ao Agente 09 (Silas) antes de integrar, conforme handoff original.
- Re-rodar typecheck + testes voice-hub após término do `npm install` da worktree.
- Nada commitado, conforme instrução.
