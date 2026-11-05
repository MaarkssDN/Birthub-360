De: 06 — Integrações e Bitrix
Para: 06A — Extrações Bitrix
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-06-001
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Extração massiva de contatos do Bitrix24 (extraction.ts) acumula dezenas de milhares de objetos em memória antes de persistir, arriscando OOM crash em contas grandes.

## Arquivo(s) envolvido(s)
- src/services/bitrix/extraction.ts:120-170

## Evidência
Base de auditoria: DIVIDAS-AGENTE-06.md e DIVIDAS-AGENTE-06A.md.
- extraction.ts (L120-170): Loop de paginação faz array.push(...) de todos os leads extraídos e só grava no final via batch insert, consumindo > 1GB de RAM em clientes com > 50k leads.
- Causa Raiz: Ausência de streaming ou processamento em pipeline (Node.js Transform streams / generators).

## Alteração necessária
1. Refatorar a extração para usar async generators que buscam e persistem blocos de 500 registros por vez.
2. Liberar referências de memória entre iterações e registrar progresso em banco.

## Teste esperado
- Critério de Aceite: Extração de 10.000 contatos simulados mantém consumo de heap estável abaixo de 150MB.
- Teste: extraction-stream-memory.spec.ts.

## Contexto adicional
Escalabilidade para clientes Enterprise.
