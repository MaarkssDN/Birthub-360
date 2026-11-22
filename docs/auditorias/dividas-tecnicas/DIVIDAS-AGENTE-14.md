# Relatório de Auditoria de Dívidas Técnicas — Agente 14

## IDENTIFICAÇÃO
- **ID do agente:** 14
- **Nome oficial:** Ambiente de Execução e Test Harness
- **Especialização:** Ambientes descartáveis e isolados de teste (Docker, Testcontainers, ephemeral databases), isolamento estrito entre banco de desenvolvimento e banco operacional, fixtures sintéticas, datasets dourados (Golden Datasets) e infraestrutura de execução determinística
- **Responsabilidades:** Prover ambientes seguros e descartáveis para execução de testes unitários, integração e E2E, garantir que nenhum teste toque no container de banco operacional (`birthhub_postgres`), gerenciar ciclos de vida de containers temporários (setup e teardown) e manter a estabilidade do harness de testes.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `scripts/test/**`, `vitest.container.config.ts`, `vitest.integration.config.ts`, scripts de seed de dados e isolamento de banco.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Harness de testes de integração, scripts de preparação de ambiente (`prepare-integration-env.js`), avaliador de golden dataset (`evaluate-golden-dataset-live.ts`), orquestrador de containers efêmeros.
- **Arquivos relevantes:**
  - `scripts/test/prepare-integration-env.js`
  - `vitest.container.config.ts`
  - `vitest.integration.config.ts`
  - `scripts/evaluate-golden-dataset-live.ts`
  - `.env.test`
- **Serviços existentes:** Gerenciador de ciclo de vida de containers PostgreSQL e Redis temporários para testes.
- **APIs e integrações:** Docker Engine API, Testcontainers Node.js, Prisma Migration CLI.
- **Funcionalidades implementadas:** Provisionamento automático de banco de dados temporário em portas dinâmicas, execução de migrações em ambiente isolado, datasets de avaliação de precisão de IA.
- **Testes encontrados:** `tests/containers/health.test.ts`, suíte de integração com 85 arquivos.
- **Dependências externas:** `testcontainers`, `dotenv-cli`, Docker daemon.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-14-001
- **Título:** Script prepare-integration-env.js arrisca executar migrations no banco operacional se .env.test falhar
- **Categoria:** Segurança de Dados e Infraestrutura de Teste
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `scripts/test/prepare-integration-env.js` (linhas 15-42), `package.json`
- **Evidência:** O script verifica `process.env.DATABASE_URL` e, caso não esteja definida com porta descartável alternativa (ex.: porta 55434), herda o fallback padrão `localhost:5432/birthhub` (o mesmo banco operacional local utilizado para desenvolvimento manual).
- **Problema:** Um desenvolvedor ou script que execute `npm run test:integration` sem o prefixo `dotenv-cli -e .env.test` acidentalmente executa comandos destrutivos de reset e migração (`prisma migrate deploy`) sobre o banco de dados de desenvolvimento local (`birthhub_postgres`), apagando cadastros e configurações manuais.
- **Causa raiz:** O script não possui uma trava de segurança que recuse explicitamente conexões cujo nome de banco ou porta correspondam ao banco operacional de desenvolvimento.
- **Impacto:** Risco de perda de dados locais de trabalho e contaminação do banco de testes com dados reais de desenvolvimento.
- **Correção necessária:** Adicionar trava de guarda estrita em `prepare-integration-env.js`: se a `DATABASE_URL` apontar para a porta padrão 5432 ou se o nome do banco não contiver `_test` ou prefixo de container temporário, o script aborta imediatamente com `process.exit(1)` e mensagem de erro explicativa.
- **Agente proprietário:** 14
- **Agentes dependentes:** 01 (Banco de Dados), 08 (QA de Scripts)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Executar o script apontando para `localhost:5432/birthhub` é imediatamente bloqueado com código 1 e aviso de segurança.
- **Teste necessário:** Teste de regressão com simulação de variáveis apontando para banco de produção/desenvolvimento.
- **Dependências:** Nenhuma.

### ID: DIV-14-002
- **Título:** Ausência de teardown determinístico para containers efêmeros em caso de cancelamento por SIGINT
- **Categoria:** Infraestrutura e Recursos
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `scripts/test/prepare-integration-env.js` (linhas 60-95), `vitest.integration.config.ts`
- **Evidência:** Quando o desenvolvedor interrompe a execução da suíte de testes de integração pressionando `Ctrl+C` (SIGINT) no terminal, o processo Node encerra imediatamente sem disparar os hooks de limpeza do Docker (`container.stop()` / `container.remove()`).
- **Problema:** Containers PostgreSQL e Redis órfãos continuam rodando em segundo plano consumindo portas dinâmicas e memória RAM na máquina do desenvolvedor, gerando erros de "port already in use" em execuções posteriores.
- **Causa raiz:** O harness não registra listeners de sinais de processo (`process.on('SIGINT')`, `process.on('SIGTERM')`) para garantir o encerramento limpo dos containers antes da saída.
- **Impacto:** Acúmulo de dezenas de containers zumbis no Docker local; lentidão e travamentos por esgotamento de memória no host.
- **Correção necessária:** Registrar handlers globais de sinais de encerramento (`SIGINT`, `SIGTERM`, `uncaughtException`) que invoquem a limpeza síncrona/imediata de todos os containers criados pelo harness.
- **Agente proprietário:** 14
- **Agentes dependentes:** 10 (SRE e Docker)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Interrupção forçada com Ctrl+C durante a execução de testes remove 100% dos containers temporários criados em menos de 3 segundos.
- **Teste necessário:** Simulação de cancelamento de processo e inspeção de `docker ps` pós-interrupção.
- **Dependências:** Nenhuma.

### ID: DIV-14-003
- **Título:** Falta de seed automático de entidades de compliance e opt-out no provisionamento do banco de teste
- **Categoria:** Testes e Integridade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `scripts/test/prepare-integration-env.js` (linhas 70-85), `tests/fixtures/**`
- **Evidência:** O setup de integração aplica apenas as migrations DDL do Prisma, mas não executa um seed consistente de dados base essenciais de conformidade (ex.: tabela de registros de opt-out, templates de termos de uso e consentimento vigentes).
- **Problema:** Testes de integração de prospecção e LGPD precisam recriar manualmente mocks de opt-out e consentimento em cada arquivo de teste individualmente, gerando duplicação de código de fixture e falhas intermitentes quando o schema muda.
- **Causa raiz:** O provisionamento de teste focou apenas na estrutura de tabelas sem definição de um estado inicial de dados de compliance.
- **Impacto:** Testes de regras de privacidade tornam-se frágeis e suscetíveis a falsos positivos por falta de baseline padronizada.
- **Correção necessária:** Criar rotina padronizada de seed (`scripts/test/seed-test-baseline.ts`) injetando dados mínimos de tenant, usuário administrador, política LGPD e registros de supressão de teste antes de iniciar os testes.
- **Agente proprietário:** 14
- **Agentes dependentes:** 01 (Prisma), 21 (LGPD)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Todo banco descartável inicializado para testes de integração já contém organização padrão de teste e registros canônicos de opt-out pré-populados.
- **Teste necessário:** Verificação em teste de integração de que a tabela `OptOutRecord` já possui registros de controle sem necessidade de `beforeAll` customizado.
- **Dependências:** Alinhamento com Agente 21.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (harness permite rodar testes de integração isolados do banco principal).
- **Cobertura automatizada de testes:** Alta (mais de 600 asserções de integração executadas em ambiente descartável).
- **Segurança:** Média (necessita trava rígida contra apontamento acidental para banco operacional).
- **Arquitetura:** Alta (isolamento por portas dinâmicas e volumes temporários).
- **Confiabilidade:** Média (afetada pelo acúmulo de containers órfãos em cancelamentos prematuros).
- **Observabilidade:** Alta (logs de inicialização de containers claros no terminal).
- **Manutenibilidade:** Alta (código do harness em scripts limpos e diretos).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Inserir trava de aborto obrigatório em `prepare-integration-env.js` caso a URL aponte para o banco padrão 5432 (DIV-14-001).
2. **Segurança e integridade de dados:** Não aplicável.
3. **Falhas funcionais:** Adicionar handlers de `SIGINT`/`SIGTERM` para destruição limpa de containers temporários (DIV-14-002).
4. **Confiabilidade:** Criar script de seed automatizado de compliance para o banco de testes (DIV-14-003).
5. **Testes:** Criar teste de verificação da trava de segurança do banco.
6. **Arquitetura:** Parametrizar tempos de timeout para containers lentos no Windows.
7. **Melhorias estruturais:** Documentar o fluxo de testes em containers no `docs/development/`.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-14-001, DIV-14-002)
- **Problemas compartilhados:** 1 (DIV-14-003 compartilhado com 01 e 21)
- **Handoffs necessários:**
  - Handoff para 21: Fornecimento de dados sintéticos de consentimento para a baseline de testes.
- **Riscos mais importantes:** A ausência de bloqueio no script de pré-teste arrisca sobrescrever dados de desenvolvimento local; acúmulo de containers órfãos esgota a memória do host.
- **Recomendação final:** Blindar o `prepare-integration-env.js` com a trava de porta/banco proibido imediatamente.
