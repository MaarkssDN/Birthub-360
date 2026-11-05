De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-21-001 (B-13)
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Problema
Serviço de exclusão de dados do titular (dataSubjectErasure.service.ts) realiza exclusões em cascata manuais fora de uma transação Prisma, deixando registros órfãos em caso de falha parcial.

## Arquivo(s) envolvido(s)
- src/services/dataSubjectErasure.service.ts:115-165
- prisma/schema.prisma:310-350

## Evidência
Base de auditoria: DIVIDAS-AGENTE-21.md.
- dataSubjectErasure.service.ts (L115-165): Deleta registros em Lead, Contact, ActivityLog de forma sequencial sem prisma.$transaction. Falha na terceira chamada aborta o processo e deixa dados pessoais ativos.
- Violação direta do AGENTS.md §22 (B-13: Tratamento de dados pessoais sem conformidade) e LGPD Artigo 18.
- Causa Raiz: Orquestração manual sem garantia ACID de expurgo.

## Alteração necessária
1. Envolver toda a rotina de exclusão ou anonimização em prisma.$transaction([ ... ]).
2. Adicionar registro de auditoria imutável (sem PII) comprovando data, hora e hash do titular expurgado.
3. Tratar deleção de chaves no Redis/Cache associadas ao titular.

## Teste esperado
- Critério de Aceite: Expurgo ocorre com 100% de sucesso atômico ou sofre rollback completo sem órfãos.
- Teste de Integração: erasure-transaction-rollback.spec.ts simulando erro no meio do fluxo.

## Contexto adicional
Requisito regulatório de conformidade jurídica da LGPD.
