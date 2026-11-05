De: 00 — Coordenador
Para: 08 — QA e Release
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-08-001 (B-05)
Sprint destino: Onda 0 — Bloqueadores Críticos e Gates

## Problema
Release gate script (release-gate.js) permite prosseguimento com avisos não bloqueantes em migrações pendentes ou falhas silenciosas de schema.

## Arquivo(s) envolvido(s)
- scripts/release-gate.js:38-65
- scripts/verify-schema-sync.ts:20-55

## Evidência
Base de auditoria: DIVIDAS-AGENTE-08.md e DIVIDAS-AGENTE-00.md.
- scripts/release-gate.js (L38-65): Validação de migrations do Prisma emite console.warn mas não encerra o processo com exit code != 0 quando há drift não aplicado em ambiente de staging.
- Violação direta de AGENTS.md §22 (B-05: Deploy capaz de iniciar sem migrações) e §28 (Gate obrigatório).
- Causa Raiz: Tratamento permissivo implementado para acomodar fluxos manuais de desenvolvimento local.

## Alteração necessária
1. Modificar scripts/release-gate.js para abortar imediatamente com process.exit(1) se npx prisma migrate status detectar migrações pendentes ou drift.
2. Adicionar verificação obrigatória de integridade do build e bloqueio estrito contra branches desatualizadas com a base de integração.
3. Impedir que qualquer flag --force ou bypass silencie a verificação em pipelines de produção.

## Teste esperado
- Critério de Aceite: scripts/release-gate.js falha categoricamente com exit code 1 na presença de qualquer migração não aplicada.
- Teste de Integração: scripts/test/release-gate.spec.ts validando cenários de banco limpo, banco atrasado e banco atualizado.

## Contexto adicional
Bloqueador fundamental para mitigar risco de indisponibilidade em deploys automáticos.
