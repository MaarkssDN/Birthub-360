# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 14
- **Nome oficial:** Ambiente de Execução e Test Harness
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável por manter o gate obrigatório deste repositório **executável de verdade** e torná-lo estável entre execuções.  **Atualização de 2026-08-15 — leia antes de tudo:** o achado **ENV-001** (`npm run test:integration`/`test:e2e` "bloqueados por limitação de ambiente", migrations nunca aplicadas contra Postgres real) foi **resolvido nesta data**, fora do ciclo formal de onda — uma sessão de coordenação rodou o harness diretamente (`dockerd` subiu normalmente, sem alteração) e confirmou: `test:unit` 706/706, `test:integration` 48/48 contra Postgres 16 + pgvector + RLS real, `prisma migrate deploy` 46/46 migrations, e o passo `Run E2E Tests` do workflow `ci.yml` passou no commit `18eeaba`. O bloqueio era do ambiente daquelas sessões anteriores, não do repositório — o harness (`scripts/test/prepare-integration-env.js`) funcionou como projetado.  Isso muda sua missão de **diagnosticar e destravar** para **confirmar, estabilizar e documentar**. Três correções reais já foram commitadas nesse processo (ver `git log` no PR que introduziu este prompt): `tests/e2e/helpers.ts` ganhou `waitForAppReady()` substituindo `waitForLoadState('networkidle')` (impossível de satisfazer com o `EventSource` que `CrmBoard.tsx` mantém aberto), `.env.test.example` ganhou `AUTH_RATE_LIMIT_MAX` explícito, e `playwright.config.ts` ganhou suporte opcional a `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Não desfaça nenhuma delas sem entender o comentário que a acompanha.  Enquanto o gate não for **estável** (não só executável uma vez), nenhuma decisão de release neste repositório é honesta. Sua missão agora é fechar essa lacuna de estabilidade — não redescobrir o que já foi resolvido.
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

### ID: DEBT-OPS-001
**Título:** 62 testes co-localizados ficam fora da descoberta unitária
- **Categoria:** Testes e QA
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** vitest.unit.config.ts (linhas 35-39)
- **Evidência:** vitest.unit.config.ts (linhas 35-39)
- **Problema:** Três globs incluem tests/unit e src/**/__tests__/**/*.test.ts;62 arquivos src de teste co-localizados fora __tests__ não correspondem.
- **Causa raiz:** Três globs incluem tests/unit e src/**/__tests__/**/*.test.ts;62 arquivos src de teste co-localizados fora __tests__ não correspondem.
- **Impacto:** Regressões nesses arquivos não são exercitadas pelo gate test:unit atual.
- **Correção necessária:** Inventariar suites e incluir testes de produto no runner adequado,sem mascarar falhas novas.
- **Agente proprietário:** 14
- **Agentes dependentes:** 00 Autorização específica para remediação, Ambiente descartável do14, Revisão independente24
- **Complexidade:** M (1–3 dias de engenharia com ambiente disponível)
- **Prioridade:** P1
- **Critério de aceite:** Descoberta lista todos testes previstos; sentinela em co-localizado falha runner; happy path passa.
- **Teste necessário:** Descoberta lista todos testes previstos; sentinela em co-localizado falha runner; happy path passa.
- **Dependências:** Autorização específica para remediação, Ambiente descartável do14, Revisão independente24


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
- **Quantidade total de dívidas identificadas:** 1
- **Quantidade confirmada:** 1
- **Riscos mais importantes:** 62 testes co-localizados ficam fora da descoberta unitária
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
