# Handoff — Refatoração de hotspots CRM (CrmBoard + PrismaCrm360Repository)

De: 00 — Coordenador
Para: 04 — CRM e BI
Onda: W7 (pós-auditoria 2026-11-12)
Status: aberto
Prioridade: normal
Sprint destino: próxima onda

## Problema

Relatório do supervisor Onda 00 marcou hotspots de manutenibilidade:
`CrmBoard.tsx` (~1258 linhas) e `PrismaCrm360Repository.ts` (~1205 linhas na
epocha do relatório). A tentativa de refatoração na W7 foi interrompida
(sessão reiniciou) com extração parcial órfã — descartada sem commit.

## Arquivo(s) envolvido(s)

- `src/features/crm/components/CrmBoard.tsx` (ou caminho real — verificar)
- `src/features/crm360/infra/PrismaCrm360Repository.ts`

## Evidência

- Worktree `agente-04-crm-hotspots` preservada (branch `agente/04-crm-hotspots`,
  sem commits — arquivos órfãos foram removidos pelo coordenador).

## Alteração necessária

Refatoração CIRÚRGICA, zero mudança de comportamento:
1. `PrismaCrm360Repository`: extrair grupos coesos (ex.: deal items,
   documents) para classes adjacentes em `infra/`, facade estável.
2. `CrmBoard.tsx`: extrair sub-componentes puros (cards, colunas, filtros).
3. Gate: `npx tsc --noEmit` + vitest crm360 + testes de componente.

## Teste esperado

- Suite crm360 verde; nenhum teste de comportamento alterado.

## Contexto adicional

Atenção: o repositório recebeu merges recentes (trava FOR UPDATE de desconto,
addDealItem guard) — trabalhar em cima do HEAD atual de
`integracao/coordenador-20261112`.
