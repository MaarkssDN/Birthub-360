# Parecer do Auditor Independente — Agente 09 (Silas)

- **Missão:** DEM-20261123-001 — Auditoria da entrega do Agente 64 (Tito, Squad 60 — comandos de voz B-07, contrato-futuro)
- **Data:** 2026-11-24
- **Objeto auditado:** branch `agente/64-voice-commands-s60`, SHA congelado `f960286acc`
- **Base de diff:** `5422d99c3e` (pai direto do commit; diff = 1 commit, 5 arquivos, +407)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-60/wt-64` (HEAD = SHA congelado)
- **Run doc:** `.agents/runs/squads/squad-60-run-64.md` · **Lease:** `.agents/runs/leases/squad-60-wt64.lease` · **Handoff:** `.agents/handoffs/squad-60/64-para-60-voice-commands-wiring.md`
- **Nota de escopo:** o pipeline `src/features/voice-hub/commands/` (intent.parser, permission.guard, confirmation.manager, command.processor, voice-command-router + 20 testes) foi entregue em commits anteriores já presentes na base (`965fc4bf53`, `8b7a9ab1d3`). O commit auditado `f960286acc` é a **decisão caminho-3**: docblock de status + teste de contrato + handoff de wiring. Auditoria cobre o commit; o pipeline em si foi objeto de parecer anterior do Silas (commit `8b7a9ab1d3` referencia "atende parecer Silas").

## Veredito: APROVADO

Com pendências não bloqueantes registradas para o Agente 00 (ver §6).

## 1. Verificação dos claims (todos confirmados)

| Claim | Verificação | Resultado |
|---|---|---|
| Diff é não-funcional (docblock + testes + docs) | `git diff 5422d99c3e..f960286acc`: 5 arquivos, +407/−0. Única mudança em `src/` é docblock em `voice-command-router.ts` (linhas 11-19, comentário `STATUS (2026-11-24...)`) — **zero lógica**. Restante: run doc, lease, handoff e `voiceCommandContract.test.ts` (novo) | **Confirmado** |
| Pipeline B-07 completo mas órfão (zero call-sites) | Grep `createVoiceCommandRouter\|processVoiceCommand\|command.processor` em `src/**`/`tests/**`: apenas `commands/**` e testes. Cadeia alternativa `src/features/voice/**` + `src/features/ai-voice/**`: `sip-webrtc-bridge.service.ts:191` chama `voiceCommandExecutorService`, mas `ai-voice-orchestrator.service.ts`/`webrtc-channel.service.ts` (únicos consumidores) **não têm nenhum import externo** — confirmado órfão ponta a ponta | **Confirmado** |
| Decisão caminho-3 justificada | Todos os call-sites naturais mapeados no run doc §1 pertencem a outros donos: `src/lib/voice-hub/routes\|controllers` (60-Aurora), `src/bootstrap/routes.ts` (22-Hugo, prefixo `/api/voice-hub` gated por `unavailableLegacyModule` em l.211), executores CRM (Squad 40). Nenhum ponto de montagem seguro dentro de `commands/**` | **Confirmado** — decisão correta e documentada |
| `vitest` 3 arquivos 30/30 | Reproduzido nesta auditoria: `npx vitest run -c vitest.unit.config.ts` nos 3 arquivos → **3 arquivos, 30/30 testes passando** | **Confirmado** |
| `tsc` limpo | `npx tsc --noEmit` no worktree → **exit 0, sem output** | **Confirmado** |
| Achado `handleTransferCall` B-07 adjacente | `src/features/voice/voice-command-executor.service.ts:340-352`: retorna `{executed:true, verified:true, message:'Transferência...solicitada', data:{targetExtension}}` **sem nenhuma chamada prisma/persistência** — falso positivo de execução real. Achado **real e confirmado** | **Confirmado** |

## 2. Os 7 testes de contrato provam o que dizem

`tests/unit/features/voice-hub/voiceCommandContract.test.ts` (206 linhas, inspecionado na íntegra) — cada teste mapeia uma invariante B-07 do contrato consumidor:

1. **needs_confirmation sem tocar executor** — `schedule_meeting.mutate` não chamado; `confirmationId`/`expiresAt` emitidos (linhas 54-68).
2. **confirm → executed + confirmed:true só após commit** — `committedAt` definido, executor chamado 1x com `(organizationId, command)` onde `command.organizationId` = tenant do actor (linhas 70-100). Prova o vínculo tenant+execução.
3. **execução única** — replay do mesmo `confirmationId` retorna `confirmation_expired`, `mutate` segue 1x (linhas 102-125). Idempotência de confirmação verificada.
4. **falha de commit → confirmed:false** — runner rejeitado → status `failed`, `confirmed:false`, `committedAt` undefined, erro propagado (linhas 127-150). Nunca falso positivo.
5. **não-crítico executa direto** — `create_lead` → `executed`+`confirmed:true`+`committedAt` (linhas 152-165).
6. **cancelamento** — `confirmation_cancelled`, zero mutação; confirm tardio bloqueado (linhas 167-193).
7. **executor_not_bound** — registry vazio → falha honesta, `execution` undefined (linhas 195-205).

Os testes exercitam o fluxo real do router (`processVoiceCommand`), não mocks do próprio router — são prova executável do contrato que o call-site futuro deve satisfazer. Qualidade adequada.

## 3. Qualidade do handoff de wiring

`.agents/handoffs/squad-60/64-para-60-voice-commands-wiring.md` (122 linhas, inspecionado): tecnicamente sólido.

- **Endpoint proposto** `POST /voice-runtime/sessions/:sessionId/command` segue o padrão existente `interactVoiceSessionHandler` (mesma validação sessão+tenant `session.tenantId !== req.organizationId` → 404).
- **Mapeamento status→HTTP** explícito e correto frente aos status reais do router (executed/needs_confirmation/failed/denied/confirmation_*/ambiguous/unrecognized/executor_not_bound).
- **Registry de executores** por `VoiceCommandType` com recomendação explícita de NÃO vincular `generic_action` (fail-closed) — postura correta.
- **Regras B-07 invioláveis** (§4) cobrem os riscos clássicos: nunca sintetizar `confirmed`, nunca `simulation:true` em produção, decisão de confirmação repassada intacta, needs_confirmation→202 com prompt.
- **Limitação multi-instância documentada honestamente** (confirmações em memória, TTL 120s, não cruzam réplicas — aceitável v1, caminho Redis/17-Remo se necessário).
- Responsabilidades atribuídas corretamente por ownership: 60-Aurora (endpoint/registry), 22-Hugo (mount), Squad 40 (executores), 21-Zara sugerida para schema zod.

## 4. Avaliação: contrato-futuro sem wiring é aceitável?

**Sim.** Três razões:

1. **Fronteira de ownership real** — todo call-site natural está fora de `commands/**` e a matriz de propriedade confirma outros donos. Forçar wiring dentro do escopo violaria §15/§16 do AGENTS.md.
2. **Zero risco de runtime** — código dormente não executa; o diff auditado não adiciona nenhum caminho executável novo (só testes que rodam em CI).
3. **Contrato travado por teste** — diferente de "código morto abandonado", aqui o comportamento exigido do consumidor está pinado em 7 testes + handoff completo. Quando 60-Aurora montar o endpoint, o contrato já está especificado e testado.

Precedente análogo já aceito nesta onda: parecer Agente 84 (Pia) — handler de deep links dormente corrigido e testado, wiring futuro via handoff → APROVADO.

## 5. Risco B-07 adjacente (`handleTransferCall`) — bloquear ou registrar?

**Registrar, não bloquear.** Fundamentos:

- O código defeituoso está em `src/features/voice/**`, **órfão ponta a ponta** (verificado: nenhum import de `ai-voice/**` fora do próprio diretório; sem call-sites em rotas/controllers/bootstrap). É risco **latente**, não ativo — não há caminho de produção que o alcance hoje.
- Está fora do ownership do Agente 64 e fora do diff auditado — bloquear a entrega do 64 por defeito alheio violaria P3 (alterações cirúrgicas) e a regra de propriedade.
- **Porém é condição de gate para o futuro**: se `src/features/voice/**`/`ai-voice/**` forem deliberados como caminho de voz e conectados, `handleTransferCall` DEVE ser corrigido (persistir a transferência ou retornar `executed:false`) antes do wiring — caso contrário reincide B-07 em produção.

## 6. Pendências para o Agente 00 (não bloqueantes)

- **P-1 (ownership):** `src/features/voice/**`, `src/features/ai-voice/**` e `src/lib/voice-runtime/**` não constam na MATRIZ_PROPRIEDADE (órfãos confirmados nesta auditoria). Deliberar dono ou decommission — mesma pendência já aberta pelo run doc §5.
- **P-2 (B-07 adjacente):** `voice-command-executor.service.ts:340-352` `handleTransferCall` retorna `executed:true,verified:true` sem persistência. Bloquear qualquer wiring futuro desses paths até correção (executar transferência real via SIP/gravadora ou honesto `executed:false`).
- **P-3 (wiring B-07):** aceitar e agendar o handoff `64-para-60-voice-commands-wiring.md` — decisão 60-Aurora sobre endpoint+registry, mount via 22-Hugo, executores via Squad 40, schema zod via 21-Zara. Até lá, B-07 permanece contrato-futuro (estado correto e explícito).
- **P-4 (gate de integração):** diff é cirúrgico mas o run doc não executou `test:unit` integral nem `test:architecture` — integrador deve rodar no SHA de merge (recomendação padrão do gate local).

## 7. Conformidade

- Auditoria read-only sobre código de produção: nenhum arquivo de produção editado por este parecer.
- Escopo disjunto das demais instâncias Silas (48, 58, 84, 32, pipeline) — esta cobre exclusivamente a entrega do Agente 64.
- SHA auditado congelado e verificado: `f960286acc`; worktree em HEAD correspondente.
- Comandos executados nesta auditoria: `git diff/show/log`, greps de call-sites, `npx vitest run -c vitest.unit.config.ts` (3 arquivos), `npx tsc --noEmit`.

**Parecer emitido por:** Agente 09 — Silas · DEM-20261123-001 · 2026-11-24
