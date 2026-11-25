# Handoff — Squad 60 → Orquestrador Humano / Agente 00 (Astra)

- **De:** Agente 60 — Aurora (Coordenador Squad 60)
- **Para:** Orquestrador Humano (decisões) / Agente 00 — Astra (registro)
- **Data:** 2026-11-24
- **Base:** `coord/squad-60` @ `93e82c220` em `squads/squad-60/wt-coord`
- **Tipo:** decisão humana pendente + pedido de designação de ownership
- **Referência completa:** `.agents/runs/squads/squad-60-plano.md` §2

## Pedido 1 — Três decisões sobre o Voice Hub (NÃO executar sem aprovação)

1. **D1 — `/api/voice-hub/*` legacyModuleGate (`src/bootstrap/routes.ts:211`):** o cliente `voiceHub.api.ts` já migrou para `/api/integrations/birth-voice/*`, mas `store/studioServerActions.ts`, `store/workflowPersistence.ts` e `VersionHistoryPanel` ainda chamam `/api/voice-hub/workflow*` (503 intencional). Reabrir o gate sem migrar = violação da regra fail-closed. Opções documentadas: (a) endpoints canônicos + migração dos call-sites [recomendada], (b) liberar só `/workflow` após auditoria, (c) manter 503 e remover chamadas mortas.
2. **D2 — Destino do ~80% de código em `src/features/voice-hub/**`:** ~130 arquivos / ~29k linhas; subdirs `components|pages|store|services|hooks|lib|infra|api` **sem dono** na MATRIZ_PROPRIEDADE (só `index.ts`→60 e `ui/**`→65). Sem reconciliação, nenhum agente pode podar/evoluir. Opções: designar ownership ao Squad 60 / congelar como legacy read-only / poda cirúrgica pós-D1.
3. **D3 — `src/features/voice-hub/AGENTS.md` desatualizado:** declara "Agente 12" como dono (numeração legada). Proposta: corrigir cabeçalho ou arquivar — depende de D2.

## Pedido 2 — Ownership inexistente

`src/bootstrap/routes.ts` e `src/api/**` não têm proprietário na `.agents/MATRIZ_PROPRIEDADE.md` (backlog herdado confirmado em `estrutura-10-coordenadores-squads-20261124.md` §7). Necessário para D1. Sugestão: Squad 20 (Hugo/Zara) com revisão de contratos.

## Pedido 3 — Confirmação de fronteiras cross-squad

Handoffs formais a emitir após OK: 60→50 (inbox × WhatsApp/Luna), 60→20 (rotas), 60→07/08 (PII áudio + revogação), 60→90/98 (storage segredos), 60→80/84 (push/deep links).

## O que o Squad 60 já preparou (não depende das decisões)

- Inventário completo de `voice-hub/**` e `notifications/**` com contagem de arquivos/linhas e status vivo/stub.
- Análise B-07: `commands/command.processor.ts` implementa o contrato correto (confirmação só pós-commit) mas está **órfão** — missão do 64-Tito priorizada.
- Backlog priorizado por risco (B-07, PII/LGPD, opt-out) no plano §3.

## Evidências

- `git worktree add squads/squad-60/wt-coord -b coord/squad-60 93e82c220` — verificado.
- Greps e leituras listados no plano §6.

**Status:** aguardando deliberação humana. Squad 60 permanece PREPARADO; nenhuma escrita em `src/**` realizada.
