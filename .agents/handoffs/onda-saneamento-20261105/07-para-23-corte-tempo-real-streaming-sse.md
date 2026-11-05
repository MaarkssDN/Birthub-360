De: 07 — IA e Automações
Para: 23 — Custo, Performance e Limites de IA
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-23-001
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Streaming de respostas de IA (aiStream.service.ts) só contabiliza e valida saldo de tokens após a finalização completa da resposta, permitindo que usuários sem saldo consumam tokens em streaming longo.

## Arquivo(s) envolvido(s)
- src/services/ai/aiStream.service.ts:130-180

## Evidência
Base de auditoria: DIVIDAS-AGENTE-23.md.
- aiStream.service.ts (L130-180): Verificação de cota ocorre no início (se saldo > 0). Respostas de 4000 tokens continuam gerando mesmo se a cota do tenant expirar durante a geração.
- Causa Raiz: Falta de hook de interrupção no chunk processor de streaming.

## Alteração necessária
1. Implementar contador de tokens aproximado por chunks recebidos.
2. Abortar a chamada da API (via AbortController) se o limite estrito do tenant for atingido no meio do stream.

## Teste esperado
- Critério de Aceite: Geração de texto é cortada com mensagem CotaExcedida assim que o limite de tokens da organização é ultrapassado.
- Teste: aiStream-quota-abort.spec.ts.

## Contexto adicional
Proteção financeira contra estouro de limites de API da OpenAI/Anthropic.
