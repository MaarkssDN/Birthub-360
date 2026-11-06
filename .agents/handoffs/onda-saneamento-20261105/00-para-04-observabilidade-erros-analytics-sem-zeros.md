De: 00 â€” Coordenador
Para: 04 â€” CRM e BI
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-04-002 (B-06)
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
ServiÃ§o de anÃ¡lise de dados (analytics.service.ts) captura exceÃ§Ãµes de agregaÃ§Ã£o de banco e retorna objetos com valores numÃ©ricos zerados ({ total: 0, revenue: 0 }), mascarando falhas reais.

## Arquivo(s) envolvido(s)
- src/services/analytics.service.ts:145-185

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-04.md.
- analytics.service.ts (L145-185): Bloco catch captura erro de timeout ou syntax do PostgreSQL e retorna fallback de zeros sem logar erro crÃ­tico.
- Administradores concluem que faturamento ou leads sÃ£o zero quando na verdade o banco de dados falhou.
- ViolaÃ§Ã£o de AGENTS.md Â§22 (B-06) e Â§25.

## AlteraÃ§Ã£o necessÃ¡ria
1. Eliminar retornos mascarados de zeros em falhas de banco.
2. Propagar erro observÃ¡vel ou retornar payload explÃ­cito: { status: 'error', code: 'DATABASE_TIMEOUT' } para que o frontend exiba tela de estado de erro em vez de grÃ¡fico vazio.

## Teste esperado
- CritÃ©rio de Aceite: Falha no banco resulta em estado de erro observÃ¡vel na API e na interface.
- Teste: analytics-error-observability.spec.ts.

## Contexto adicional
Verdade operacional em relatÃ³rios executivos de BI.


## Resolucao
- Data: 2026-11-06.
- Implementado AnalyticsService em src/services/analytics.service.ts eliminando o retorno cenografico de zeros { total: 0, revenue: 0 } em falhas de banco e propagando status de erro observavel { status: 'error', code: 'DATABASE_TIMEOUT' }.
- Testes: 	ests/unit/services/analytics/analytics-error-observability.test.ts (2 passam).

