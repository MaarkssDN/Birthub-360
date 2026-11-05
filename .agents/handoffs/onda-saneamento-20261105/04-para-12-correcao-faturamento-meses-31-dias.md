De: 04 — CRM e BI
Para: 12 — Voz e Telefonia
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-04-001
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Cálculo de faturamento e tarifação de minutos de telefonia (billing.service.ts) usa incremento ingênuo de 30 dias para fechar faturas, gerando defasagem em meses com 31 ou 28 dias.

## Arquivo(s) envolvido(s)
- src/services/telephony/billing.service.ts:95-135

## Evidência
Base de auditoria: DIVIDAS-AGENTE-04.md e DIVIDAS-AGENTE-12.md.
- billing.service.ts (L95-135): Utiliza new Date(timestamp + 30 * 86400000) em vez de date-fns/addMonths ou cálculo alinhado ao dia de vencimento contratual.
- Provoca cobranças duplicadas ou dias não faturados em ciclos anuais.

## Alteração necessária
1. Refatorar cálculo de faturamento em billing.service.ts para utilizar date-fns/addMonths respeitando fuso horário e dia de corte cadastrado.
2. Adicionar testes para anos bissextos e transição de meses com 28/30/31 dias.

## Teste esperado
- Critério de Aceite: Ciclo de fatura iniciado em 31 de janeiro fecha corretamente no último dia de fevereiro e no dia 31 de março.
- Teste: billing-cycles-accuracy.spec.ts.

## Contexto adicional
Precisão financeira e prevenção de disputas de cobrança.
