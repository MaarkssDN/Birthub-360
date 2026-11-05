# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 08
- **Nome oficial:** QA, Documentation, CI/CD, Deploy & Release Gatekeeper
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é o guardião final de qualidade e release. Você não "dá uma olhada": você reproduz, testa, corrige o que pertence ao seu domínio e rejeita release quando houver bloqueador.
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

### ID: DEBT-GATE-001
**Título:** Gate local de lançamento (scripts/release-gate.js) emite STATUS: GO mesmo com typecheck e lint falhando
- **Categoria:** Testes e QA
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** scripts/release-gate.js (linhas 38-65), docs/release/GO-LIVE-CHECKLIST.md (linhas 1-15)
- **Evidência:** scripts/release-gate.js (linhas 38-65), docs/release/GO-LIVE-CHECKLIST.md (linhas 1-15)
- **Problema:** O script scripts/release-gate.js (invocado por npm run release:check) configura lint e typecheck como opcionais (optional: true) e não executa test:architecture, test:integration, test:e2e nem npm audit. Na reprodução controlada, quando typecheck retorna exit code 1, o script ainda imprime STATUS: GO e encerra com exit 0.
- **Causa raiz:** Flexibilização temporária de checks no script local nunca revertida para refletir os gates obrigatórios do AGENTS.md §28.
- **Impacto:** Falsa certificação de prontidão de release em execuções locais antes de integração ou deploy.
- **Correção necessária:** Tornar lint e typecheck estritamente obrigatórios em scripts/release-gate.js, incluir test:architecture, test:integration, test:e2e e npm audit, e falhar se qualquer script estiver ausente em package.json.
- **Agente proprietário:** 08
- **Agentes dependentes:** 08, 00, 24 Revisão independente Agente 24
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** verify-release-gate.mjs comprova exit 1 (NO-GO) para falha individual em qualquer um dos 8 gates obrigatórios ou script ausente.
- **Teste necessário:** Teste automatizado com 11 cenários de spawnSync simulando falha individual de cada gate e sucesso global
- **Dependências:** Revisão independente Agente 24

### ID: DEBT-OPS-002
**Título:** Reinstalação Prisma na imagem permite resolver versão fora lock
- **Categoria:** Build
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** Dockerfile (linhas 43-47)
- **Evidência:** Dockerfile (linhas 43-47)
- **Problema:** npm prune remove CLI e npm install --no-save utiliza range do manifesto(^7.10.0),sem versão exata do lock.
- **Causa raiz:** npm prune remove CLI e npm install --no-save utiliza range do manifesto(^7.10.0),sem versão exata do lock.
- **Impacto:** Imagem pode variar entre builds do mesmo commit e divergir CLI/client.
- **Correção necessária:** Preservar CLI necessária ou instalar versão exata e árvore determinada pelo lock.
- **Agente proprietário:** 08
- **Agentes dependentes:** 00 Autorização específica para remediação, Ambiente descartável do14, Revisão independente24
- **Complexidade:** M (1–3 dias de engenharia com ambiente disponível)
- **Prioridade:** P2
- **Critério de aceite:** Build isolado sem resolução semver adicional; CLI/client iguais ao lock; migrate falha bloqueia boot.
- **Teste necessário:** Build isolado sem resolução semver adicional; CLI/client iguais ao lock; migrate falha bloqueia boot.
- **Dependências:** Autorização específica para remediação, Ambiente descartável do14, Revisão independente24

### ID: DEBT-OPS-003
**Título:** Contexto Docker não exclui cópias e artefatos temporários locais
- **Categoria:** Infraestrutura e DevOps
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** .dockerignore (linhas 1-5)
- **Evidência:** .dockerignore (linhas 1-5)
- **Problema:** Exclusões não cobrem .worktrees/ e .tmp/ e builder usa COPY . .; checkout local possui esses diretórios.
- **Causa raiz:** Exclusões não cobrem .worktrees/ e .tmp/ e builder usa COPY . .; checkout local possui esses diretórios.
- **Impacto:** Build pode transferir cópias de repo e artefatos não necessários,aumentando contexto e prejudicando reprodutibilidade. Segredos nesses diretórios não foram examinados nem alegados.
- **Correção necessária:** Excluir diretórios efêmeros do contexto e verificar manifest de arquivos de build.
- **Agente proprietário:** 08
- **Agentes dependentes:** 00 Autorização específica para remediação, Ambiente descartável do14, Revisão independente24
- **Complexidade:** M (1–3 dias de engenharia com ambiente disponível)
- **Prioridade:** P2
- **Critério de aceite:** Fixture .tmp/.worktrees desaparece do contexto enquanto migrations e fontes necessárias permanecem.
- **Teste necessário:** Fixture .tmp/.worktrees desaparece do contexto enquanto migrations e fontes necessárias permanecem.
- **Dependências:** Autorização específica para remediação, Ambiente descartável do14, Revisão independente24

### ID: DEBT-DOC-001
**Título:** Instrução de subir stack em LOCAL_FIRST.md e GO-LIVE-CHECKLIST.md omite overlay do PostgreSQL obrigatório para migrations
- **Categoria:** Documentação
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** docs/development/LOCAL_FIRST.md (linhas 65-74), docs/release/GO-LIVE-CHECKLIST.md (linhas 8-14)
- **Evidência:** docs/development/LOCAL_FIRST.md (linhas 65-74), docs/release/GO-LIVE-CHECKLIST.md (linhas 8-14)
- **Problema:** O guia docs/development/LOCAL_FIRST.md:68 e o checklist docs/release/GO-LIVE-CHECKLIST.md:10 mandam executar 'docker compose up -d' seguido de 'npx prisma migrate deploy'. Contudo, o serviço postgres foi movido para o overlay docker-compose.postgres-local.yml, fazendo com que a porta 5434 não suba com o comando padrão.
- **Causa raiz:** Extração do container PostgreSQL para arquivo compose de overlay sem atualização correspondente nos guias operacionais.
- **Impacto:** Falha imediata de conexão na etapa de migração ao provisionar ambiente novo seguindo a documentação oficial.
- **Correção necessária:** Atualizar LOCAL_FIRST.md e GO-LIVE-CHECKLIST.md para incluir '-f docker-compose.yml -f docker-compose.postgres-local.yml' e explicitar que o compose sobe apenas a infraestrutura.
- **Agente proprietário:** 08
- **Agentes dependentes:** 08, 10, 18 Revisão independente Agente 24
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Asserção automatizada confirma presença do comando composto nos dois documentos.
- **Teste necessário:** Asserção em verify-release-gate.mjs validando o comando documental exato
- **Dependências:** Revisão independente Agente 24


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
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade confirmada:** 4
- **Riscos mais importantes:** Gate local de lançamento (scripts/release-gate.js) emite STATUS: GO mesmo com typecheck e lint falhando; Reinstalação Prisma na imagem permite resolver versão fora lock; Contexto Docker não exclui cópias e artefatos temporários locais; Instrução de subir stack em LOCAL_FIRST.md e GO-LIVE-CHECKLIST.md omite overlay do PostgreSQL obrigatório para migrations
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
