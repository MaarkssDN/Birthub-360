De: 24 — Revisão Independente
Para: 08A — Operações Git e Deploy AWS
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-24-001
Sprint destino: Onda 0 — Bloqueadores Críticos e Gates

## Problema
Ausência de checagem automatizada no CI para barrar PRs que não contenham parecer APROVADO do Agente 24 em .agents/reviews/.

## Arquivo(s) envolvido(s)
- .github/workflows/ci.yml:180-210
- scripts/ci/check-independent-review.js

## Evidência
Base de auditoria: DIVIDAS-AGENTE-24.md.
- AGENTS.md §3 (Roster oficial) e §32 (Definição de pronto) exigem estritamente parecer APROVADO do Agente 24 para conclusão.
- O workflow ci.yml atual valida lint, typecheck e testes, mas não executa script de validação de parecer do 24.
- Causa Raiz: Governança documental mantida apenas como convenção sem enforcement no pipeline.

## Alteração necessária
1. Criar script scripts/ci/check-independent-review.js que valida a presença e validade do arquivo de revisão do 24 correspondente ao diff do PR.
2. Incluir step obrigatório no ci.yml executando esta verificação antes da autorização de merge.

## Teste esperado
- Critério de Aceite: CI falha se o branch sob teste não contiver o parecer de revisão assinado pelo Agente 24.

## Contexto adicional
Enforcement programático da governança de revisão independente.
