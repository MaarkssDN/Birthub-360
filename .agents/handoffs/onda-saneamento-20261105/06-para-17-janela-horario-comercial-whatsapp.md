De: 06 â€” IntegraÃ§Ãµes e Bitrix
Para: 17 â€” CadÃªncia Multicanal e Ciclo de Receita
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-17-001
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
Agendador de passos de cadÃªncia (stepScheduler.service.ts) agenda disparos de mensagens automÃ¡ticas de WhatsApp fora do horÃ¡rio comercial (ex: madrugada e fins de semana).

## Arquivo(s) envolvido(s)
- src/services/cadence/stepScheduler.service.ts:110-155

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-17.md.
- stepScheduler.service.ts (L110-155): Calcula nextExecutionDate somando intervalo fixo em horas sem respeitar timezone do destinatÃ¡rio nem horÃ¡rios permitidos por lei.
- Gera alto Ã­ndice de denÃºncias de spam e bloqueio de chips de WhatsApp.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar validador de janela de horÃ¡rio comercial (ex: 08:00 Ã s 19:00 no timezone do lead) em stepScheduler.service.ts.
2. Adicionar postergaÃ§Ã£o automÃ¡tica para o prÃ³ximo dia Ãºtil Ã s 09:00 caso o cÃ¡lculo resulte em horÃ¡rio restrito.

## Teste esperado
- CritÃ©rio de Aceite: Passo de cadÃªncia calculado para domingo Ã s 23:00 Ã© agendado para segunda-feira Ã s 09:00.
- Teste: stepScheduler-business-hours.spec.ts.

## Contexto adicional
ProteÃ§Ã£o contra banimento de nÃºmeros no WhatsApp e respeito aos clientes.


## Resolucao
- Data: 2026-11-06.
- Implementado CadenceStepSchedulerService em src/services/cadence/stepScheduler.service.ts com validacao de janela de horario comercial (08h as 19h) e postergacao automatica para o proximo dia util as 09:00.
- Testes: 	ests/unit/services/cadence/stepScheduler-business-hours.test.ts (3 passam).

