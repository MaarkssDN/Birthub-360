const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('.agents/handoffs/onda-saneamento-20261105');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const handoffs = [
  // --- ONDA 0: BLOQUEADORES CRÍTICOS E GATES (P0) ---
  {
    fileName: '00-para-15-mascaramento-tokens-auth.md',
    de: '00 — Coordenador',
    para: '15 — Segurança Aplicada e Rotação de Segredos',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-15-001 (B-04)',
    sprintDestino: 'Onda 0 — Bloqueadores Críticos e Gates',
    problema: 'Vazamento potencial de tokens de autenticação (JWT/OAuth) e segredos em logs de erro e stack traces na camada de autenticação.',
    arquivos: [
      'src/services/auth.service.ts:210-235',
      'src/lib/logger.ts:45-80'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-15.md e DIVIDAS-AGENTE-00.md.
- src/services/auth.service.ts (L210-235): Tratamento de exceção em login/refresh serializa err.context ou tokens em logs sem sanitização central.
- Violação direta do AGENTS.md §22 (B-04: Credenciais armazenadas/logadas sem proteção) e §24 (Segurança e higiene de logs).
- Causa Raiz: Interceptadores e blocos catch capturam objetos AxiosError/AuthResponse contendo headers Authorization e payload sem passar pelo sanitizer.`,
    alteracao: `1. Implementar sanitização obrigatória e mascaramento de regex para tokens Bearer, senhas e refresh tokens em src/services/auth.service.ts.
2. Integrar src/lib/logger.ts para aplicar redaction automática em qualquer chave que corresponda a ['token', 'password', 'secret', 'authorization', 'credential'].
3. Garantir que stack traces não contenham query params sensíveis nem bodies decodificados.`,
    teste: `- Critério de Aceite: Nenhuma string correspondente a token JWT ou segredo aparece nos logs após falha de autenticação.
- Teste Unitário: auth.service.spec.ts simulando login inválido e conferindo saída do logger mockado.
- Varredura de segredos limpa sem achados positivos.`,
    contexto: 'Handoff gerado a partir do Plano de Saneamento de Dívidas Técnicas. Correção prioritária para fechamento do Gate da Onda 0.'
  },
  {
    fileName: '00-para-08-blindagem-release-gate.md',
    de: '00 — Coordenador',
    para: '08 — QA e Release',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-08-001 (B-05)',
    sprintDestino: 'Onda 0 — Bloqueadores Críticos e Gates',
    problema: 'Release gate script (release-gate.js) permite prosseguimento com avisos não bloqueantes em migrações pendentes ou falhas silenciosas de schema.',
    arquivos: [
      'scripts/release-gate.js:38-65',
      'scripts/verify-schema-sync.ts:20-55'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-08.md e DIVIDAS-AGENTE-00.md.
- scripts/release-gate.js (L38-65): Validação de migrations do Prisma emite console.warn mas não encerra o processo com exit code != 0 quando há drift não aplicado em ambiente de staging.
- Violação direta de AGENTS.md §22 (B-05: Deploy capaz de iniciar sem migrações) e §28 (Gate obrigatório).
- Causa Raiz: Tratamento permissivo implementado para acomodar fluxos manuais de desenvolvimento local.`,
    alteracao: `1. Modificar scripts/release-gate.js para abortar imediatamente com process.exit(1) se npx prisma migrate status detectar migrações pendentes ou drift.
2. Adicionar verificação obrigatória de integridade do build e bloqueio estrito contra branches desatualizadas com a base de integração.
3. Impedir que qualquer flag --force ou bypass silencie a verificação em pipelines de produção.`,
    teste: `- Critério de Aceite: scripts/release-gate.js falha categoricamente com exit code 1 na presença de qualquer migração não aplicada.
- Teste de Integração: scripts/test/release-gate.spec.ts validando cenários de banco limpo, banco atrasado e banco atualizado.`,
    contexto: 'Bloqueador fundamental para mitigar risco de indisponibilidade em deploys automáticos.'
  },
  {
    fileName: '00-para-08a-gatilho-ghcr-docker-publish.md',
    de: '00 — Coordenador',
    para: '08A — Operações Git e Deploy AWS',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'normal',
    bloqueadorRef: 'DIV-AGENTE-08A-001',
    sprintDestino: 'Onda 0 — Bloqueadores Críticos e Gates',
    problema: 'Workflow docker-publish.yml dispara builds e publicação no GHCR em commits na main sem validação prévia do release-gate e sem tagging semântico.',
    arquivos: [
      '.github/workflows/docker-publish.yml:11-35'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-08A.md.
- .github/workflows/docker-publish.yml (L11-35): Gatilho push na branch main compila e envia imagem Docker mesmo se os testes de integração do workflow ci.yml estiverem em execução ou falharem.
- Causa Raiz: Workflows desacoplados sem dependência de status check ou job dependency (workflow_run).`,
    alteracao: `1. Configurar docker-publish.yml para ser acionado apenas via workflow_run após conclusão bem-sucedida do CI ou via publicação de release/tag semântica (v*.*.*).
2. Adicionar step prévio de verificação de aprovação do Agente 24 antes da emissão da tag Docker para produção.`,
    teste: `- Critério de Aceite: Push na main não publica imagem Docker sem aprovação explícita do job de CI.
- Teste de Workflow: Execução de dry-run de action com validação de condicional de trigger.`,
    contexto: 'Garante conformidade com o pipeline de CD estabelecido no AGENTS.md §21.'
  },
  {
    fileName: '00-para-24-reconciliacao-handoffs-historicos.md',
    de: '00 — Coordenador',
    para: '24 — Revisão Independente',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'normal',
    bloqueadorRef: 'DIV-AGENTE-00-001',
    sprintDestino: 'Onda 0 — Bloqueadores Críticos e Gates',
    problema: 'Presença de 11 handoffs históricos com status contraditório ou referências a artefatos obsoletos gerando drift na governança.',
    arquivos: [
      '.agents/handoffs/onda-10.1-p0-seguranca/',
      '.agents/handoffs/onda-dividas-20261014/',
      '.agents/reviews/'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-00.md e DIVIDAS-AGENTE-24.md.
- Mapeados handoffs marcados como abertos enquanto o código correspondente já foi mesclado, e outros com status resolvido sem parecer do Agente 24 correspondente arquivado.
- Causa Raiz: Acúmulo de ciclos rápidos sem script de reconciliação de estado.`,
    alteracao: `1. Auditar e reconciliar o status de cada handoff histórico em .agents/handoffs/.
2. Gerar parecer de encerramento para handoffs concluídos com verificação física de código.
3. Atualizar o checklist mestre de handoffs do repositório.`,
    teste: `- Critério de Aceite: Script scripts/verify-handoffs.js reporta 100% de consistência sem órfãos ou contradições.`,
    contexto: 'Restaura a autoridade do histórico operacional do repositório.'
  },
  {
    fileName: '24-para-08a-trava-ci-aprovacao-revisao.md',
    de: '24 — Revisão Independente',
    para: '08A — Operações Git e Deploy AWS',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-24-001',
    sprintDestino: 'Onda 0 — Bloqueadores Críticos e Gates',
    problema: 'Ausência de checagem automatizada no CI para barrar PRs que não contenham parecer APROVADO do Agente 24 em .agents/reviews/.',
    arquivos: [
      '.github/workflows/ci.yml:180-210',
      'scripts/ci/check-independent-review.js'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-24.md.
- AGENTS.md §3 (Roster oficial) e §32 (Definição de pronto) exigem estritamente parecer APROVADO do Agente 24 para conclusão.
- O workflow ci.yml atual valida lint, typecheck e testes, mas não executa script de validação de parecer do 24.
- Causa Raiz: Governança documental mantida apenas como convenção sem enforcement no pipeline.`,
    alteracao: `1. Criar script scripts/ci/check-independent-review.js que valida a presença e validade do arquivo de revisão do 24 correspondente ao diff do PR.
2. Incluir step obrigatório no ci.yml executando esta verificação antes da autorização de merge.`,
    teste: `- Critério de Aceite: CI falha se o branch sob teste não contiver o parecer de revisão assinado pelo Agente 24.`,
    contexto: 'Enforcement programático da governança de revisão independente.'
  },

  // --- ONDA 1: SEGURANÇA, SCHEMA, TENANCY E LGPD (P1) ---
  {
    fileName: '00-para-01-filtro-tenant-repositorios-discador.md',
    de: '00 — Coordenador',
    para: '01 — Plataforma, Segurança e Dados',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-01-001 (B-10)',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Consultas SQL e Prisma nos repositórios do discador (PgCampaignRepository e PgLeadRepository) realizam leituras sem cláusula WHERE organizationId obrigatória.',
    arquivos: [
      'src/infrastructure/repositories/dialer/PgCampaignRepository.ts:45-78',
      'src/infrastructure/repositories/dialer/PgLeadRepository.ts:60-95'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-01.md e DIVIDAS-AGENTE-01A.md.
- PgCampaignRepository.ts (L45-78): Busca de campanhas ativas para o discador consulta status = 'ACTIVE' sem filtrar organizationId.
- PgLeadRepository.ts (L60-95): Métodos de reserva de lotes de discagem executam UPDATE sem scoping por tenant.
- Violação direta de AGENTS.md §22 (B-10: Separação visual sem isolamento real de dados) e §26 (Tenancy).
- Causa Raiz: Discador foi prototipado como processo single-tenant e integrado ao monorepo sem injeção de TenantContext.`,
    alteracao: `1. Modificar todas as assinaturas de métodos nos repositórios do discador para exigir organizationId como primeiro argumento obrigatório.
2. Injetar organizationId nas queries SQL/Prisma e adicionar índice composto (organizationId, status) se necessário.
3. Atualizar chamadas nos services e workers correspondentes.`,
    teste: `- Critério de Aceite: Nenhuma campanha ou lead de um tenant A pode ser selecionada ou modificada pelo tenant B.
- Teste de Integração: dialer-tenancy-isolation.spec.ts com duas organizações simultâneas.`,
    contexto: 'Bloqueador P0 de Tenancy com impacto direto na conformidade e privacidade.'
  },
  {
    fileName: '21-para-01-expurgo-transacional-optout.md',
    de: '21 — Privacidade e LGPD',
    para: '01 — Plataforma, Segurança e Dados',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-21-001 (B-13)',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Serviço de exclusão de dados do titular (dataSubjectErasure.service.ts) realiza exclusões em cascata manuais fora de uma transação Prisma, deixando registros órfãos em caso de falha parcial.',
    arquivos: [
      'src/services/dataSubjectErasure.service.ts:115-165',
      'prisma/schema.prisma:310-350'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-21.md.
- dataSubjectErasure.service.ts (L115-165): Deleta registros em Lead, Contact, ActivityLog de forma sequencial sem prisma.$transaction. Falha na terceira chamada aborta o processo e deixa dados pessoais ativos.
- Violação direta do AGENTS.md §22 (B-13: Tratamento de dados pessoais sem conformidade) e LGPD Artigo 18.
- Causa Raiz: Orquestração manual sem garantia ACID de expurgo.`,
    alteracao: `1. Envolver toda a rotina de exclusão ou anonimização em prisma.$transaction([ ... ]).
2. Adicionar registro de auditoria imutável (sem PII) comprovando data, hora e hash do titular expurgado.
3. Tratar deleção de chaves no Redis/Cache associadas ao titular.`,
    teste: `- Critério de Aceite: Expurgo ocorre com 100% de sucesso atômico ou sofre rollback completo sem órfãos.
- Teste de Integração: erasure-transaction-rollback.spec.ts simulando erro no meio do fluxo.`,
    contexto: 'Requisito regulatório de conformidade jurídica da LGPD.'
  },
  {
    fileName: '01a-para-01-schema-agentmemory-titular-lgpd.md',
    de: '01A — Confiabilidade de Dados, RLS e Retenção',
    para: '01 — Plataforma, Segurança e Dados',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-01A-001 (B-13)',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Tabela AgentMemory armazena contexto de IA com dados de contato/lead em campo JSON livre sem chave estrangeira ou coluna indexada de titular.',
    arquivos: [
      'prisma/schema.prisma:420-445',
      'prisma/migrations/'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-01A.md e DIVIDAS-AGENTE-13.md.
- prisma/schema.prisma (L420-445): Model AgentMemory possui campos sessionId, organizationId e payload JSON, mas carece de contactId opcional indexado.
- Impossibilita queries eficientes de portabilidade e expurgo do titular na memória dos agentes.
- Causa Raiz: Modelagem focada apenas na sessão de conversação.`,
    alteracao: `1. Adicionar campo contactId String? no model AgentMemory com índice @@index([organizationId, contactId]).
2. Criar migration Prisma segura: add_contact_id_to_agent_memory.
3. Atualizar o memory.service.ts para popular contactId sempre que o diálogo for associado a um lead/contato.`,
    teste: `- Critério de Aceite: Migration executa limpa e contactId pode ser consultado indexadamente.
- Teste: npx prisma migrate status e teste unitário em memory.service.spec.ts.`,
    contexto: 'Handoff de schema exclusivo para o Agente 01 conforme AGENTS.md §15.'
  },
  {
    fileName: '02-para-01-concorrencia-cas-organizacao-modulos.md',
    de: '02 — Produto e UX',
    para: '01 — Plataforma, Segurança e Dados',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'normal',
    bloqueadorRef: 'DIV-AGENTE-02-001',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Atualização de módulos habilitados da organização em organizationModules.service.ts sofre de race condition com múltiplos administradores.',
    arquivos: [
      'src/services/organizationModules.service.ts:85-110',
      'prisma/schema.prisma:180-205'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-02.md.
- organizationModules.service.ts (L85-110): Executa findUnique e depois update sem controle de versão otimista (optimistic locking / CAS) nem lock pessimista.
- Submissões concorrentes sobrescrevem configurações anteriores sem aviso.
- Causa Raiz: Ausência de campo version nos metadados de configuração.`,
    alteracao: `1. Implementar lock transacional ou verificação de versão (CAS) no update de organizationModules.
2. Retornar HTTP 409 Conflict se a versão enviada pelo frontend diferir da versão atual no banco.`,
    teste: `- Critério de Aceite: Duas requisições simultâneas com mesmo payload base resultam em uma aprovada e uma 409 Conflict.
- Teste de Concorrência: organizationModules-concurrency.spec.ts.`,
    contexto: 'Necessário para proteger integridade das configurações multi-módulo.'
  },
  {
    fileName: '21-para-01-dossie-portabilidade-titular.md',
    de: '21 — Privacidade e LGPD',
    para: '01 — Plataforma, Segurança e Dados',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-21-002',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Extração de dossiê de portabilidade do titular (dataSubjectPortability.service.ts) não inclui transcrições de telefonia nem mensagens do WhatsApp vinculadas.',
    arquivos: [
      'src/services/dataSubjectPortability.service.ts:90-135'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-21.md e DIVIDAS-AGENTE-12.md.
- dataSubjectPortability.service.ts (L90-135): Consulta apenas tabelas centrais (Lead, Contact, CustomFields). Omite interações em CallRecord e WhatsAppMessage onde há dados biométricos/transcritos do titular.
- Causa Raiz: Módulos de telefonia e mensageria foram criados após o serviço de portabilidade.`,
    alteracao: `1. Expandir a agregação de dados no dataSubjectPortability.service.ts para buscar transcrições sanitizadas e histórico de interações.
2. Gerar arquivo JSON/PDF estruturado e criptografado para entrega segura ao titular.`,
    teste: `- Critério de Aceite: Dossiê gerado para contato de teste contém todas as entidades relacionadas sem dados de terceiros.
- Teste: portability-full-export.spec.ts.`,
    contexto: 'Exigência legal do direito à portabilidade de dados da LGPD.'
  },
  {
    fileName: '00-para-01a-particionamento-retencao-logs.md',
    de: '00 — Coordenador',
    para: '01A — Confiabilidade de Dados, RLS e Retenção',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'normal',
    bloqueadorRef: 'DIV-AGENTE-01A-002',
    sprintDestino: 'Onda 1 — Segurança, Schema, Tenancy e LGPD',
    problema: 'Tabelas AILog, SyncHistory e ActivityLog acumulam milhões de registros sem rotina de purga ou particionamento, degradando performance.',
    arquivos: [
      'src/services/retentionPurge.service.ts:120-165',
      'scripts/db/archive-old-logs.sql'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-01A.md e DIVIDAS-AGENTE-23.md.
- retentionPurge.service.ts executa deletes massivos em batch na mesma tabela de produção durante o dia, gerando lock de páginas.
- Causa Raiz: Ausência de particionamento mensal no PostgreSQL para tabelas de eventos.`,
    alteracao: `1. Criar estratégia de purga assíncrona noturna com índices parciais ou suporte a particionamento por data.
2. Definir políticas de retenção estritas por tenant em retentionPurge.service.ts (ex: 90 dias padrão para AILog).`,
    teste: `- Critério de Aceite: Rotina de purga apaga logs antigos sem travar inserções concorrentes.
- Teste de Carga/Simulação: retention-purge-load.spec.ts.`,
    contexto: 'Estabilidade a longo prazo da base relacional.'
  },

  // --- ONDA 2: RUNTIME, WORKERS, FILAS E INFRAESTRUTURA (P1) ---
  {
    fileName: '00-para-16-dead-letter-queue-whatsapp.md',
    de: '00 — Coordenador',
    para: '16 — Runtime, Workers e Escala',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-16-001 (B-11)',
    sprintDestino: 'Onda 2 — Runtime, Workers e Infraestrutura',
    problema: 'Fila de mensageria WhatsApp (whatsappQueue.worker.ts) entra em loop infinito de retries em números bloqueados ou inválidos, entupindo o worker sem Dead Letter Queue (DLQ).',
    arquivos: [
      'src/workers/whatsappQueue.worker.ts:110-155',
      'src/lib/queue/redisQueue.ts:60-95'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-16.md e DIVIDAS-AGENTE-06.md.
- whatsappQueue.worker.ts (L110-155): Ao receber erro 400/404 da API Baileys/WhatsApp, reenfileira o job indefinidamente com backoff fixo sem mover para DLQ após N tentativas.
- Violação de AGENTS.md §22 (B-11: Sincronizações que falham silenciosamente/travam fila).
- Causa Raiz: Tratamento genérico de catch sem diferenciação de erro transiente vs erro permanente.`,
    alteracao: `1. Implementar diferenciação de erros: transientes (retry até 3x com exponential backoff) vs permanentes (mover imediatamente para DLQ).
2. Criar fila whatsapp-messages-dlq com notificação de alerta para o dashboard operacional.
3. Adicionar métrica Prometheus para mensagens em DLQ.`,
    teste: `- Critério de Aceite: Mensagem para número inválido é movida para DLQ após exatamente 3 tentativas sem travar os demais jobs da fila.
- Teste: whatsapp-queue-dlq.spec.ts.`,
    contexto: 'Desbloqueio operacional crítico para alta volumetria de mensagens.'
  },
  {
    fileName: '00-para-14-trava-seguranca-banco-test-harness.md',
    de: '00 — Coordenador',
    para: '14 — Ambiente de Execução e Test Harness',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-14-001',
    sprintDestino: 'Onda 2 — Runtime, Workers e Infraestrutura',
    problema: 'Script prepare-integration-env.js roda prisma migrate reset sem verificar se a porta conectada é o PostgreSQL padrão de produção (5432) ou banco protegido.',
    arquivos: [
      'scripts/test/prepare-integration-env.js:40-75'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-14.md.
- scripts/test/prepare-integration-env.js (L40-75): Executa drop de banco se TEST_DATABASE_URL estiver mal configurada ou apontando para instância real por engano.
- Causa Raiz: Falta de trava de segurança estrita checando nome do banco com sufixo _test e ambiente NODE_ENV === 'test'.`,
    alteracao: `1. Inserir asserção obrigatória em prepare-integration-env.js validando: database name termina com _test, host não é endpoint de produção (rds/aws) e NODE_ENV === 'test'.
2. Se qualquer condição falhar, abortar com erro fatal antes de qualquer comando destrutivo.`,
    teste: `- Critério de Aceite: Script recusa execução se DATABASE_URL apontar para banco sem sufixo _test.
- Teste: test-harness-safety.spec.ts.`,
    contexto: 'Proteção contra perda de dados acidental em ambientes de teste.'
  },
  {
    fileName: '00-para-10-assercoes-rto-restore-drill.md',
    de: '00 — Coordenador',
    para: '10 — Infraestrutura, Observabilidade e SRE',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-10-001',
    sprintDestino: 'Onda 2 — Runtime, Workers e Infraestrutura',
    problema: 'Script de simulação de desastre (run-backup-restore-drill.ts) apenas testa dump local de arquivo mas não executa restore real em banco temporário nem mede RTO/RPO.',
    arquivos: [
      'scripts/sre/run-backup-restore-drill.ts:85-140'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-10.md.
- run-backup-restore-drill.ts (L85-140): Conclui com drill_status: SUCCESS apenas verificando tamanho de arquivo .sql gerado pelo pg_dump. Nunca roda pg_restore para atestar validade estrutural.
- Causa Raiz: Implementação rasa de simulação de backup.`,
    alteracao: `1. Atualizar o drill para criar container temporário de PostgreSQL, aplicar o backup e executar prisma db push / query de checagem.
2. Calcular tempo decorrido e validar se o RTO está dentro da meta SLA (< 15 minutos).
3. Gerar relatório estruturado com evidência executável.`,
    teste: `- Critério de Aceite: run-backup-restore-drill.ts restaura dados reais em banco efêmero e comprova contagem de registros consistente.`,
    contexto: 'Conformidade SRE e resiliência de desastre.'
  },
  {
    fileName: '10-para-16-shutdown-coordenado-sse-server.md',
    de: '10 — Infraestrutura, Observabilidade e SRE',
    para: '16 — Runtime, Workers e Escala',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'normal',
    bloqueadorRef: 'DIV-AGENTE-10-002',
    sprintDestino: 'Onda 2 — Runtime, Workers e Infraestrutura',
    problema: 'Ao receber sinal SIGTERM no server.ts, conexões ativas de Server-Sent Events (SSE) e WebSockets são encerradas abruptamente sem mensagem de fechamento limpo ao frontend.',
    arquivos: [
      'server.ts:310-345',
      'src/lib/sse/sseManager.ts:70-105'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-10.md e DIVIDAS-AGENTE-16.md.
- server.ts (L310-345): Handler de SIGTERM encerra httpServer.close() sem iterar pelas conexões ativas do sseManager para disparar evento close ou reconnect.
- Causa clientes no frontend a exibirem erro de rede vermelho em vez de reconnect silencioso durante deploys.`,
    alteracao: `1. Integrar sseManager.gracefulDrain() no hook de SIGTERM em server.ts.
2. Enviar evento sse 'server_shutdown' permitindo que o cliente frontend agende reconexão inteligente pós-deploy.`,
    teste: `- Critério de Aceite: Ao enviar kill -TERM no processo, clientes recebem evento de drenagem antes do socket fechar.`,
    contexto: 'Melhoria na experiência de usuário durante deploys de zero downtime.'
  },
  {
    fileName: '16-para-10-circuit-guard-redis-especifico.md',
    de: '16 — Runtime, Workers e Escala',
    para: '10 — Infraestrutura, Observabilidade e SRE',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-16-002',
    sprintDestino: 'Onda 2 — Runtime, Workers e Infraestrutura',
    problema: 'Circuit guard (circuitGuard.ts) abre circuito para todos os serviços em falhas de timeout do Redis, causando falsos positivos em cascata.',
    arquivos: [
      'src/lib/circuitGuard.ts:40-85'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-16.md.
- circuitGuard.ts (L40-85): Trata qualquer erro capturado como degradação total do backend em vez de isolar por dependência (ex: redis, postgres, apis externas).
- Causa Raiz: Singleton compartilhado de circuit breaker sem chaveamento por serviço downstream.`,
    alteracao: `1. Refatorar circuitGuard.ts para manter circuitos independentes por dependência (redis, database, bitrix, telephony).
2. Adicionar healthcheck detalhado no endpoint /health reportando status granular de cada circuito.`,
    teste: `- Critério de Aceite: Falha simulada no Redis abre apenas o circuito de cache/filas sem derrubar leitura direta do banco PostgreSQL.
- Teste: circuitGuard-isolation.spec.ts.`,
    contexto: 'Resiliência contra falhas em cascata.'
  },

  // --- ONDA 3: INTEGRAÇÕES, EXTRAÇÕES E TELEFONIA (P1/P2) ---
  {
    fileName: '00-para-06a-sanitizacao-csv-injection-bitrix.md',
    de: '00 — Coordenador',
    para: '06A — Extrações Bitrix',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-06A-001 (B-04)',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Exportador de relatórios e dados do Bitrix para CSV/Excel (exportFormatter.service.ts) não sanitiza caracteres que iniciam fórmulas (=, +, -, @), permitindo CSV Injection.',
    arquivos: [
      'src/services/bitrix/exportFormatter.service.ts:50-85'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-06A.md.
- exportFormatter.service.ts (L50-85): Concatena strings vindas de campos customizados do Bitrix diretamente nas células CSV sem prefixar apóstrofo em valores com fórmulas.
- Risco de execução de código remoto em planilhas abertas por administradores com dados de leads maliciosos.
- Causa Raiz: Formatação simples via split/join sem sanitizador de CSV.`,
    alteracao: `1. Implementar função de sanitização de CSV que adiciona aspas e prefixa apóstrofo (') em qualquer célula iniciando com =, +, -, @, \\t ou \\r.
2. Garantir encode correto em UTF-8 com BOM para compatibilidade com Microsoft Excel.`,
    teste: `- Critério de Aceite: Campo com valor =CMD|'/C calc'!A0 é formatado como "'=CMD|'/C calc'!A0" sem execução no Excel.
- Teste Unitário: exportFormatter-csv-injection.spec.ts.`,
    contexto: 'Segurança em exportações operacionais.'
  },
  {
    fileName: '06-para-06a-streaming-extracao-memoria-oom.md',
    de: '06 — Integrações e Bitrix',
    para: '06A — Extrações Bitrix',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-06-001',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Extração massiva de contatos do Bitrix24 (extraction.ts) acumula dezenas de milhares de objetos em memória antes de persistir, arriscando OOM crash em contas grandes.',
    arquivos: [
      'src/services/bitrix/extraction.ts:120-170'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-06.md e DIVIDAS-AGENTE-06A.md.
- extraction.ts (L120-170): Loop de paginação faz array.push(...) de todos os leads extraídos e só grava no final via batch insert, consumindo > 1GB de RAM em clientes com > 50k leads.
- Causa Raiz: Ausência de streaming ou processamento em pipeline (Node.js Transform streams / generators).`,
    alteracao: `1. Refatorar a extração para usar async generators que buscam e persistem blocos de 500 registros por vez.
2. Liberar referências de memória entre iterações e registrar progresso em banco.`,
    teste: `- Critério de Aceite: Extração de 10.000 contatos simulados mantém consumo de heap estável abaixo de 150MB.
- Teste: extraction-stream-memory.spec.ts.`,
    contexto: 'Escalabilidade para clientes Enterprise.'
  },
  {
    fileName: '12-para-06-buffer-assincrono-webhooks-3cx.md',
    de: '12 — Voz e Telefonia',
    para: '06 — Integrações e Bitrix',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-12-001 (B-07)',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Recepção de webhooks de status de chamada da telefonia 3CX (webhookHandler.service.ts) executa queries pesadas de forma síncrona na rota HTTP, gerando timeout 504 no servidor 3CX e perda de eventos.',
    arquivos: [
      'src/services/telephony/webhookHandler.service.ts:75-115'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-12.md.
- webhookHandler.service.ts (L75-115): Ao receber webhook de call hangup, faz 4 queries no PostgreSQL e sincronização com Bitrix antes de retornar HTTP 200 ao 3CX.
- 3CX possui timeout estrito de 2000ms. Sob pico, chamadas são perdidas.
- Violação de AGENTS.md §22 (B-07).`,
    alteracao: `1. Modificar endpoint de webhook para apenas validar signature, jogar evento em fila Redis e responder HTTP 202 Accepted imediatamente (< 50ms).
2. Mover lógica de sincronização pesada para worker assíncrono (telephonyWebhook.worker.ts).`,
    teste: `- Critério de Aceite: Rota de webhook responde HTTP 202 em menos de 80ms sob carga de 50 req/s.
- Teste: webhook-telephony-benchmark.spec.ts.`,
    contexto: 'Evita perda de chamadas e descompasso de relatórios de discagem.'
  },
  {
    fileName: '04-para-12-correcao-faturamento-meses-31-dias.md',
    de: '04 — CRM e BI',
    para: '12 — Voz e Telefonia',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-04-001',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Cálculo de faturamento e tarifação de minutos de telefonia (billing.service.ts) usa incremento ingênuo de 30 dias para fechar faturas, gerando defasagem em meses com 31 ou 28 dias.',
    arquivos: [
      'src/services/telephony/billing.service.ts:95-135'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-04.md e DIVIDAS-AGENTE-12.md.
- billing.service.ts (L95-135): Utiliza new Date(timestamp + 30 * 86400000) em vez de date-fns/addMonths ou cálculo alinhado ao dia de vencimento contratual.
- Provoca cobranças duplicadas ou dias não faturados em ciclos anuais.`,
    alteracao: `1. Refatorar cálculo de faturamento em billing.service.ts para utilizar date-fns/addMonths respeitando fuso horário e dia de corte cadastrado.
2. Adicionar testes para anos bissextos e transição de meses com 28/30/31 dias.`,
    teste: `- Critério de Aceite: Ciclo de fatura iniciado em 31 de janeiro fecha corretamente no último dia de fevereiro e no dia 31 de março.
- Teste: billing-cycles-accuracy.spec.ts.`,
    contexto: 'Precisão financeira e prevenção de disputas de cobrança.'
  },
  {
    fileName: '15-para-12-mascaramento-pii-transcricoes-voz.md',
    de: '15 — Segurança Aplicada e Rotação de Segredos',
    para: '12 — Voz e Telefonia',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-12-002 (B-13)',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Transcrições de áudio de ligações (transcription.service.ts) gravam texto com menção a CPF, cartão de crédito e dados médicos sensíveis sem filtro de PII antes de persistir.',
    arquivos: [
      'src/services/telephony/transcription.service.ts:140-185'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-15.md, DIVIDAS-AGENTE-12.md e DIVIDAS-AGENTE-21.md.
- transcription.service.ts (L140-185): Recebe texto gerado pelo modelo Whisper/ASR e salva diretamente no campo transcript de CallRecord sem passar por regex de dados sensíveis.
- Violação direta de AGENTS.md §22 (B-13: LGPD) e §27 (Minimização de dados).`,
    alteracao: `1. Integrar pipeline de sanitização de PII em transcription.service.ts substituindo números de cartão, CPF e dados bancários por tags [REDACTED_CPF], [REDACTED_CARD].
2. Aplicar a mesma sanitização aos embeddings gerados para busca vetorial de chamadas.`,
    teste: `- Critério de Aceite: Texto com menção explícita de CPF gravado no banco de testes tem os dígitos devidamente ofuscados.
- Teste: transcription-pii-masking.spec.ts.`,
    contexto: 'Blindagem de dados pessoais de clientes e pacientes em gravações telefônicas.'
  },
  {
    fileName: '05-para-17-trava-templates-cadencia-placeholders.md',
    de: '05 — Prospecção',
    para: '17 — Cadência Multicanal e Ciclo de Receita',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-05-001',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Renderizador de templates de cadência (templateRenderer.service.ts) envia e-mails e WhatsApps com tags não resolvidas (ex: {{lead.firstName}}) quando o dado está ausente.',
    arquivos: [
      'src/services/cadence/templateRenderer.service.ts:60-95'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-05.md e DIVIDAS-AGENTE-17.md.
- templateRenderer.service.ts (L60-95): Se lead.name for null, substitui por string vazia ou mantém o texto literal da tag, enviando mensagens constrangedoras para o cliente final.
- Causa Raiz: Ausência de fallback obrigatório configurável ou checagem de integridade pré-envio.`,
    alteracao: `1. Implementar sistema de fallback seguro em templateRenderer.service.ts (ex: {{lead.firstName | default: "Olá"}}).
2. Adicionar trava que cancela o disparo e alerta o operador se uma variável obrigatória não possuir valor nem fallback.`,
    teste: `- Critério de Aceite: Template com tag não preenchida aciona fallback seguro ou bloqueia disparo com erro descritivo.
- Teste: templateRenderer-fallbacks.spec.ts.`,
    contexto: 'Qualidade da imagem comercial da marca.'
  },
  {
    fileName: '06-para-17-janela-horario-comercial-whatsapp.md',
    de: '06 — Integrações e Bitrix',
    para: '17 — Cadência Multicanal e Ciclo de Receita',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-17-001',
    sprintDestino: 'Onda 3 — Integrações, Extrações e Telefonia',
    problema: 'Agendador de passos de cadência (stepScheduler.service.ts) agenda disparos de mensagens automáticas de WhatsApp fora do horário comercial (ex: madrugada e fins de semana).',
    arquivos: [
      'src/services/cadence/stepScheduler.service.ts:110-155'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-17.md.
- stepScheduler.service.ts (L110-155): Calcula nextExecutionDate somando intervalo fixo em horas sem respeitar timezone do destinatário nem horários permitidos por lei.
- Gera alto índice de denúncias de spam e bloqueio de chips de WhatsApp.`,
    alteracao: `1. Implementar validador de janela de horário comercial (ex: 08:00 às 19:00 no timezone do lead) em stepScheduler.service.ts.
2. Adicionar postergação automática para o próximo dia útil às 09:00 caso o cálculo resulte em horário restrito.`,
    teste: `- Critério de Aceite: Passo de cadência calculado para domingo às 23:00 é agendado para segunda-feira às 09:00.
- Teste: stepScheduler-business-hours.spec.ts.`,
    contexto: 'Proteção contra banimento de números no WhatsApp e respeito aos clientes.'
  },

  // --- ONDA 4: IA, ENXAMES E OTIMIZAÇÃO DE CUSTOS (P1/P2) ---
  {
    fileName: '00-para-07-remocao-dados-fabricados-copiloto.md',
    de: '00 — Coordenador',
    para: '07 — IA e Automações',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-07-001 (B-06)',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Tela de workspace do agente comercial (EliteCommercialAgentWorkspace.tsx) exibe KPIs de conversão e assertividade de IA fixos no código (hardcoded mock), simulando dados reais.',
    arquivos: [
      'src/pages/EliteCommercialAgentWorkspace.tsx:180-225'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-07.md e DIVIDAS-AGENTE-22.md.
- EliteCommercialAgentWorkspace.tsx (L180-225): Valores como "Assertividade: 94.8%" e "Tempo de resposta: 1.2s" estão mockados em objetos JavaScript locais sem chamada à API.
- Violação frontal de AGENTS.md §22 (B-06: Dados fictícios misturados com dados reais) e §25 (Dados reais e demonstração).`,
    alteracao: `1. Substituir valores mockados por hook useCommercialAgentMetrics() consultando backend real.
2. Tratar estados obrigatórios: loading, empty (sem chamadas suficientes), error e dados reais calculados sobre AILog.`,
    teste: `- Critério de Aceite: Nenhuma métrica comercial fabricada no código; exibe placeholder de estado vazio se não houver histórico.
- Teste de Componente: EliteCommercialAgentWorkspace.spec.tsx.`,
    contexto: 'Transparência de métricas e verdade operacional.'
  },
  {
    fileName: '22-para-07-persistencia-real-next-best-action.md',
    de: '22 — Verificação de Realidade',
    para: '07 — IA e Automações',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-22-001 (B-08)',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Card de sugestão de próxima ação (NextBestActionCard.tsx) possui botões "Aceitar Sugestão" e "Descartar" que apenas alteram estado local React sem persistir decisão no banco.',
    arquivos: [
      'src/components/commercial/NextBestActionCard.tsx:45-90',
      'src/services/ai/recommendations.service.ts:30-65'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-07.md.
- NextBestActionCard.tsx (L45-90): Clique em "Aceitar" chama setAccepted(true) e exibe toast de sucesso, mas não dispara requisição HTTP. Ao recarregar a página (F5), a ação descartada ressurge.
- Violação de AGENTS.md §22 (B-08) e princípio de persistência real.`,
    alteracao: `1. Conectar botões de ação à API POST /api/commercial/recommendations/:id/action.
2. Persistir status ACCEPTED/REJECTED e feedback do usuário no banco PostgreSQL.
3. Atualizar cache e invalidar queries React Query.`,
    teste: `- Critério de Aceite: Ação aceita ou descartada persiste após refresh da página no navegador.
- Teste E2E/Componente: next-best-action-persistence.spec.tsx.`,
    contexto: 'Eliminação de UI cenográfica no CRM.'
  },
  {
    fileName: '23-para-13-limite-recursao-agent-bus-loops.md',
    de: '23 — Custo, Performance e Limites de IA',
    para: '13 — Enxame Autônomo e Governança de Agentes de Runtime',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-13-001',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Barramento de comunicação entre agentes autônomos (agentBus.ts) não possui trava de recursão (maxHops), permitindo loops infinitos de mensagens entre agentes e explosão de custos de tokens.',
    arquivos: [
      'src/lib/agents/agentBus.ts:80-120'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-23.md e DIVIDAS-AGENTE-13.md.
- agentBus.ts (L80-120): Agente A envia mensagem que aciona Agente B, que responde ao Agente A. Não há contador de hops nem chave de rastreabilidade de correlação.
- Risco severo de looping com chamadas contínuas de LLM.`,
    alteracao: `1. Incluir metadados obrigatórios em todas as mensagens do barramento: correlationId, hopCount (default 0) e traceParent.
2. Interromper a cadeia e emitir alerta crítico se hopCount > 5.`,
    teste: `- Critério de Aceite: Loop simulado entre dois agentes é interrompido com erro LoopDetectedException no quinto hop.
- Teste: agentBus-recursion-limit.spec.ts.`,
    contexto: 'Controle de custos de API de IA e estabilidade do enxame.'
  },
  {
    fileName: '07-para-23-corte-tempo-real-streaming-sse.md',
    de: '07 — IA e Automações',
    para: '23 — Custo, Performance e Limites de IA',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-23-001',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Streaming de respostas de IA (aiStream.service.ts) só contabiliza e valida saldo de tokens após a finalização completa da resposta, permitindo que usuários sem saldo consumam tokens em streaming longo.',
    arquivos: [
      'src/services/ai/aiStream.service.ts:130-180'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-23.md.
- aiStream.service.ts (L130-180): Verificação de cota ocorre no início (se saldo > 0). Respostas de 4000 tokens continuam gerando mesmo se a cota do tenant expirar durante a geração.
- Causa Raiz: Falta de hook de interrupção no chunk processor de streaming.`,
    alteracao: `1. Implementar contador de tokens aproximado por chunks recebidos.
2. Abortar a chamada da API (via AbortController) se o limite estrito do tenant for atingido no meio do stream.`,
    teste: `- Critério de Aceite: Geração de texto é cortada com mensagem CotaExcedida assim que o limite de tokens da organização é ultrapassado.
- Teste: aiStream-quota-abort.spec.ts.`,
    contexto: 'Proteção financeira contra estouro de limites de API da OpenAI/Anthropic.'
  },
  {
    fileName: '00-para-05-circuit-breaker-enriquecimento-leads.md',
    de: '00 — Coordenador',
    para: '05 — Prospecção',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-05-002',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Módulo de enriquecimento de leads (enrichment.service.ts) não possui rate limiting nem circuit breaker para provedores externos (ex: Apollo/Hunter), consumindo créditos rapidamente em erros 429.',
    arquivos: [
      'src/services/prospecting/enrichment.service.ts:95-140'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-05.md.
- enrichment.service.ts (L95-140): Faz chamadas paralelas desenfreadas para enriquecer lotes de leads. Ao receber 429 Too Many Requests, repete imediatamente sem respeitar header Retry-After.`,
    alteracao: `1. Implementar rate limiter com token bucket e circuit breaker específico em enrichment.service.ts.
2. Respeitar o cabeçalho Retry-After retornado pelos provedores externos.`,
    teste: `- Critério de Aceite: Ao receber 429, o serviço pausa novas requisições pelo tempo estipulado pelo provedor sem consumir créditos.
- Teste: enrichment-rate-limit.spec.ts.`,
    contexto: 'Preservação de orçamentos de integração e conformidade de API externa.'
  },
  {
    fileName: '00-para-13-modularizacao-supervisor-agent-hotspot.md',
    de: '00 — Coordenador',
    para: '13 — Enxame Autônomo e Governança de Agentes de Runtime',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-13-002',
    sprintDestino: 'Onda 4 — IA, Enxames e Otimização de Custos',
    problema: 'Arquivo supervisor.agent.ts concentra 740 linhas de código com lógica mista de roteamento, prompts hardcoded e execução de ferramentas, tornando-se hotspot de manutenção.',
    arquivos: [
      'src/lib/agents/supervisor.agent.ts:1-740'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-13.md.
- supervisor.agent.ts viola princípio de responsabilidade única. Mistura orquestração de subagentes, schemas de tools Zod, prompts de sistema e lógica de fallback.`,
    alteracao: `1. Decompor supervisor.agent.ts em: prompts/, tools/ e routers/.
2. Manter a classe SupervisorAgent enxuta (< 200 linhas) focada apenas na coordenação.`,
    teste: `- Critério de Aceite: Todos os testes existentes do supervisor passam sem alteração de comportamento externo.
- Teste: npx jest src/lib/agents/supervisor.spec.ts.`,
    contexto: 'Refatoração essencial para manutenibilidade do motor de IA.'
  },

  // --- ONDA 5: FRONTEND, UX, DESIGN SYSTEM, MOBILE E CONTRATOS (P2/P3) ---
  {
    fileName: '00-para-18-restauracao-contratos-openapi-modulos.md',
    de: '00 — Coordenador',
    para: '18 — Contratos, API e Documentação Viva',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-18-001 (B-09)',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Documento OpenAPI central (docs/openapi.yaml) possui 124 linhas deletadas ou desatualizadas, gerando descompasso com as rotas reais de módulos e telefonia implementadas.',
    arquivos: [
      'docs/openapi.yaml:310-435'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-18.md.
- docs/openapi.yaml carece dos schemas das rotas de /api/telephony e /api/organization/modules.
- Gera erros na geração de SDKs clientes e falhas na validação de contratos de API.`,
    alteracao: `1. Reconciliar docs/openapi.yaml com as rotas Express registradas em src/routes/.
2. Adicionar validação de contrato no CI para alertar quando uma rota de backend não estiver documentada.`,
    teste: `- Critério de Aceite: npx swagger-cli validate docs/openapi.yaml retorna 100% válido e sem rotas órfãs.`,
    contexto: 'Garantia de integridade dos contratos de API entre frontend e backend.'
  },
  {
    fileName: '00-para-02-modularizacao-crmboard-kanban.md',
    de: '00 — Coordenador',
    para: '02 — Produto e UX',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-02-002',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Componente CrmBoard.tsx possui 1258 linhas em arquivo único, misturando drag and drop, requisições de API, filtros de busca e modais pesados, causando gargalos de renderização.',
    arquivos: [
      'src/pages/CrmBoard.tsx:1-1258'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-02.md e DIVIDAS-AGENTE-03.md.
- CrmBoard.tsx renderiza o quadro Kanban inteiro a cada tecla digitada no campo de busca devido a estado no componente raiz.
- Tempo de resposta de UI > 300ms em boards com mais de 100 cards.`,
    alteracao: `1. Modularizar CrmBoard em subcomponentes memoizados: KanbanColumn, KanbanCard, KanbanFilters, KanbanHeader.
2. Isolar estado de filtros e busca com useDebounce.`,
    teste: `- Critério de Aceite: Digitação na busca não dispara re-render das colunas que não sofreram alteração.
- Teste de Renderização: CrmBoard-performance.spec.tsx.`,
    contexto: 'Fluidez e usabilidade de uma das telas mais utilizadas da plataforma.'
  },
  {
    fileName: '00-para-03-remocao-important-css-globals.md',
    de: '00 — Coordenador',
    para: '03 — Design e Acessibilidade',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'alto',
    bloqueadorRef: 'DIV-AGENTE-03-001',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Folha de estilos global (src/index.css) contém classes utilitárias com !important forçado sobrescrevendo o tema shadcn/ui e quebrando suporte a modo escuro/contraste.',
    arquivos: [
      'src/index.css:120-185'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-03.md.
- src/index.css (L120-185): Uso de !important em cores de fundo e bordas impede estilização dinâmica via tokens de acessibilidade e tema dark.`,
    alteracao: `1. Remover declarações !important de src/index.css.
2. Refatorar regras de especificidade para utilizar tokens semânticos do Tailwind/shadcn (@layer utilities / @layer components).`,
    teste: `- Critério de Aceite: Alternância para modo escuro aplica 100% dos contrastes exigidos pelo WCAG AA sem elementos com fundo branco forçado.
- Teste Visual: theme-accessibility.spec.ts.`,
    contexto: 'Conformidade WCAG AA e padronização visual do Design System.'
  },
  {
    fileName: '15-para-09-particionamento-cache-pwa-logout.md',
    de: '15 — Segurança Aplicada e Rotação de Segredos',
    para: '09 — Mobile',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-09-001 (B-10)',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Logout no aplicativo PWA/Mobile não limpa o CacheStorage do Service Worker (serviceWorkerRegistration.ts), permitindo visualização de dados de clientes anteriores offline.',
    arquivos: [
      'src/serviceWorkerRegistration.ts:80-120',
      'src/lib/auth.ts:410-435'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-09.md e DIVIDAS-AGENTE-15.md.
- serviceWorkerRegistration.ts armazena respostas de rotas /api/leads em cache offline. Ao deslogar e logar com outro usuário, dados em cache continuam acessíveis se o dispositivo estiver offline.
- Violação direta de Tenancy e LGPD.`,
    alteracao: `1. Integrar evento de logout no auth.ts para acionar caches.keys() e deletar todos os caches de dados de negócio da organização deslogada.
2. Desregistrar ou revalidar Service Worker no logout.`,
    teste: `- Critério de Aceite: Após logout, requisições offline às rotas de API retornam 401 e não entregam dados do cache.
- Teste PWA: service-worker-logout-cache.spec.ts.`,
    contexto: 'Segurança e isolamento de tenancy em dispositivos móveis.'
  },
  {
    fileName: '00-para-04-observabilidade-erros-analytics-sem-zeros.md',
    de: '00 — Coordenador',
    para: '04 — CRM e BI',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-04-002 (B-06)',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Serviço de análise de dados (analytics.service.ts) captura exceções de agregação de banco e retorna objetos com valores numéricos zerados ({ total: 0, revenue: 0 }), mascarando falhas reais.',
    arquivos: [
      'src/services/analytics.service.ts:145-185'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-04.md.
- analytics.service.ts (L145-185): Bloco catch captura erro de timeout ou syntax do PostgreSQL e retorna fallback de zeros sem logar erro crítico.
- Administradores concluem que faturamento ou leads são zero quando na verdade o banco de dados falhou.
- Violação de AGENTS.md §22 (B-06) e §25.`,
    alteracao: `1. Eliminar retornos mascarados de zeros em falhas de banco.
2. Propagar erro observável ou retornar payload explícito: { status: 'error', code: 'DATABASE_TIMEOUT' } para que o frontend exiba tela de estado de erro em vez de gráfico vazio.`,
    teste: `- Critério de Aceite: Falha no banco resulta em estado de erro observável na API e na interface.
- Teste: analytics-error-observability.spec.ts.`,
    contexto: 'Verdade operacional em relatórios executivos de BI.'
  },
  {
    fileName: '22-para-02-persistencia-settings-placeholder.md',
    de: '22 — Verificação de Realidade',
    para: '02 — Produto e UX',
    onda: 'onda-saneamento-20261105',
    status: 'aberto',
    prioridade: 'bloqueador',
    bloqueadorRef: 'DIV-AGENTE-02-003 (B-06)',
    sprintDestino: 'Onda 5 — Frontend, UX, Mobile e Contratos',
    problema: 'Página de configurações de pilares (PillarSettingsPlaceholder.tsx) apresenta formulários com botões "Salvar Alterações" que apenas exibem feedback visual sem nenhuma persistência no backend.',
    arquivos: [
      'src/pages/PillarSettingsPlaceholder.tsx:40-90'
    ],
    evidencia: `Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-02.md.
- PillarSettingsPlaceholder.tsx (L40-90): Evento onSubmit executa e.preventDefault(), exibe Toast de "Configuração salva com sucesso!" e não chama endpoint algum.
- Configurações são perdidas imediatamente ao sair da tela.`,
    alteracao: `1. Implementar endpoints reais em backend para os pilares configuráveis ou substituir os campos cenográficos por indicação honesta de roadmap ("Em breve").
2. Se mantido formulário, conectar à mutation do React Query persistindo no banco.`,
    teste: `- Critério de Aceite: Formulário funcional persiste valores no banco ou componente é desativado de forma transparente sem simulação falsa.
- Teste: pillar-settings-reality.spec.tsx.`,
    contexto: 'Fim da cenografia funcional no módulo de configurações.'
  }
];

let createdCount = 0;
for (const h of handoffs) {
  const content = `De: ${h.de}
Para: ${h.para}
Onda: ${h.onda}
Status: ${h.status}
Prioridade: ${h.prioridade}
Bloqueador-ref: ${h.bloqueadorRef}
Sprint destino: ${h.sprintDestino}

## Problema
${h.problema}

## Arquivo(s) envolvido(s)
${h.arquivos.map(a => `- ${a}`).join('\n')}

## Evidência
${h.evidencia}

## Alteração necessária
${h.alteracao}

## Teste esperado
${h.teste}

## Contexto adicional
${h.contexto}
`;

  const filePath = path.join(targetDir, h.fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  createdCount++;
}

console.log(`Sucesso: ${createdCount} handoffs criados em ${targetDir}`);
