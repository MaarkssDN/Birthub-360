# Parecer de Revisão Independente — Agente 09 (Silas) — Onda 4

- **Entrega auditada:** `agente/64-voice-commands-onda4` — Agente 64 (Tito), pipeline de comandos de voz B-07
- **Base SHA:** `32d07c3750c370b63da8b720019413c9a40e0e68`
- **SHAs auditados:** `965fc4bf5` (feat), `b46224334` (docs handoff)
- **Runtime auditor:** Devin subagent (diferente do autor — Devin subagent)
- **Data:** 2026-11-24

## Veredito: REPROVADO

## Escopo auditado

```
 .agents/handoffs/onda4/64-para-00-voice-commands-onda4.md      | docs
 src/features/voice-hub/commands/command.processor.ts           |  25 +
 src/features/voice-hub/commands/confirmation.manager.ts        |  87 + (novo)
 src/features/voice-hub/commands/intent.parser.ts               | 185 + (novo)
 src/features/voice-hub/commands/permission.guard.ts            |  58 + (novo)
 src/features/voice-hub/commands/voice-command-router.ts        | 286 + (novo)
 tests/unit/features/voice-hub/voiceCommandRouter.test.ts       | 337 + (novo)  ← FORA DO OWNERSHIP
```

## Achados

### A1 — Arquivo fora do ownership declarado (violação de escopo/propriedade)

A missão ONDA4-64 declarou ownership exclusivo
`src/features/voice-hub/commands/**`. O arquivo
`tests/unit/features/voice-hub/voiceCommandRouter.test.ts` está fora desse
path. Pela `.agents/MATRIZ_PROPRIEDADE.md`, `tests/unit/**` pertence ao
Agente 03; o handoff do Agente 56 nesta mesma onda trata `tests/**` como
propriedade de outro agente e colocalizou seu teste corretamente em
`src/lib/integrations/whatsapp/__tests__/`. O Agente 85 fez o mesmo em
`src/mobile/offline/__tests__/`.

**Correção exigida:** mover o teste para
`src/features/voice-hub/commands/__tests__/voiceCommandRouter.test.ts` (ou
obter autorização explícita do 00 para `tests/unit/**`). Sem isso, o merge
conflita com a governança de propriedade (AGENTS.md §15/§36, P3).

### A2 — Confirmação ativa não vinculada ao ator/tenant que a criou (risco de tenancy)

Em `voice-command-router.ts` → `resolveConfirmation()`:

1. `confirmations.consume(confirmationId)` retorna o comando pendente **sem
   verificar** se `actor.organizationId`/`actor.userId` correspondem aos do
   criador (`pending.command.organizationId`/`userId`).
2. `executeVoiceCommandWithCommit` executa `dbRunner.mutate(command.organizationId, command)`
   — ou seja, a mutação usa o `organizationId` **do comando pendente original**,
   não o do ator que confirmou.

Cenário: usuário da org B que obtenha um `confirmationId` válido (UUID,
TTL 2min, gerenciador em memória) da org A consegue disparar a mutação **no
tenant da org A**. A revalidação de `authorizeVoiceCommand` no momento da
confirmação é boa, mas autoriza o papel do ator B — não o vínculo com a org
criadora. A exploração é difícil (ID não adivinhável + TTL curto + mesmo
processo), mas é uma lacuna real de tenancy em código novo: defesa em
profundidade exige `pending.command.organizationId === actor.organizationId`
(e idealmente `userId`) antes de executar.

**Correção exigida:** em `resolveConfirmation`, após `consume` retornar
`found`, rejeitar com `confirmation_denied`/`not_found` quando
`consumed.pending.command.organizationId !== actor.organizationId` (e avaliar
binding por `userId`). Adicionar teste cross-tenant.

## Análise do restante (positivo)

- Pipeline bem desenhado: parser determinístico que nunca executa,
  autorização por papel mínimo por tipo de comando (viewer não muta),
  confirmação de uso único com TTL, revalidação de autorização no confirm,
  executor simulado/ausente → falha honesta (nunca `confirmed: true` sem
  commit real), resposta só após commit.
- `organizationId` sempre derivado de `actor.organizationId` no caminho de
  comando novo — correto.
- Sem segredos/PII; dados de teste sintéticos.
- Handoff e evidência de testes presentes (337 linhas de teste).

## Conclusão

A qualidade técnica do código é boa, mas a entrega viola o ownership
declarado (A1) e apresenta lacuna de tenancy na confirmação (A2). Por ser a
primeira iteração da branch, **REPROVADO** — correções cirúrgicas e reenvio do
SHA para nova auditoria. Após mover o teste e adicionar o binding
ator↔confirmação, o parecer pode ser revisto para APROVADO.
