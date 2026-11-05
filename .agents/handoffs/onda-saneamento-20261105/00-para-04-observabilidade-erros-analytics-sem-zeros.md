De: 00 — Coordenador
Para: 04 — CRM e BI
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-04-002 (B-06)
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Serviço de análise de dados (analytics.service.ts) captura exceções de agregação de banco e retorna objetos com valores numéricos zerados ({ total: 0, revenue: 0 }), mascarando falhas reais.

## Arquivo(s) envolvido(s)
- src/services/analytics.service.ts:145-185

## Evidência
Base de auditoria: DIVIDAS-AGENTE-04.md.
- analytics.service.ts (L145-185): Bloco catch captura erro de timeout ou syntax do PostgreSQL e retorna fallback de zeros sem logar erro crítico.
- Administradores concluem que faturamento ou leads são zero quando na verdade o banco de dados falhou.
- Violação de AGENTS.md §22 (B-06) e §25.

## Alteração necessária
1. Eliminar retornos mascarados de zeros em falhas de banco.
2. Propagar erro observável ou retornar payload explícito: { status: 'error', code: 'DATABASE_TIMEOUT' } para que o frontend exiba tela de estado de erro em vez de gráfico vazio.

## Teste esperado
- Critério de Aceite: Falha no banco resulta em estado de erro observável na API e na interface.
- Teste: analytics-error-observability.spec.ts.

## Contexto adicional
Verdade operacional em relatórios executivos de BI.
