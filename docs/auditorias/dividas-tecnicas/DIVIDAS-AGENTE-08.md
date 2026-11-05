# Relatório de Auditoria de Dívidas Técnicas — Agente 08

## IDENTIFICAÇÃO
- **ID do agente:** 08
- **Nome oficial:** QA, Testes, Performance e Release
- **Especialização:** Garantia de qualidade (QA), esteiras de testes automatizados (unitários, integração, E2E Playwright, arquitetura), gates de release, Dockerfile e orquestração de containers de teste
- **Responsabilidades:** Propriedade exclusiva de `.github/workflows/**`, `Dockerfile` e `docker-compose.yml` (`AGENTS.md` §15), validação de todos os gates de qualidade obrigatórios do §28, manutenção do script de verificação de release (`scripts/release-gate.js`) e conformidade com os critérios de aceite antes de integrações.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `scripts/release-gate.js`, `vitest.*.config.ts`, `playwright.config.ts`, `Dockerfile`, `.dockerignore`, `docker-compose*.yml`, suítes de testes em `tests/**` e `src/**`.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Infraestrutura de testes automatizados, scripts de release gate, configurações do Vitest, Playwright E2E e Visual, empacotamento Docker de produção.
- **Arquivos relevantes:**
  - `scripts/release-gate.js` (verificador formal de prontidão para release)
  - `vitest.unit.config.ts`
  - `vitest.integration.config.ts`
  - `playwright.config.ts`
  - `Dockerfile` (definição de imagem de produção Node 22)
  - `.dockerignore`
  - `docker-compose.yml`
- **Serviços existentes:** Scripts de execução de testes com isolamento de banco descartável, rotinas de auditoria de dependências (`npm audit`), verificador de orçamento de bundle.
- **APIs e integrações:** GitHub Actions Runners, Docker Buildx, SonarQube Scanner, Trivy Vulnerability Scanner.
- **Funcionalidades implementadas:** Suíte unitária com mais de 4.100 testes, 85 arquivos de testes de integração, testes visuais de regressão, verificação automatizada de dependências circulares.
- **Testes encontrados:** Mais de 4.120 testes unitários passando, suíte de arquitetura do dependency-cruiser com 0 erros.
- **Dependências externas:** `vitest`, `@playwright/test`, `docker`, `dependency-cruiser`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-08-001 (DEBT-GATE-001)
- **Título:** Gate local de lançamento emite STATUS: GO mesmo com typecheck e lint falhando devido a flags de tolerância
- **Categoria:** Testes e QA
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `scripts/release-gate.js` (linhas 38-65), `docs/release/GO-LIVE-CHECKLIST.md`
- **Evidência:** O script `release-gate.js` (invocado por `npm run release:check`) configurava as verificações de `lint` e `typecheck` com a flag `optional: true`. Além disso, o script não invocava os comandos obrigatórios `test:architecture`, `test:integration`, `test:e2e` nem `npm audit`. Em reprodução controlada, quando o TypeScript reporta exit code 1, o script ainda emitia `STATUS: GO` e encerrava com código de saída 0.
- **Problema:** Falsa certificação de aprovação para release em execuções locais, permitindo que alterações com quebras de compilação ou violações de regras sejam tidas como prontas para deploy.
- **Causa raiz:** Flexibilização temporária introduzida no passado para testes de protótipos que nunca foi revertida para cumprir integralmente o `AGENTS.md` §28.
- **Impacto:** Risco crítico de liberação de código quebrado para produção ou homologação.
- **Correção necessária:** Tornar obrigatórios (`optional: false`) todos os 8 gates do §28 (`typecheck`, `lint`, `test:architecture`, `test:unit`, `test:integration`, `test:e2e`, `build` e `npm audit`), e falhar se qualquer um retornar código de saída diferente de 0.
- **Agente proprietário:** 08
- **Agentes dependentes:** 00 (Coordenação de Release), 24 (Revisão Independente)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** O script `scripts/release-gate.js` emite `STATUS: NO-GO` e encerra com exit code 1 para qualquer falha individual nos 8 gates obrigatórios.
- **Teste necessário:** Teste automatizado com 11 cenários de `spawnSync` simulando falha individual em cada etapa e sucesso global apenas quando todas passam.
- **Dependências:** Nenhuma.

### ID: DIV-08-002 (DEBT-OPS-001)
- **Título:** 62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest
- **Categoria:** Testes e Qualidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `vitest.unit.config.ts` (linhas 15-28), diretório `src/features/**`
- **Evidência:** A configuração do Vitest utiliza o padrão de inclusão `include: ['tests/unit/**/*.{test,spec}.ts(x)']`. Existem 62 arquivos de teste com sufixo `.test.ts` e `.spec.ts` criados diretamente ao lado dos componentes em `src/features/**` (ex.: `src/features/cadence/dialer/application/__tests__/**`). Esses arquivos nunca são executados durante o comando `npm run test:unit`.
- **Problema:** Dezenas de casos de teste escritos por especialistas de domínio não são avaliados nos gates de qualidade contínua, permitindo que regressões passem despercebidas.
- **Causa raiz:** Falta de unificação entre a convenção de testes centralizados em `tests/` e testes co-localizados em `src/`.
- **Impacto:** Falsa impressão de alta cobertura; funcionalidades críticas podem ter seus testes unitários quebrados sem alerta no CI.
- **Correção necessária:** Atualizar `vitest.unit.config.ts` para incluir tanto `tests/unit/**/*.{test,spec}.ts(x)` quanto `src/**/*.{test,spec}.ts(x)`, garantindo a execução de todos os testes unitários do repositório.
- **Agente proprietário:** 08
- **Agentes dependentes:** 14 (Harness de Testes), 24 (Revisão Independente)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** O comando `npm run test:unit` descobre e executa os 62 arquivos co-localizados adicionais, reportando o novo total consolidado de testes.
- **Teste necessário:** Execução de `npm run test:unit` e verificação da lista de arquivos testados no relatório de cobertura.
- **Dependências:** Verificar e corrigir previamente se algum dos 62 testes está quebrado.

### ID: DIV-08-003 (DEBT-OPS-002)
- **Título:** Dockerfile reinstala Prisma CLI em etapa sem lock estrito versionado arriscando versão divergente
- **Categoria:** Confiabilidade e Infraestrutura
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `Dockerfile` (linhas 45-58)
- **Evidência:** Durante o estágio de empacotamento, o Dockerfile executava `npm install -g prisma` ou `npx prisma generate` em imagem limpa sem fixar a versão exata através do `package-lock.json`.
- **Problema:** A imagem Docker de produção pode resolver uma versão minor/patch mais recente do Prisma do que aquela homologada localmente, introduzindo incompatibilidades silenciosas no motor de query (`schema-engine`).
- **Causa raiz:** Otimização para reduzir o tamanho da imagem intermediária executando comandos avulsos do npm.
- **Impacto:** Falhas inesperadas em tempo de inicialização de containers em ambientes Kubernetes ou AWS ECS.
- **Correção necessária:** Utilizar estritamente `npm ci --ignore-scripts` copiando `package.json` e `package-lock.json` para o estágio de build da imagem Docker.
- **Agente proprietário:** 08
- **Agentes dependentes:** 01 (Prisma e Banco), 08A (Deploy AWS)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** `docker buildx build` gera imagem com versão do Prisma idêntica à do `package-lock.json` comprovada via `docker run --rm <imagem> npx prisma --version`.
- **Teste necessário:** Inspeção de binário e versão na imagem gerada.
- **Dependências:** Nenhuma.

### ID: DIV-08-004 (DEBT-OPS-003)
- **Título:** Contexto Docker envia worktrees e artefatos temporários locais aumentando tempo de build
- **Categoria:** Performance e Infraestrutura
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `.dockerignore` (linhas 1-25)
- **Evidência:** O arquivo `.dockerignore` não continha entradas para pastas como `.worktrees/`, `scratch/`, `coverage/`, `.claude/` e dumps de testes.
- **Problema:** Ao executar `docker build`, o daemon do Docker transfere centenas de megabytes de dados de diretórios locais de desenvolvimento pela socket de rede, tornando o build local lento e consumindo disco desnecessário.
- **Causa raiz:** O `.dockerignore` inicial contemplou apenas `node_modules` e `.git`, sem acompanhar a adoção de worktrees e scratchpads.
- **Impacto:** Desperdício de tempo de engenharia durante o empacotamento de containers; risco de vazamento de arquivos de scratch em camadas intermediárias de build.
- **Correção necessária:** Adicionar `.worktrees/`, `scratch/`, `coverage/`, `.claude/` e arquivos de relatório em `.dockerignore`.
- **Agente proprietário:** 08
- **Agentes dependentes:** 00 (Governança de Worktrees)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O contexto transferido no início do build Docker não excede 50MB.
- **Teste necessário:** Medição do tamanho de contexto transferido em `docker buildx build --progress=plain .`.
- **Dependências:** Nenhuma.

### ID: DIV-08-005 (DEBT-DOC-001)
- **Título:** Instrução de inicialização do stack local omite overlay de PostgreSQL obrigatório para migrations
- **Categoria:** Documentação e Operação
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `docs/development/LOCAL_FIRST.md`, `docs/release/GO-LIVE-CHECKLIST.md`
- **Evidência:** Os guias instruíam a subir o ambiente executando apenas `docker-compose up -d`, omitindo a flag `-f docker-compose.postgres-local.yml` que contém as portas expostas e configurações de RLS necessárias para executar `prisma migrate deploy` fora do container.
- **Problema:** Desenvolvedores iniciantes encontram erro de recusa de conexão com o PostgreSQL na porta 5432 ao tentar rodar migrações.
- **Causa raiz:** Separação do compose em múltiplos overlays sem atualização correspondente nos manuais de início rápido.
- **Impacto:** Fricção no onboarding de novos engenheiros e perda de tempo em setup de ambiente.
- **Correção necessária:** Atualizar os documentos para prescrever o comando unificado `npm run infra:up` que já embute todos os overlays necessários.
- **Agente proprietário:** 08
- **Agentes dependentes:** 18 (Documentação Viva)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** O comando documentado em `LOCAL_FIRST.md` sobe o PostgreSQL com a porta 5432 acessível e migrações aplicáveis de primeira.
- **Teste necessário:** Execução dos passos de instalação em máquina limpa seguindo o manual.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (pipeline com testes unitários, integração, E2E e checagens arquiteturais).
- **Cobertura automatizada de testes:** Alta (mais de 4.100 testes unitários passando, 0 erros no dependency-cruiser).
- **Segurança:** Alta (varreduras com Trivy e CodeQL configuradas nos pipelines).
- **Arquitetura:** Alta (scripts de teste bem distribuídos).
- **Confiabilidade:** Média (afetada pela tolerância permissiva no script `release-gate.js`).
- **Observabilidade:** Alta (relatórios de teste em JUnit, SARIF e coverage HTML).
- **Manutenibilidade:** Alta (configurações do Vitest e Playwright consolidadas).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Tornar o `scripts/release-gate.js` estritamente intolerante a falhas (DIV-08-001).
2. **Segurança e integridade de dados:** Garantir uso estrito de `npm ci` no Dockerfile para evitar versões divergentes do Prisma (DIV-08-003).
3. **Falhas funcionais:** Incluir os 62 testes co-localizados no `vitest.unit.config.ts` (DIV-08-002).
4. **Confiabilidade:** Otimizar o `.dockerignore` para reduzir o contexto de build (DIV-08-004).
5. **Testes:** Automatizar a verificação dos 11 cenários do release gate via script de teste.
6. **Arquitetura:** Manter 0 violações no dependency-cruiser.
7. **Melhorias estruturais:** Unificar os comandos de subida de infraestrutura no `LOCAL_FIRST.md` (DIV-08-005).

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 5
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 2 Médias, 1 Baixa
- **Quantidade confirmada:** 5
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 4 (DIV-08-001, DIV-08-002, DIV-08-003, DIV-08-004)
- **Problemas compartilhados:** 1 (DIV-08-005 compartilhado com 18)
- **Handoffs necessários:**
  - Handoff para 18: Alinhamento de manuais de instalação rápida no `docs/`.
- **Riscos mais importantes:** A permissividade no script de release gate representa risco de liberação acidental de código quebrado; a exclusão dos 62 testes co-localizados mascara regressões em features críticas.
- **Recomendação final:** Blindar o script `scripts/release-gate.js` e atualizar a configuração de descoberta do Vitest imediatamente.
