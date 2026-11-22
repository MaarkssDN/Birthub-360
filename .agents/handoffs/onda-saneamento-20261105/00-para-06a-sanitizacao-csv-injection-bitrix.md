De: 00 â€” Coordenador
Para: 06A â€” ExtraÃ§Ãµes Bitrix
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-06A-001 (B-04)
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
Exportador de relatÃ³rios e dados do Bitrix para CSV/Excel (exportFormatter.service.ts) nÃ£o sanitiza caracteres que iniciam fÃ³rmulas (=, +, -, @), permitindo CSV Injection.

## Arquivo(s) envolvido(s)
- src/services/bitrix/exportFormatter.service.ts:50-85

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-06A.md.
- exportFormatter.service.ts (L50-85): Concatena strings vindas de campos customizados do Bitrix diretamente nas cÃ©lulas CSV sem prefixar apÃ³strofo em valores com fÃ³rmulas.
- Risco de execuÃ§Ã£o de cÃ³digo remoto em planilhas abertas por administradores com dados de leads maliciosos.
- Causa Raiz: FormataÃ§Ã£o simples via split/join sem sanitizador de CSV.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar funÃ§Ã£o de sanitizaÃ§Ã£o de CSV que adiciona aspas e prefixa apÃ³strofo (') em qualquer cÃ©lula iniciando com =, +, -, @, \t ou \r.
2. Garantir encode correto em UTF-8 com BOM para compatibilidade com Microsoft Excel.

## Teste esperado
- CritÃ©rio de Aceite: Campo com valor =CMD|'/C calc'!A0 Ã© formatado como "'=CMD|'/C calc'!A0" sem execuÃ§Ã£o no Excel.
- Teste UnitÃ¡rio: exportFormatter-csv-injection.spec.ts.

## Contexto adicional
SeguranÃ§a em exportaÃ§Ãµes operacionais.


## Resolucao
- Data: 2026-11-06. sanitizeCsvCell/	oCsv (extractionFiles.ts) e exportacao de leads (LeadUseCases.ts) prefixam apostrofo em celulas iniciadas por =,+,-,@,TAB,CR, com escape RFC 4180.
- Wrapper em src/services/bitrix/exportFormatter.service.ts.
- Teste: tests/unit/services/bitrix/exportFormatter-csv-injection.test.ts (7 passam).

