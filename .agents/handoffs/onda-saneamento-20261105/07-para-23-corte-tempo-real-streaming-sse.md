De: 07 â€” IA e AutomaÃ§Ãµes
Para: 23 â€” Custo, Performance e Limites de IA
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-23-001
Sprint destino: Onda 4 â€” IA, Enxames e OtimizaÃ§Ã£o de Custos

## Problema
Streaming de respostas de IA (aiStream.service.ts) sÃ³ contabiliza e valida saldo de tokens apÃ³s a finalizaÃ§Ã£o completa da resposta, permitindo que usuÃ¡rios sem saldo consumam tokens em streaming longo.

## Arquivo(s) envolvido(s)
- src/services/ai/aiStream.service.ts:130-180

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-23.md.
- aiStream.service.ts (L130-180): VerificaÃ§Ã£o de cota ocorre no inÃ­cio (se saldo > 0). Respostas de 4000 tokens continuam gerando mesmo se a cota do tenant expirar durante a geraÃ§Ã£o.
- Causa Raiz: Falta de hook de interrupÃ§Ã£o no chunk processor de streaming.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar contador de tokens aproximado por chunks recebidos.
2. Abortar a chamada da API (via AbortController) se o limite estrito do tenant for atingido no meio do stream.

## Teste esperado
- CritÃ©rio de Aceite: GeraÃ§Ã£o de texto Ã© cortada com mensagem CotaExcedida assim que o limite de tokens da organizaÃ§Ã£o Ã© ultrapassado.
- Teste: aiStream-quota-abort.spec.ts.

## Contexto adicional
ProteÃ§Ã£o financeira contra estouro de limites de API da OpenAI/Anthropic.


## Resolucao
- Data: 2026-11-06.
- Implementado AiStreamService em src/services/ai/aiStream.service.ts com verificacao cumulativa de tokens em tempo de voo e cancelamento imediato via AbortController com emissao de QuotaExceededError (CotaExcedida).
- Testes: 	ests/unit/services/ai/aiStream-quota-abort.test.ts (1 passa).

