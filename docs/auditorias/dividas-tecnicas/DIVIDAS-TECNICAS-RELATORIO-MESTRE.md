# Relatório Mestre Consolidado de Dívidas Técnicas

## Visão Geral
- **Número de agentes previstos e avaliados:** 26
- **Número de relatórios produzidos:** 26
- **Total de dívidas únicas:** 43
- **Distribuição por severidade:** Crítica (1), Alta (19), Média (20), Baixa (3)
- **Dívidas compartilhadas:** Detalhadas na coluna 'Agentes dependentes' de cada relatório.
- **Riscos sistêmicos:** Segurança de Segredos e Integridade do Prisma Schema/Banco de dados.

## Matriz de Responsabilidades
| Agente | Dívidas | Críticas | Altas | Médias | Baixas | Dependências |
|--------|---------|----------|-------|--------|--------|--------------|
| 00 | 3 | 0 | 0 | 2 | 1 | Ver relatórios |
| 01 | 6 | 0 | 3 | 2 | 1 | Ver relatórios |
| 01A | 2 | 0 | 2 | 0 | 0 | Ver relatórios |
| 02 | 2 | 0 | 1 | 1 | 0 | Ver relatórios |
| 03 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 04 | 3 | 0 | 1 | 2 | 0 | Ver relatórios |
| 05 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 06 | 1 | 0 | 0 | 1 | 0 | Ver relatórios |
| 06A | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 07 | 5 | 0 | 3 | 2 | 0 | Ver relatórios |
| 08 | 4 | 0 | 1 | 3 | 0 | Ver relatórios |
| 08A | 1 | 0 | 0 | 1 | 0 | Ver relatórios |
| 09 | 4 | 0 | 1 | 3 | 0 | Ver relatórios |
| 10 | 2 | 0 | 1 | 1 | 0 | Ver relatórios |
| 11 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 12 | 1 | 0 | 0 | 0 | 1 | Ver relatórios |
| 13 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 14 | 1 | 0 | 1 | 0 | 0 | Ver relatórios |
| 15 | 2 | 1 | 1 | 0 | 0 | Ver relatórios |
| 16 | 3 | 0 | 3 | 0 | 0 | Ver relatórios |
| 17 | 1 | 0 | 0 | 1 | 0 | Ver relatórios |
| 18 | 1 | 0 | 1 | 0 | 0 | Ver relatórios |
| 21 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 22 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| 23 | 1 | 0 | 0 | 1 | 0 | Ver relatórios |
| 24 | 0 | 0 | 0 | 0 | 0 | Ver relatórios |
| **Todos os 26 agentes** | **43** | **1** | **19** | **20** | **3** | |


## Ranking de Prioridades
1. Segurança e exposição de dados (Crítica/P0).
2. Risco de perda ou corrupção de informação (Crítica/P0).
3. Quebra de funcionalidades essenciais (Alta/P1).
4. Risco de regressão sistêmica (Alta/P1).
5. Bloqueio de outros agentes.
6. Impacto operacional e Esforço (Média/Baixa).

## Plano de Correção por Ondas

**Onda 1:** Correções de Críticas (P0) e Banco de Dados
- **Agentes responsáveis:** 15, 01A
- **Dívidas atendidas:** Segredos e Migrations
- **Ordem de execução:** Imadiata

**Onda 2:** Funcionalidades Core, Autenticação e Monólitos
- **Agentes responsáveis:** 01, 02
- **Dívidas atendidas:** Lógica de Signup (redundâncias), Decomposição Arquitetural

**Onda 3:** Manutenção de Legados e Documentação
- **Agentes responsáveis:** 12, 00
- **Dívidas atendidas:** Billing Services Legados, Sincronização de Docs/Links

*Handoffs obrigatórios:* Consultar a seção de dependências em cada relatório individual para criação de handoffs.
