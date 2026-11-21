De: 10
Para: 23 (Pina — Runtime, Filas e Workers; `src/lib/queue/**`, `src/workers/**`)
Onda: reconciliacao-20261114
Status: aberto
Prioridade: normal
Bloqueador-ref: EXP-06 / DEM-20261114-002 (parcialmente resolvido — scanner real entregue)

## Problema

O `ContinuousSecurityAuditService` agora executa um scanner REAL de dependências
(`npm audit --json` + SBOM CycloneDX + waivers de `docs/security/AUDIT_WAIVERS.md`),
mas nada o invoca periodicamente — `runSecuritySweep()` só roda sob demanda/testes.
O handoff original (`00-para-10-scanner-seguranca-real.md`, item 3) pedia "agendar
sweep no worker (periódico) e persistir relatórios"; `src/lib/queue/**` e
`src/workers/**` são propriedade do Agente 23, então o agendamento fica com você.

## Arquivos Envolvidos

- `src/lib/security/services/continuousSecurityAudit.service.ts` (serviço real —
  `continuousSecurityAuditService` singleton exportado, backend `NodeSecuritySweepScanner`)
- `src/lib/security/services/securitySweepScanner.ts` (scanner injetável)
- `worker.ts` e padrão `schedule*` existente (ex.: `scheduleBitrixSync`,
  `scheduleExecutiveSummaryJob` em `src/lib/queue/*.worker.ts`)
- `src/shared/contracts/continuousSecurityAudit.contract.ts` (shape do relatório —
  não muda; se persistir relatório precisar de tabela, abrir handoff para dados)

## Alteração Necessária

1. Criar worker/fila (ou estender worker existente de governança) que chame
   `continuousSecurityAuditService.runSecuritySweep()` em intervalo periódico
   (sugestão: diária — `npm audit` + `cyclonedx-npm` levam ~40-60s somados).
2. Decidir destino do relatório: `getLatestReport()` já expõe o último sweep em
   memória; persistência durável (tabela/arquivo) é decisão de schema — se precisar
   de model Prisma, abrir handoff para Agentes 11/12.
3. Atenção: o sweep exige `node_modules` + `package-lock.json` consistentes e
   acesso à rede (registry npm). Em imagem de produção, confirmar que
   `cyclonedx-npm` (devDependency `@cyclonedx/cyclonedx-npm`) está instalada —
   `npm ci` na imagem instala devDeps, mas validar no deploy real; se não
   estiver, o sweep falha fail-closed (propaga exceção, não emite relatório fake).
4. Falha do sweep deve ser observável (retry/DLQ conforme padrão do squad 24/Ivo).

## Teste Esperado

- Sweep agendado executa e emite `SECURITY_AUDIT_SWEEP_COMPLETED` pelo canal
  global de eventos (`src/lib/security/events/`); relatório com `simulated:false`.
- Relatório persistido consultável após restart do worker (se aplicável).
