# 08 — Plano de Saneamento Pós-Consolidação

**Escopo:** preparar a base; NÃO corrigir indiscriminadamente. Cada item abaixo exige missão própria com ownership definido.

## Backlog técnico a revalidar na base consolidada

| # | Item | Origem | Ação proposta |
|---|---|---|---|
| 1 | 41 testes unitários reprovados | auditoria anterior | re-rodar `vitest.unit` na base consolidada; classificar reais vs obsoletas |
| 2 | 27 falhas middleware de erros | idem | idem — provável drift de contrato RFC7807 |
| 3 | 3 falhas guarda rota `/tools` | idem | revalidar; handoff `24-para-00-guarda-antibypass-tools` pode ter resolução em voo |
| 4 | 1 falha contrato cross-tenant | idem | revalidar RLS/contrato |
| 5 | 4 falhas verificação criptográfica de backup | idem | revalidar |
| 6 | Timeouts Landing360 e outbox | idem | revalidar em ambiente com serviços reais |
| 7 | Falhas contratuais LGPD | idem | revalidar |
| 8 | Divergência Biome `LeadUseCases.ts` | idem | `biome format` cirúrgico |
| 9 | Violação arquitetural CRM↔Bitrix | dependency-cruiser | revisar aresta, abrir handoff ao dono |
| 10 | `rejectUnauthorized:false` em credenciais | AppSec | corrigir com pinning/certificado |
| 11 | Downloads binários Bitrix | revisão | avaliar streaming/tamanho-limite |
| 12 | Docker remoto/Redis/IA connectivity | infra | health-check dedicado |
| 13 | Divergência revisor "24" vs "09 Silas" | governança | varredura de docs legados; canonical = 09 |
| 14 | Coleta de cobertura unitária inconsistente | CI | alinhar reporter/threshold |

## Faxina de worktrees (pós-consolidação, com aprovação)

- Remover ~24 worktrees AHEAD=0 ou patch-equivalentes após confirmar conteúdo no remoto.
- Manter: worktrees das branches integradas até merge confirmado.
- `wt-handoff-00-consolidacao`: após realinhamento da branch, worktree pode ser removida (conteúdo 100% redundante).
- `handoff-devin-consolidacao`: após extração dos docs e restauração, branch morre (AHEAD=0).

## Governança

- Consolidar documentação oficial de estado (`.agents/runs/consolidacao-20261120/` × propostas paralelas) — decisão do Orquestrador sobre versão oficial.
- Mapa de agentes D-1..D-6 e decisões D-P1..D-P12 permanecem pendentes de aprovação humana.
