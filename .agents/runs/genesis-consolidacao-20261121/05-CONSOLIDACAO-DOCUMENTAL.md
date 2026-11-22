# 05 — Consolidação Documental

**Status:** em preparação — aguardando aprovação do plano de integração.

## Estratégia aprovada para execução (pendente OK)

1. Na worktree `integracao/consolidacao-20261121` (base `main@0d790443`), integrar em ordem:
   - **Docs de governança estratégica** (Grupo A): `agente/00-plano-mestre-operacional-100-agentes`, `consolidacao_backlog_birthub360`.
   - **Handoffs documentais** (Grupo B): 7 branches de 1 patch cada — merge direto (todos limpos) ou cherry-pick; deduplicar contra os 24 untracked da raiz.
   - **Raiz**: commitar apenas os docs não-duplicados; avaliar `docs/orchestration/demands/DEM-20261118-001.md` e modificações em `INDEX.md`/`journal/00.md`.
   - **CI/Testes** (Grupo C): `agente/08-handoffs-20261117` — após atualizar base, validar workflow Schemathesis (URL `/api` conforme OpenAPI, permissões, gatilhos) antes de incorporar.
2. **Extração da quarentena**: do backup de `handoff-devin-consolidacao`, recuperar apenas `.agents/` legítimo (novo handoff `devin-para-00-continuidade-consolidacao-global-20261120.md` + atualizações de status) em commit próprio; **restaurar** os 2 pareceres de auditoria deletados indevidamente.
3. **Após cada merge**: verificar diff acumulado, duplicações, referências e ownership.

## Regras de deduplicação

- Handoff com mesmo nome em branches diferentes → comparar conteúdo; manter versão mais completa; registrar decisão no journal.
- Nenhum documento do snapshot pré-#485 deve ser "reincluído" — a main já contém versões iguais ou mais novas.

## Pacote documental da operação

Esta pasta (`.agents/runs/genesis-consolidacao-20261121/`) será commitada na branch de integração como evidência da operação.
