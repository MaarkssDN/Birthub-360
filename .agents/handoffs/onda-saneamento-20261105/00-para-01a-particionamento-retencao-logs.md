De: 00 — Coordenador
Para: 01A — Confiabilidade de Dados, RLS e Retenção
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: normal
Bloqueador-ref: DIV-AGENTE-01A-002
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Problema
Tabelas AILog, SyncHistory e ActivityLog acumulam milhões de registros sem rotina de purga ou particionamento, degradando performance.

## Arquivo(s) envolvido(s)
- src/services/retentionPurge.service.ts:120-165
- scripts/db/archive-old-logs.sql

## Evidência
Base de auditoria: DIVIDAS-AGENTE-01A.md e DIVIDAS-AGENTE-23.md.
- retentionPurge.service.ts executa deletes massivos em batch na mesma tabela de produção durante o dia, gerando lock de páginas.
- Causa Raiz: Ausência de particionamento mensal no PostgreSQL para tabelas de eventos.

## Alteração necessária
1. Criar estratégia de purga assíncrona noturna com índices parciais ou suporte a particionamento por data.
2. Definir políticas de retenção estritas por tenant em retentionPurge.service.ts (ex: 90 dias padrão para AILog).

## Teste esperado
- Critério de Aceite: Rotina de purga apaga logs antigos sem travar inserções concorrentes.
- Teste de Carga/Simulação: retention-purge-load.spec.ts.

## Contexto adicional
Estabilidade a longo prazo da base relacional.
