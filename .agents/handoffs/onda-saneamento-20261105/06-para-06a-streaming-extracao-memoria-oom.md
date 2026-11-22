De: 06 â€” IntegraÃ§Ãµes e Bitrix
Para: 06A â€” ExtraÃ§Ãµes Bitrix
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-06-001
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
ExtraÃ§Ã£o massiva de contatos do Bitrix24 (extraction.ts) acumula dezenas de milhares de objetos em memÃ³ria antes de persistir, arriscando OOM crash em contas grandes.

## Arquivo(s) envolvido(s)
- src/services/bitrix/extraction.ts:120-170

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-06.md e DIVIDAS-AGENTE-06A.md.
- extraction.ts (L120-170): Loop de paginaÃ§Ã£o faz array.push(...) de todos os leads extraÃ­dos e sÃ³ grava no final via batch insert, consumindo > 1GB de RAM em clientes com > 50k leads.
- Causa Raiz: AusÃªncia de streaming ou processamento em pipeline (Node.js Transform streams / generators).

## AlteraÃ§Ã£o necessÃ¡ria
1. Refatorar a extraÃ§Ã£o para usar async generators que buscam e persistem blocos de 500 registros por vez.
2. Liberar referÃªncias de memÃ³ria entre iteraÃ§Ãµes e registrar progresso em banco.

## Teste esperado
- CritÃ©rio de Aceite: ExtraÃ§Ã£o de 10.000 contatos simulados mantÃ©m consumo de heap estÃ¡vel abaixo de 150MB.
- Teste: extraction-stream-memory.spec.ts.

## Contexto adicional
Escalabilidade para clientes Enterprise.


## Resolucao
- Data: 2026-11-06.
- Implementado BitrixStreamingExtractionService em src/services/bitrix/extraction.ts com processamento em pipeline via async generator descarregando chunks de 500 registros sem reter memoria.
- Testes: 	ests/unit/services/bitrix/extraction-stream-memory.test.ts (10.000 contatos processados com heap bem abaixo do teto de 150MB).

