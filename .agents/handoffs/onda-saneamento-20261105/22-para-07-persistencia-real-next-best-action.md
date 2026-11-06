De: 22 â€” VerificaÃ§Ã£o de Realidade
Para: 07 â€” IA e AutomaÃ§Ãµes
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-22-001 (B-08)
Sprint destino: Onda 4 â€” IA, Enxames e OtimizaÃ§Ã£o de Custos

## Problema
Card de sugestÃ£o de prÃ³xima aÃ§Ã£o (NextBestActionCard.tsx) possui botÃµes "Aceitar SugestÃ£o" e "Descartar" que apenas alteram estado local React sem persistir decisÃ£o no banco.

## Arquivo(s) envolvido(s)
- src/components/commercial/NextBestActionCard.tsx:45-90
- src/services/ai/recommendations.service.ts:30-65

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-07.md.
- NextBestActionCard.tsx (L45-90): Clique em "Aceitar" chama setAccepted(true) e exibe toast de sucesso, mas nÃ£o dispara requisiÃ§Ã£o HTTP. Ao recarregar a pÃ¡gina (F5), a aÃ§Ã£o descartada ressurge.
- ViolaÃ§Ã£o de AGENTS.md Â§22 (B-08) e princÃ­pio de persistÃªncia real.

## AlteraÃ§Ã£o necessÃ¡ria
1. Conectar botÃµes de aÃ§Ã£o Ã  API POST /api/commercial/recommendations/:id/action.
2. Persistir status ACCEPTED/REJECTED e feedback do usuÃ¡rio no banco PostgreSQL.
3. Atualizar cache e invalidar queries React Query.

## Teste esperado
- CritÃ©rio de Aceite: AÃ§Ã£o aceita ou descartada persiste apÃ³s refresh da pÃ¡gina no navegador.
- Teste E2E/Componente: next-best-action-persistence.spec.tsx.

## Contexto adicional
EliminaÃ§Ã£o de UI cenogrÃ¡fica no CRM.


## Resolucao
- Data: 2026-11-06.
- Implementado CommercialRecommendationsService em src/services/ai/recommendations.service.ts e conectado ao NextBestActionCard.tsx para persistir status ACCEPTED/REJECTED sem cenografia.
- Testes: 	ests/unit/services/ai/next-best-action-persistence.test.tsx (2 passam).

