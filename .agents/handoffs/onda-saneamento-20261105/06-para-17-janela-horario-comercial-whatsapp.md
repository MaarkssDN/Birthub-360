De: 06 — Integrações e Bitrix
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-17-001
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Agendador de passos de cadência (stepScheduler.service.ts) agenda disparos de mensagens automáticas de WhatsApp fora do horário comercial (ex: madrugada e fins de semana).

## Arquivo(s) envolvido(s)
- src/services/cadence/stepScheduler.service.ts:110-155

## Evidência
Base de auditoria: DIVIDAS-AGENTE-17.md.
- stepScheduler.service.ts (L110-155): Calcula nextExecutionDate somando intervalo fixo em horas sem respeitar timezone do destinatário nem horários permitidos por lei.
- Gera alto índice de denúncias de spam e bloqueio de chips de WhatsApp.

## Alteração necessária
1. Implementar validador de janela de horário comercial (ex: 08:00 às 19:00 no timezone do lead) em stepScheduler.service.ts.
2. Adicionar postergação automática para o próximo dia útil às 09:00 caso o cálculo resulte em horário restrito.

## Teste esperado
- Critério de Aceite: Passo de cadência calculado para domingo às 23:00 é agendado para segunda-feira às 09:00.
- Teste: stepScheduler-business-hours.spec.ts.

## Contexto adicional
Proteção contra banimento de números no WhatsApp e respeito aos clientes.
