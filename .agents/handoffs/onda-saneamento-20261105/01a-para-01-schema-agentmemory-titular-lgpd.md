De: 01A — Confiabilidade de Dados, RLS e Retenção
Para: 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-01A-001 (B-13)
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Resolução
- Adicionado campo `contactId String?` ao model `AgentMemory` no `prisma/schema.prisma` com índice composto `@@index([organizationId, contactId])`.
- Criada e executada a migration `prisma/migrations/20261106140000_add_contact_id_to_agent_memory/migration.sql` através do papel de autoridade DDL `prospector_migrator`.
- `npm run verify:migration-drift` validado com sucesso (`No difference detected`).
- Atualizado `src/features/intelligence/agents/agentMemory.store.ts` para suportar `contactId` no input, create e update do upsert atômico.
- Testes unitários atualizados em `src/features/intelligence/agents/__tests__/agentMemory.store.test.ts` (12/12 aprovados).

## Problema
Tabela AgentMemory armazena contexto de IA com dados de contato/lead em campo JSON livre sem chave estrangeira ou coluna indexada de titular.

## Arquivo(s) envolvido(s)
- prisma/schema.prisma:420-445
- prisma/migrations/

## Evidência
Base de auditoria: DIVIDAS-AGENTE-01A.md e DIVIDAS-AGENTE-13.md.
- prisma/schema.prisma (L420-445): Model AgentMemory possui campos sessionId, organizationId e payload JSON, mas carece de contactId opcional indexado.
- Impossibilita queries eficientes de portabilidade e expurgo do titular na memória dos agentes.
- Causa Raiz: Modelagem focada apenas na sessão de conversação.

## Alteração necessária
1. Adicionar campo contactId String? no model AgentMemory com índice @@index([organizationId, contactId]).
2. Criar migration Prisma segura: add_contact_id_to_agent_memory.
3. Atualizar o memory.service.ts para popular contactId sempre que o diálogo for associado a um lead/contato.

## Teste esperado
- Critério de Aceite: Migration executa limpa e contactId pode ser consultado indexadamente.
- Teste: npx prisma migrate status e teste unitário em memory.service.spec.ts.

## Contexto adicional
Handoff de schema exclusivo para o Agente 01 conforme AGENTS.md §15.
