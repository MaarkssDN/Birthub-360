De: 02 — Produto e UX
Para: 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: normal
Bloqueador-ref: DIV-AGENTE-02-001
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Problema
Atualização de módulos habilitados da organização em organizationModules.service.ts sofre de race condition com múltiplos administradores.

## Arquivo(s) envolvido(s)
- src/services/organizationModules.service.ts:85-110
- prisma/schema.prisma:180-205

## Evidência
Base de auditoria: DIVIDAS-AGENTE-02.md.
- organizationModules.service.ts (L85-110): Executa findUnique e depois update sem controle de versão otimista (optimistic locking / CAS) nem lock pessimista.
- Submissões concorrentes sobrescrevem configurações anteriores sem aviso.
- Causa Raiz: Ausência de campo version nos metadados de configuração.

## Alteração necessária
1. Implementar lock transacional ou verificação de versão (CAS) no update de organizationModules.
2. Retornar HTTP 409 Conflict se a versão enviada pelo frontend diferir da versão atual no banco.

## Teste esperado
- Critério de Aceite: Duas requisições simultâneas com mesmo payload base resultam em uma aprovada e uma 409 Conflict.
- Teste de Concorrência: organizationModules-concurrency.spec.ts.

## Contexto adicional
Necessário para proteger integridade das configurações multi-módulo.
