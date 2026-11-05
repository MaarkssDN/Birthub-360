De: 00 — Coordenador
Para: 07 — IA e Automações
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-07-001 (B-06)
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Tela de workspace do agente comercial (EliteCommercialAgentWorkspace.tsx) exibe KPIs de conversão e assertividade de IA fixos no código (hardcoded mock), simulando dados reais.

## Arquivo(s) envolvido(s)
- src/pages/EliteCommercialAgentWorkspace.tsx:180-225

## Evidência
Base de auditoria: DIVIDAS-AGENTE-07.md e DIVIDAS-AGENTE-22.md.
- EliteCommercialAgentWorkspace.tsx (L180-225): Valores como "Assertividade: 94.8%" e "Tempo de resposta: 1.2s" estão mockados em objetos JavaScript locais sem chamada à API.
- Violação frontal de AGENTS.md §22 (B-06: Dados fictícios misturados com dados reais) e §25 (Dados reais e demonstração).

## Alteração necessária
1. Substituir valores mockados por hook useCommercialAgentMetrics() consultando backend real.
2. Tratar estados obrigatórios: loading, empty (sem chamadas suficientes), error e dados reais calculados sobre AILog.

## Teste esperado
- Critério de Aceite: Nenhuma métrica comercial fabricada no código; exibe placeholder de estado vazio se não houver histórico.
- Teste de Componente: EliteCommercialAgentWorkspace.spec.tsx.

## Contexto adicional
Transparência de métricas e verdade operacional.
