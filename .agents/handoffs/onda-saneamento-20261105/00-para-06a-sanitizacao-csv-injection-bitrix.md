De: 00 — Coordenador
Para: 06A — Extrações Bitrix
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-06A-001 (B-04)
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Exportador de relatórios e dados do Bitrix para CSV/Excel (exportFormatter.service.ts) não sanitiza caracteres que iniciam fórmulas (=, +, -, @), permitindo CSV Injection.

## Arquivo(s) envolvido(s)
- src/services/bitrix/exportFormatter.service.ts:50-85

## Evidência
Base de auditoria: DIVIDAS-AGENTE-06A.md.
- exportFormatter.service.ts (L50-85): Concatena strings vindas de campos customizados do Bitrix diretamente nas células CSV sem prefixar apóstrofo em valores com fórmulas.
- Risco de execução de código remoto em planilhas abertas por administradores com dados de leads maliciosos.
- Causa Raiz: Formatação simples via split/join sem sanitizador de CSV.

## Alteração necessária
1. Implementar função de sanitização de CSV que adiciona aspas e prefixa apóstrofo (') em qualquer célula iniciando com =, +, -, @, \t ou \r.
2. Garantir encode correto em UTF-8 com BOM para compatibilidade com Microsoft Excel.

## Teste esperado
- Critério de Aceite: Campo com valor =CMD|'/C calc'!A0 é formatado como "'=CMD|'/C calc'!A0" sem execução no Excel.
- Teste Unitário: exportFormatter-csv-injection.spec.ts.

## Contexto adicional
Segurança em exportações operacionais.
