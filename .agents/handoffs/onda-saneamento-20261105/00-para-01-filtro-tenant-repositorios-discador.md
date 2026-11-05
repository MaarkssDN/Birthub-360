De: 00 — Coordenador
Para: 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-01-001 (B-10)
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Problema
Consultas SQL e Prisma nos repositórios do discador (PgCampaignRepository e PgLeadRepository) realizam leituras sem cláusula WHERE organizationId obrigatória.

## Arquivo(s) envolvido(s)
- src/infrastructure/repositories/dialer/PgCampaignRepository.ts:45-78
- src/infrastructure/repositories/dialer/PgLeadRepository.ts:60-95

## Evidência
Base de auditoria: DIVIDAS-AGENTE-01.md e DIVIDAS-AGENTE-01A.md.
- PgCampaignRepository.ts (L45-78): Busca de campanhas ativas para o discador consulta status = 'ACTIVE' sem filtrar organizationId.
- PgLeadRepository.ts (L60-95): Métodos de reserva de lotes de discagem executam UPDATE sem scoping por tenant.
- Violação direta de AGENTS.md §22 (B-10: Separação visual sem isolamento real de dados) e §26 (Tenancy).
- Causa Raiz: Discador foi prototipado como processo single-tenant e integrado ao monorepo sem injeção de TenantContext.

## Alteração necessária
1. Modificar todas as assinaturas de métodos nos repositórios do discador para exigir organizationId como primeiro argumento obrigatório.
2. Injetar organizationId nas queries SQL/Prisma e adicionar índice composto (organizationId, status) se necessário.
3. Atualizar chamadas nos services e workers correspondentes.

## Teste esperado
- Critério de Aceite: Nenhuma campanha ou lead de um tenant A pode ser selecionada ou modificada pelo tenant B.
- Teste de Integração: dialer-tenancy-isolation.spec.ts com duas organizações simultâneas.

## Contexto adicional
Bloqueador P0 de Tenancy com impacto direto na conformidade e privacidade.
