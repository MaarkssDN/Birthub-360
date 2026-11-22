# Remediação de arquitetura para release AWS — 2026-10-09

Agente / Onda / Branch: Coordenador 00, execução de especialidades em fases seriais / aws-release-2026-10-09 / codex/aws-release-architecture-fix.
Autor: release_architecture. Auditor: 24, revisão ainda pendente; o autor não aprova a entrega.
Base: d930264ae60d5b4ca5026c05c4131d0bce8fb64d.
Worktree: C:\Users\marce\.codex\worktrees\aws-release-architecture\Birthub-360.

## Suposições e escopo
O usuário autorizou sincronização e deploy AWS. Esta missão prepara o código para os gates; não executa commit, push, merge ou deploy. Serviços consumidos por múltiplas features devem residir no shared existente, com fonte única e sem shared -> features. A preservação dos caminhos públicos via reexport mantém funções, classes e singleton existentes. Sem alteração de regras de negócio, tenancy, opt-out, consentimento, schema, APIs, configuração de arquitetura ou baseline.

## Plano executado e coordenação
1. Leitura de governança, prompts 00/01/17/06/07 e instruções locais shared/cadence/integrations; consulta do contrato histórico onda-7/17-para-05-06-12-contrato-optout.md. Equivalentes pesquisados antes de publicar serviços. Verificação: reuso das implementações existentes, sem serviço paralelo.
2. Baseline -> npm run test:architecture -> REPRODUZIDO, 8 imports novos entre features, exatamente os reportados pelo Coordenador.
3. Fase 01 -> publicação de optOut domain/service/Prisma adapter, LGPD optOutCheck, coldCall policy e objectionDetection em src/shared. Verificação: shared sem import de features e mesmas implementações.
4. Fase 17 -> reexports compatíveis em cadence e atualização de imports consumidores. Fase 06 -> reexport da política e email webhook consumindo shared. Fase 07 -> reexport ai-voice e imports copilot consumindo shared. Fases executadas serialmente pelo mesmo executor, sem proprietários concorrentes neste worktree. Acordo prévio registrado no handoff 00-para-01-17-06-07-servicos-transversais.md.
5. Gate após os imports -> depcruise e cobertura PASSARAM; descobriu-se bloqueio PRE-EXISTENTE em commercialIntelligence.api.ts (1004 linhas). Coordenador root autorizou explicitamente fase serial 04, com leitura do prompt04 e AGENTS local. Extração real dos três formatadores puros para presentation/formatMetrics.ts, mantendo reexports públicos. Sem apagar comentários/linhas vazias para contornar gate, sem waiver. API -> 991 linhas.
6. Coordenador root identificou falha CI 37884265146 e autorizou fase serial 08 somente testes. Leitura tests/AGENTS.md, reprodução SyncIndicator (1 falha, 4 passam). Teste dependia de um estado transitório após sync vazio resolver imediatamente; controlamos promise sync pendente e resolução para demonstrar Sincronizando DURANTE trabalho pendente e Online DEPOIS. Sem editar UI/serviço, sem fake timers ou enfraquecer asserts.
7. Gates finais -> resultados abaixo. Critério final: revisão 24 para hashes exatos + gates completos executados pelo Coordenador antes de release.

## Arquivos alterados
Implementações canônicas novas:
- src/shared/domain/optOut.ts
- src/shared/services/optOutService.ts
- src/shared/infra/PrismaOptOutRepository.ts
- src/shared/services/optOutCheck.service.ts
- src/shared/policies/coldCall.policy.ts
- src/shared/services/objectionDetection.service.ts
Reexports nos seis caminhos anteriores e imports dos consumidores: CadenceExecutionService, cadence.routes, CadenceDispatchers, emailReply.webhook, copilot/types e LiveCopilotHUD.
Fase04: commercialIntelligence.api.ts, presentation/formatMetrics.ts, __tests__/formatMetrics.unit.test.ts.
Fase08: tests/unit/components/layout/SyncIndicator.test.tsx.
Regressão: src/shared/infra/__tests__/PrismaOptOutRepository.test.ts.
Registro: este relatório e handoff de coordenação.

## Comandos e resultados reais
- npm run test:architecture baseline -> exit1, 8 violações no-cross-feature-imports; 1599 módulos/5297 dependências.
- npm run test:architecture intermediário -> imports/cobertura passam, hotspots exit1 PRE-EXISTENTE, API1004linhas.
- npm run test:architecture FINAL -> exit0; 1606 módulos/5304 dependências; cobertura1560arquivos; hotspots0bloqueios. 76 violações conhecidas ignoradas e76baseline stale continuam relatadas; baseline intacta.
- npm run lint FINAL -> exit0;1844arquivos;343warnings+1info preexistentes, nenhuma correção automática.
- npx tsc --noEmit após canonicalização -> exit0. Reexecução final após04/08: exit0, PASSOU.
- npm run build após canonicalização -> exit0;6294módulos;precache159entradas. Reexecução final após04/08: exit0, PASSOU.
- npm run test:unit -- src/features/cadence/__tests__/optOut.test.ts src/features/lgpd/services/__tests__/optOutCheck.service.test.ts src/features/integrations/birth-voice/__tests__/coldCall.policy.test.ts tests/unit/features/ai-voice/objectionDetection.service.test.ts tests/unit/features/integrations/email/emailReply.webhook.test.ts tests/unit/components/LiveCopilotHUD.test.tsx -> 6arquivos/105testes PASSARAM.
- npm run test:unit -- src/shared/infra/__tests__/PrismaOptOutRepository.test.ts -> 5/5 PASSARAM; filtro tenant e identificadores, scope/evidência persistidos, consulta vazia evitada, erro de persistência propagado e classe pública preservada.
- npm run test:unit -- tests/unit/components/layout/SyncIndicator.test.tsx baseline ->1falha/4passam, falha Sincronizando reproduzida.
- npm run test:unit -- tests/unit/components/layout/SyncIndicator.test.tsx src/features/commercial-intelligence/__tests__/formatMetrics.unit.test.ts ->2arquivos/8testes PASSARAM. Métrica ausente permanece indisponível; zero real, moeda e valores negativos preservados.
- Comparação automatizada dos6arquivos canônicos com git show HEAD:<origem>, normalizando apenas CRLF e caminhos de import -> todas as6implementações idênticas. Não alteramos regras funcionais.

## Testes, evidências e limites
TESTADO: 118 testes focados após correções. Opt-out global/canal, dados anonimizados, tenant incorreto, bloqueio dos dispatchers, webhook autorizado/negado, política de janela comercial, detecção de objeções, repositorio tenant/evidência/falha, formatação e reconexão.
NÃO EXECUTADO por este executor: suíte completa unit/integration/e2e, audit e deploy. Coordenador executará gates de release pertinentes sobre revisão integrada; não anunciar CI verde com evidência apenas local.
VERIFICADO VISUALMENTE: não realizado, mudanças de produto limitadas a imports e extração idêntica; teste React de comportamento executado. Nenhum dado pessoal real ou segredo usado em fixtures.

## Handoffs, pendências, riscos e aprendizados
Handoff de acordo permanece em-andamento até parecer24; nenhuma conclusão histórica foi fechada pelo autor. Requer revisão independente24, commit pelo Coordenador após aprovação, gates integrais e validação AWS de runtime/health.
Aprendizado: serviços opt-out/policies verdadeiramente transversais precisam de implementação shared e reexports públicos; mover somente consumidor ou adicionarbaseline mantém causa estrutural. Estado Sincronizando deve ser observado com trabalho pendente controlado; sync vazio pode terminar imediatamente e React agrupar atualizações.
Dependências locais: junction node_modules para C:\Github\Birthub-360\node_modules, apenas para validação; não versionado. Build gera dist ignorado. Não alteramos prompts, governança, package, server, workflows, migrations ou schema.
Riscos remanescentes: warnings preexistentes de lint/build e baseline arquitetural antiga explícita; release NÃO APROVADO por este autor. O gate verde local específico não substitui o auditor nem a execução integral do Coordenador.


Build FINAL: 6295 módulos, precache159entradas, verify:pwa-precache passou. git diff --check passou (avisos apenas de autocrlf). typecheck FINAL passou após todos os fontes/testes adicionais.
