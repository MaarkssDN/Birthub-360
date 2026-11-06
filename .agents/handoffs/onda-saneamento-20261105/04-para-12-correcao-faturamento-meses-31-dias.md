De: 04 â€” CRM e BI
Para: 12 â€” Voz e Telefonia
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-04-001
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
CÃ¡lculo de faturamento e tarifaÃ§Ã£o de minutos de telefonia (billing.service.ts) usa incremento ingÃªnuo de 30 dias para fechar faturas, gerando defasagem em meses com 31 ou 28 dias.

## Arquivo(s) envolvido(s)
- src/services/telephony/billing.service.ts:95-135

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-04.md e DIVIDAS-AGENTE-12.md.
- billing.service.ts (L95-135): Utiliza new Date(timestamp + 30 * 86400000) em vez de date-fns/addMonths ou cÃ¡lculo alinhado ao dia de vencimento contratual.
- Provoca cobranÃ§as duplicadas ou dias nÃ£o faturados em ciclos anuais.

## AlteraÃ§Ã£o necessÃ¡ria
1. Refatorar cÃ¡lculo de faturamento em billing.service.ts para utilizar date-fns/addMonths respeitando fuso horÃ¡rio e dia de corte cadastrado.
2. Adicionar testes para anos bissextos e transiÃ§Ã£o de meses com 28/30/31 dias.

## Teste esperado
- CritÃ©rio de Aceite: Ciclo de fatura iniciado em 31 de janeiro fecha corretamente no Ãºltimo dia de fevereiro e no dia 31 de marÃ§o.
- Teste: billing-cycles-accuracy.spec.ts.

## Contexto adicional
PrecisÃ£o financeira e prevenÃ§Ã£o de disputas de cobranÃ§a.


## Resolucao
- Data: 2026-11-06.
- Implementado TelephonyBillingService em src/services/telephony/billing.service.ts com calculo de calendario exato baseado no dia de corte contratual, ajustando fechamentos de meses com 28, 29, 30 e 31 dias.
- Testes: 	ests/unit/services/telephony/billing-cycles-accuracy.test.ts (3 passam).

