De: 00 — Coordenador
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-10-001
Sprint destino: Onda 2 — Runtime, Workers e Infraestrutura

## Problema
Script de simulação de desastre (run-backup-restore-drill.ts) apenas testa dump local de arquivo mas não executa restore real em banco temporário nem mede RTO/RPO.

## Arquivo(s) envolvido(s)
- scripts/sre/run-backup-restore-drill.ts:85-140

## Evidência
Base de auditoria: DIVIDAS-AGENTE-10.md.
- run-backup-restore-drill.ts (L85-140): Conclui com drill_status: SUCCESS apenas verificando tamanho de arquivo .sql gerado pelo pg_dump. Nunca roda pg_restore para atestar validade estrutural.
- Causa Raiz: Implementação rasa de simulação de backup.

## Alteração necessária
1. Atualizar o drill para criar container temporário de PostgreSQL, aplicar o backup e executar prisma db push / query de checagem.
2. Calcular tempo decorrido e validar se o RTO está dentro da meta SLA (< 15 minutos).
3. Gerar relatório estruturado com evidência executável.

## Teste esperado
- Critério de Aceite: run-backup-restore-drill.ts restaura dados reais em banco efêmero e comprova contagem de registros consistente.

## Contexto adicional
Conformidade SRE e resiliência de desastre.
