# Relatório de Auditoria de Dívidas Técnicas — Agente 21

## IDENTIFICAÇÃO
- **ID do agente:** 21
- **Nome oficial:** Privacidade e LGPD
- **Especialização:** Governança de privacidade, conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), cadeia de consentimento imutável append-only, fluxo de atendimento aos direitos dos titulares (acesso, retificação, anonimização, exclusão), inventário de tratamento de dados (ROPA) e minimização de dados pessoais
- **Responsabilidades:** Auditoria e aplicação das bases legais de tratamento de dados pessoais no CRM, orquestração dos processos de expurgo e anonimização de titulares, gestão de listas de supressão multicanal (Opt-Out), proteção de PII e garantia de que nenhum dado pessoal seja processado sem registro de consentimento ou legítimo interesse comprovado.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/lgpd/**`, `src/shared/services/dataSubjectErasure.service.ts`, `src/lib/security/consentAuditChain.service.ts`, `docs/lgpd-base-legal.md`, inventário de PII e rotinas de opt-out.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Fluxo de direitos do titular (`DataSubjectRightsService`), serviço de exclusão e anonimização (`DataSubjectErasureService`), encadeamento criptográfico de consentimento (`ConsentAuditChainService`), central de cookies e preferências de privacidade.
- **Arquivos relevantes:**
  - `src/shared/services/dataSubjectErasure.service.ts` (serviço central de expurgo)
  - `src/lib/security/consentAuditChain.service.ts` (759 linhas, hotspot monitorado)
  - `src/features/lgpd/routes/lgpd.routes.ts`
  - `docs/lgpd-base-legal.md` (mapeamento oficial de bases legais)
  - `docs/ADR/ADR-006-LGPD-Cadeia-Consentimento-Append-Only.md`
- **Serviços existentes:** `DataSubjectErasureService`, `ConsentAuditChainService`, `OptOutService`, `PrivacyPreferenceManager`.
- **APIs e integrações:** Endpoints de gestão de privacidade `/api/lgpd/*`, ancoragem de hashes de consentimento em S3 Object Lock via KMS.
- **Funcionalidades implementadas:** Registro append-only de consentimento de cookies e termos, anonimização de contatos (e-mail, telefone, nome), tabela de supressão de cold-mail (`OptOutRecord`).
- **Testes encontrados:** `tests/unit/data-subject-erasure.test.ts`, `tests/unit/consent-chain.test.ts`.
- **Dependências externas:** Node.js Crypto, AWS S3 Object Lock, `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-21-001 (DEBT-LGPD-001)
- **Título:** Rotina de exclusão LGPD pode concluir anonimização sem gravar a supressão multicanal (OptOutRecord)
- **Categoria:** Privacidade, LGPD e Segurança
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/shared/services/dataSubjectErasure.service.ts` (linhas 115-135), `src/features/prospecting/services/cold-email.service.ts`
- **Evidência:** No método `eraseDataSubject`, a rotina substitui primeiramente o nome, e-mail e telefone do contato por hashes anonimizados (`anon_...`) e, somente em um bloco subsequente, tenta criar o registro na tabela `OptOutRecord`. Se a inserção em `OptOutRecord` falhar (por exemplo, timeout ou erro transitório de banco), o erro é capturado em um bloco `catch {}` vazio e a função retorna sucesso.
- **Problema:** Os dados pessoais de identificação original do contato foram destruídos, mas o registro de supressão multicanal não foi salvo. Caso uma nova lista de prospecção fria contendo o e-mail original do titular seja importada no futuro, o sistema não encontrará o lead no `OptOutRecord` e voltará a abordá-lo comercialmente. Além disso, como os dados originais já foram limpos, é impossível efetuar retentativa do registro de opt-out.
- **Causa raiz:** Inversão da ordem de dependência: a mutação destrutiva do lead foi executada antes da gravação com sucesso da regra de exclusão comercial permanente.
- **Impacto:** Violação direta da LGPD (Art. 18, VI) e do Bloqueador B-13 (`AGENTS.md` §22); reabordagem indevida de pessoas que já solicitaram o cancelamento de mensagens da empresa, expondo o cliente a sanções da ANPD e PROCON.
- **Correção necessária:** Inverter obrigatoriamente a ordem: gravar e confirmar a persistência do `OptOutRecord` dentro de uma transação Prisma; caso a criação de `OptOutRecord` falhe, a transação sofre rollback completo, preservando os identificadores para retentativa e propagando o erro observável.
- **Agente proprietário:** 21
- **Agentes dependentes:** 01 (Schema e Transação Prisma), 05 (Prospecção), 17 (Cadência)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Teste automatizado comprova que falha na persistência de `OptOutRecord` impede a anonimização e propaga erro 500; caminho feliz grava o opt-out antes de apagar PII.
- **Teste necessário:** Teste de integração de transação simulando falha na gravação do opt-out e verificando que a PII permaneceu intocada para nova tentativa.
- **Dependências:** Alinhamento com Agente 01 e 05.

### ID: DIV-21-002
- **Título:** Ausência de endpoint e interface unificada para exportação do Dossiê de Portabilidade e Acesso do Titular
- **Categoria:** Conformidade LGPD
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/lgpd/routes/lgpd.routes.ts`, `src/features/lgpd/services/dataSubjectAccess.service.ts`
- **Evidência:** Não existe rota consolidada que gere um pacote estruturado (JSON ou PDF assinado) reunindo todos os dados mantidos na plataforma sobre um titular específico (dados cadastrais, atividades, gravações, notas, propostas e histórico de consentimento).
- **Problema:** Quando um cliente ou lead protocola um pedido formal com base no direito de acesso e portabilidade (LGPD Art. 18, II e V), a equipe precisa realizar queries manuais em múltiplas tabelas do PostgreSQL para compilar as informações em prazo regulatório de 15 dias.
- **Causa raiz:** O desenvolvimento de compliance focou prioritariamente nas rotinas de exclusão e cookies, postergando o módulo de portabilidade.
- **Impacto:** Risco de descumprimento do prazo legal de resposta da ANPD em caso de requisição formal de titulares de dados.
- **Correção necessária:** Implementar o método `exportSubjectDossier(email, organizationId)` que consolida os dados de todas as entidades associadas e gera um arquivo JSON/PDF sanitizado para download pelo DPO.
- **Agente proprietário:** 21
- **Agentes dependentes:** 01 (Relacionamentos de Dados), 18 (Contratos de API)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** O DPO submete o e-mail do titular e obtém em menos de 5 segundos o download de um pacote consolidado contendo todos os registros vinculados àquele e-mail no tenant.
- **Teste necessário:** Teste de integração de exportação de dossiê com titular contendo histórico completo no CRM.
- **Dependências:** Alinhamento de schema com Agente 01.

### ID: DIV-21-003
- **Título:** Hotspot em consentAuditChain.service.ts executando hash-chaining síncrono com impacto em transações
- **Categoria:** Performance e Arquitetura
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/lib/security/consentAuditChain.service.ts` (759 linhas)
- **Evidência:** O arquivo ultrapassa o limite de alerta de 700 linhas de código e calcula o encadeamento de hashes criptográficos SHA-256 e assinatura de blocos de forma síncrona dentro da mesma thread do loop de eventos do Express durante submissões de formulários.
- **Problema:** Picos simultâneos de consentimentos de cookies e aceites de termos em campanhas comerciais aumentam a latência das requisições HTTP do frontend.
- **Causa raiz:** Concentração de funções de cálculo de hash, validação de integridade de elos anteriores e ancoragem em arquivo único sem offload.
- **Impacto:** Degradação de tempo de resposta da API de onboarding em horários de pico.
- **Correção necessária:** Modularizar o serviço em submódulos (`chainHasher.ts`, `chainValidator.ts`, `chainAnchor.ts`) e despachar a ancoragem externa via fila assíncrona.
- **Agente proprietário:** 21
- **Agentes dependentes:** 16 (Workers e Filas)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** `consentAuditChain.service.ts` reduzido para menos de 300 linhas; cálculo de hashes executado sem bloquear o event loop.
- **Teste necessário:** Benchmark de cálculo de 1.000 elos da cadeia de consentimento.
- **Dependências:** Nenhuma.

### ID: DIV-21-004
- **Título:** Falta de inventário de tratamento de dados (ROPA) automatizado e exportável para auditoria
- **Categoria:** Governança e Documentação
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `docs/lgpd-base-legal.md`, `src/features/lgpd/**`
- **Evidência:** O inventário de tratamento de dados pessoais (ROPA) existe apenas como tabela estática em markdown em `docs/lgpd-base-legal.md`, sem sincronização com os campos reais do `prisma/schema.prisma`.
- **Problema:** Quando novos campos de PII são adicionados às tabelas do banco de dados (ex.: novos atributos em leads ou gravações de chamadas), o inventário documental fica desatualizado em relação ao código real.
- **Causa raiz:** Ausência de script de verificação de drift entre anotações de PII no schema e a documentação regulatória.
- **Impacto:** Dificuldade em responder prontamente a solicitações de auditoria ou Relatório de Impacto à Proteção de Dados Pessoais (RIPD).
- **Correção necessária:** Criar script `scripts/security/verify-pii-inventory.ts` que inspeciona o schema Prisma, detecta campos com anotação `@pii` e valida a correspondência contra a base legal documentada.
- **Agente proprietário:** 21
- **Agentes dependentes:** 01 (Schema Prisma), 18 (Docs)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Execução de script confirma que 100% dos campos de dados pessoais do schema possuem base legal e finalidade declaradas no inventário.
- **Teste necessário:** Execução do verificador de inventário de PII no CI.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (cadeia de consentimento imutável, rotinas de expurgo e opt-out implementadas).
- **Cobertura automatizada de testes:** Média (testes de anonimização existem, mas faltam testes de dossiê e ROPA).
- **Segurança:** Alta (criptografia e blind index garantem proteção de dados pessoais em repouso).
- **Arquitetura:** Alta (padrão append-only e isolamento de consentimento bem documentados).
- **Confiabilidade:** Média (comprometida pela falha silenciosa na gravação de `OptOutRecord`).
- **Observabilidade:** Alta (cadeia de consentimento com hashes verificáveis e ancoragem externa).
- **Manutenibilidade:** Média (arquivo monolítico em `consentAuditChain.service.ts`).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Inverter ordem de expurgo e garantir persistência transacional de `OptOutRecord` (DIV-21-001).
2. **Segurança e integridade de dados:** Implementar endpoint para exportação de Dossiê do Titular (DIV-21-002).
3. **Falhas funcionais:** Não aplicável.
4. **Confiabilidade:** Desacoplar ancoragem de hashes de consentimento para worker assíncrono (DIV-21-003).
5. **Testes:** Criar testes de regressão para todos os artigos do fluxo de direitos do titular.
6. **Arquitetura:** Automatizar o inventário de tratamento de PII via script (DIV-21-004).
7. **Melhorias estruturais:** Adicionar painel de autoatendimento para o titular revogar consentimentos.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-21-002, DIV-21-003, DIV-21-004)
- **Problemas compartilhados:** 1 (DIV-21-001 compartilhado com 01, 05 e 17)
- **Handoffs necessários:**
  - Handoff para 01: Envolver a rotina de exclusão em transação estrita no Prisma.
- **Riscos mais importantes:** A falha no registro de opt-out durante o expurgo expõe a empresa a multas e litígios por violação da LGPD; a falta de exportação de dossiê compromete a resposta a prazos da ANPD.
- **Recomendação final:** Reestruturar a transação de expurgo em `dataSubjectErasure.service.ts` como ação de alta prioridade.
