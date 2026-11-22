# Handoff — Dry-run de automações: sandbox entregue, lacunas restantes

De: 07 — IA e Automações
Para: 00 — Coordenador
Onda: 00 (relatório do supervisor — "Dry-Run de automações: simulador atual em memória, exige rollback/sandbox real")
Status: resolvido (entrega mínima segura) — ver "Ficou de fora" abaixo
Prioridade: normal
Bloqueador-ref: TAREFA-RECONST-020 (backlog mestre Fase 02) — parcialmente atendida
Sprint destino: próxima onda de endurecimento do motor de automações

## Problema

O relatório do supervisor citava `src/features/automations/engine/RuleEngineAST.ts` — **esse arquivo
não existe**. O dry-run real é `src/features/automations/automation-dry-run.service.ts` (Onda 42,
DEC-14 opção A). Auditoria do estado anterior:

- O dry-run **já era seguro por construção**: `runAction` nunca é chamado; só `matchesConditions` e
  `renderTemplate` (funções puras) são reusadas. Não havia execução "em memória" com efeitos — o
  problema era de **cobertura e realismo**, não de vazamento de efeitos.
- Só 3 das 7 ações do motor tinham preview (`Notificar equipe`, `Criar atividade`, `Ligar via SDR
  de Voz`). As ações estendidas (`Chamar webhook externo`, `Atualizar campo customizado`,
  `Enrich lead`, `Mover para outra etapa de cadência`) caíam em "Ação desconhecida" — preview
  irreal e potencialmente perigoso se alguém assumisse que "desconhecida" = "segura".
- O caminho para envios reais de WhatsApp é indireto: `Mover para outra etapa de cadência` →
  `cadenceIntegrationService.executeCadenceAction` → `sharedCadenceEnrollmentsStore` (**store em
  memória**, `src/shared/contracts/multichannelCadence.contract.ts`) → workers de cadência
  (`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`) enviam WhatsApp/e-mail. O
  dry-run não tocava nesse serviço — e continua sem tocar.

## O que foi implementado (neste handoff = entrega do 07)

Abordagem escolhida: **sandbox por construção** (estender a prévia existente), não dry-run
transacional com rollback. Justificativa: os efeitos de maior risco (voz/SMTP/HTTP/fila) **não são
revertíveis por rollback de banco** — interceptá-los antes de executar é o único sandbox realmente
seguro, e já era o padrão do serviço.

- `automation-dry-run.service.ts`: 4 novos previews espelhando as validações do `runAction` real
  (`PermanentAutomationError` → `wouldFire: false` + `blockedReason`), cada um registrando o efeito
  pretendido em `details` (`simulatedEffect` + `note`) sem executar nada:
  - `Chamar webhook externo` → método/URL renderizados; `fetch` nunca chamado.
  - `Atualizar campo customizado` → entidade/campo/valor; `prisma.*.update` nunca chamado
    (inclui a paridade "só Lead grava de verdade").
  - `Enrich lead` → leadId + evento `LEAD_ENRICHMENT_REQUESTED`; `domainEventMesh.publish` nunca
    chamado (nenhum job enfileirado).
  - `Mover para outra etapa de cadência` → cadenceId/leadId/ação; `executeCadenceAction` nunca
    chamado (nenhum enrollment alterado, nenhum WhatsApp agendado).
- `METHODOLOGY_NOTE` e doc do serviço atualizados declarando o contrato sandbox explicitamente.
- `automations.api.ts`: tipo `action` do DryRun alargado para labels estendidas.
- `AutomationDryRunDialog.tsx`: `describeOutcome` cobre as 4 novas ações.
- Novo teste `__tests__/automation-dry-run.service.test.ts` (10 testes): prova que dry-run de
  webhook/e-mail/voz/cadência/fila **não chama** `fetch`, `sendEmail`, `callLead`,
  `domainEventMesh.publish`, `executeCadenceAction` nem writes Prisma, e que as ações simuladas são
  registradas em `records`.

Verificação: `vitest run src/features/automations` → 11 arquivos / 103 testes verdes;
`npx tsc --noEmit` limpo; `biome lint` nos 4 arquivos limpo.

## Ficou de fora (lacunas conhecidas — candidatas a onda futura)

1. **Paridade por convenção, não por compilador**: cada ação nova no `runAction` exige um preview
   manual correspondente; ação futura sem preview volta a cair em "Ação desconhecida". Endurecimento
   possível: guard de exaustividade (ex.: `satisfies`/tipo mapeado `Record<AutomationActionType,
   PreviewFn>`) ou fazer o próprio `runAction` aceitar um sink de efeitos (AsyncLocalStorage)
   interceptável — este último é a "versão real" do sandbox, mas é refactor do motor, não entrega
   cirúrgica.
2. **Amostra só cobre Lead/Activity**: gatilhos estendidos (`Deal mudou de estágio`, `Reunião
   agendada`, `Proposta enviada`, `Contrato assinado`, `Score de risco mudou`) usam `sampleLeads`
   por fallback — preview pode ser enganoso para esses gatilhos (e o motor real nem os dispara:
   `handleScoped` só consulta os 4 triggers padrão do enum Prisma).
3. **`sharedCadenceEnrollmentsStore` é estado em memória** (não persiste entre restarts/instâncias)
   — fora do escopo do 07 (contrato compartilhado, provável dono 01/16/17), mas é a raiz do "em
   memória" citado no relatório do supervisor. Se a intenção era persistência real de enrollments,
   abrir handoff para o dono do contrato.
4. **Trilha do dry-run**: o dry-run não grava AuditLog/history (por desenho — é leitura). Se produto
   quiser auditoria de "quem simulou o quê", é decisão de 02/01.

## Teste esperado

`npx vitest run -c vitest.unit.config.ts src/features/automations/__tests__/automation-dry-run.service.test.ts`
→ 10/10 verdes.
