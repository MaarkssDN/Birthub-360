# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 01A
- **Nome oficial:** Confiabilidade de Dados, RLS e Retenção
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é o especialista interno do **Agente 01** para integridade de dados, Row Level Security e política de retenção. Você ocupa **o mesmo slot do 01** — os dois nunca rodam ao mesmo tempo, pelo mesmo motivo que 06 e 06A não rodam juntos: `prisma/schema.prisma` e `prisma/migrations/**` têm dono exclusivo, e dois agentes editando schema em paralelo é a forma mais rápida de corromper uma onda.  Seu foco não é ampliar o modelo de dados. É provar que a proteção de dados que este projeto **afirma ter** realmente funciona quando executada.  **Atualização de 2026-08-15 — leia antes de tudo:** o item 1 abaixo (RLS do `AILog`) foi **fechado** nesta data, fora do ciclo formal de onda, com execução real (`5/5` em `ailog-rls.test.ts` isolado, `48/48` na suíte completa de integração contra Postgres real). O handoff `.agents/handoffs/onda-2/00-para-01-ailog-rls-violation.md` tem uma seção nova, "
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-LGPD-002
**Título:** Memória de agentes (AgentMemory) não pode ser localizada por titular para exclusão individual LGPD
- **Categoria:** Segurança e privacidade
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** prisma/schema.prisma (linhas 1766-1782), src/features/intelligence/agents/agentMemory.store.ts (linh
- **Evidência:** prisma/schema.prisma (linhas 1766-1782), src/features/intelligence/agents/agentMemory.store.ts (linhas 75-95), src/shared/services/dataSubjectErasure.service.ts (linhas 78-114)
- **Problema:** O modelo AgentMemory armazena histórico conversacional em JSON (messages) escopado apenas por organizationId e sessionId, sem chave estrangeira ou índice para contactId/leadId. Embora exista retenção temporal de 90 dias (AGENT_MEMORY_RETENTION_DAYS), eraseDataSubject não consegue localizar memórias de um titular específico antes do expurgo temporal.
- **Causa raiz:** Modelagem inicial de memória episódica de agentes orientada apenas a sessão, sem rastreabilidade de proveniência por titular de dados.
- **Impacto:** Se mensagens persistidas em AgentMemory contiverem dados pessoais do lead/contato, o atendimento imediato ao direito de exclusão (Art. 18 LGPD) fica incompleto até o ciclo do worker de retenção.
- **Correção necessária:** Adicionar vínculo opcional indexado (contactId/leadId) em AgentMemory via migration, propagar identificadores nos produtores do Agente 07 e incluir deleção/redação em eraseDataSubject.
- **Agente proprietário:** 01A
- **Agentes dependentes:** 01A, 01, 07, 21, 00 Migration de schema pelo Agente 01/01A, Atualização dos produtores de memória pelo Agente 07, Validação LGPD pelo Agente 21
- **Complexidade:** M (1–3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Ao executar eraseDataSubject para um contactId/leadId, todas as entradas associadas em AgentMemory são expurgadas ou redigidas na mesma transação.
- **Teste necessário:** Teste de integração criando AgentMemory vinculada a contato e verificando remoção após eraseDataSubject, Preservação de memórias de outros titulares do mesmo tenant
- **Dependências:** Migration de schema pelo Agente 01/01A, Atualização dos produtores de memória pelo Agente 07, Validação LGPD pelo Agente 21

### ID: DEBT-DB-001
**Título:** Migrations Potencialmente Destrutivas (DROP tables/columns)
- **Categoria:** Migrations
- **Severidade:** Alta
- **Status:** Confirmado
- **Localização:** prisma/migrations/20260717141021_add_lead_enrichment
- **Evidência:** prisma/migrations/20260717141021_add_lead_enrichment
- **Problema:** Múltiplas migrations incluem instruções ALTER TABLE DROP ou DROP TABLE.
- **Causa raiz:** Não utilização do padrão Expand/Contract.
- **Impacto:** Pode deletar dados críticos irreversivelmente na atualização.
- **Correção necessária:** Revisar as migrations aplicadas, se não rodou, corrigir para expand/contract.
- **Agente proprietário:** 01A
- **Agentes dependentes:** 01, 15
- **Complexidade:** G
- **Prioridade:** P1
- **Critério de aceite:** Migrations não destrutivas garantidas no checklist.
- **Teste necessário:** Testes de migração em staging
- **Dependências:**


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 2
- **Quantidade confirmada:** 2
- **Riscos mais importantes:** Memória de agentes (AgentMemory) não pode ser localizada por titular para exclusão individual LGPD; Migrations Potencialmente Destrutivas (DROP tables/columns)
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
