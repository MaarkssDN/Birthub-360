# Parecer 24 — remediação de arquitetura para AWS

Missão/onda: aws-release-remediation-2026-10-09.
Autor: release_architecture, fases seriais coordenadas pelo 00. Auditor: sync_auditor24.
Base: d930264ae60d5b4ca5026c05c4131d0bce8fb64d.
Branch auditada: codex/aws-release-architecture-fix, arquivos ainda não commitados.
Decisão: APROVADO exclusivamente para commit e PR em rascunho para CI dos 25 arquivos identificados abaixo. Merge e deploy NÃO APROVADOS por este parecer.

## Escopo, suposições e propriedade

Correção do bloqueio de imports entre features por canonicalização dos serviços existentes em shared; extração de três formatadores puros para eliminar hotspot real; estabilização do teste SyncIndicator sem alterar produto. Coordenação serial 01/17/06/07 registrada no handoff; extensões 04 e 08 autorizadas pelo 00 e registradas no relatório. Não houve alteração de schema, API, regras de negócio, prompts, governança, baseline de arquitetura ou workflow. Não há autorização para relaxar gates.

## Critérios e evidências

- Diff integral, arquivos novos e relatório examinados. Comparação independente das seis implementações canônicas com git show HEAD:<origem>: todas idênticas normalizando apenas CRLF e especificadores de import. Importações atualizadas apontam para as mesmas implementações. Os seis arquivos legados reexportam a implementação única, preservando identidade de classe/singleton e API pública.
- Três formatadores extraídos mantêm exatamente o conteúdo original. API conserva reexports públicos; nenhuma regra comercial foi alterada. Testes distinguem ausência de métrica de zero real.
- Teste SyncIndicator controla promise realmente pendente, mantém assert Sincronizando e exige Online após conclusão; não esconde estado por timeout maior, fake timers ou remoção de assert.
- Repositório mantém filtro organizationId e identificadores, preserva escopo/evidência, evita consulta geral sem identificadores e propaga erros. Serviço LGPD conserva bloqueios por tenant, anonimização e opt-out. Não há mudança de retenção, coleta ou transferência de dados pessoais.
- Shared sem novos imports de features, sem ciclo criado. Mesmo logger/prisma/phone e dataSubjectErasure canônicos; nenhuma implementação duplicada.
- Varredura independente dos 25 conteúdos por padrões de private keys, AWS access keys, tokens GitHub/OpenAI e URLs de banco com credencial: zero ocorrências. Fixtures usam dados de teste. git diff --check: exit0, avisos CRLF somente.
- Autor reportou typecheck, lint, build e arquitetura finais exit0, e 118 testes focados aprovados. Esses resultados foram lidos no relatório da revisão congelada; não foram anunciados como CI atual.

## Testes e limites

Auditor executou novamente `npm run test:unit -- <nove arquivos focados>`: exit0, 9 arquivos e 118 testes PASSARAM, duração 41,70s. Inclui opt-out, LGPD, coldCall, objectionDetection, emailReply, HUD, repositório shared, formatadores e SyncIndicator. Não foram usados dados pessoais reais.

Typecheck/lint/build/arquitetura não repetidos pelo auditor porque constam execução final específica no relatório e não houve alteração posterior de conteúdo entre leitura e hashes. Aceitação para CI não equivale a gate de release. Suítes completas unit/integration/e2e, npm audit, validação da imagem Linux, migrations/readiness/version real e rollback continuam necessários antes de merge/release. Visualização manual não aplicável aos imports/extrações sem mudança visual; teste React de estado pertinente executado.

## Achados e riscos remanescentes

Nenhum bloqueador identificado na remediação estrutural. PRE-EXISTENTE: serviço de objectionDetection contém roteiros de prova social, valores de retorno e resultados comerciais cuja origem não é demonstrada por esta auditoria. Foram preservados byte semanticamente; aprovação da movimentação não certifica essas alegações ou o serviço inteiro. Encaminhado ao 00 para propriedade 07/02, fora da remediação estrutural atual.

Warnings e baseline arquitetural antiga continuam explícitos no relatório. Preservação sem mudança de regras evita regressão por refactor, mas não prova que todo comportamento histórico estava correto.

## Pendências e decisão operacional

Somente commit/PR de CI aprovados. Qualquer alteração nos conteúdos auditados exige nova revisão; CRLF normalizado pelo Git deve ser verificado como mudança de representação, sem alteração semântica. Não fechar handoff histórico nem declarar deploy concluído com este parecer. Exigir SHA final, gates pertinentes e plano concreto de switch/rollback para novo parecer de release.

Nenhuma edição de produto pelo auditor; único arquivo escrito por este executor é o presente parecer em worktree isolado.

## Manifesto SHA-256 da revisão auditada

Hashes dos bytes locais antes do commit; identificam arquivos rastreados alterados e todos os novos arquivos não ignorados.
- .agents/handoffs/onda-aws-release-2026-10-09/00-para-01-17-06-07-servicos-transversais.md — 7de83fcb9235d282629a17116d2a68e2ab57798bd814b77ab030ff6dfd2df0c6
- .agents/runs/aws-release-architecture-2026-10-09.md — e41457261780bab22d9f35c4ada705ebe1baa2d4ff13e3bbde321333ff682604
- src/features/ai-voice/objectionDetection.service.ts — 98534905a03ed0f574ee42bdea61c0e7b06136c6ce851532464626f3487d16e5
- src/features/cadence/application/CadenceExecutionService.ts — 6899fb66e3fd635fec3fb6f8ea7dde92938675594149dd68f34ec85590bd63d5
- src/features/cadence/application/optOutService.ts — 96ebae34dd75cf1b6e0d0c127b503c7c13f1e18b1e1138cce59c293e4b483c57
- src/features/cadence/cadence.routes.ts — 85f713f6e5cb6d4fe2d097d532984ca59f11ffddc1ea494f6936d1ccb52f9faa
- src/features/cadence/domain/optOut.ts — ee83d37e15579d0faf337a3d6e339ae269e16004a6eb53946c44dc11cead1c79
- src/features/cadence/infra/dispatchers/CadenceDispatchers.ts — 697d7c653c3fb7044558ba6edf47e64c35db1da233e8cd6ea85ab88064b49119
- src/features/cadence/infra/PrismaOptOutRepository.ts — 5909e927b375114d63246760df53f04179cd7107b6fe1296592568187486cc21
- src/features/commercial-intelligence/__tests__/formatMetrics.unit.test.ts — 7e9a17ff55cc500764c11031d7415434670adef83ab82bd178a8b9b24265d7f5
- src/features/commercial-intelligence/commercialIntelligence.api.ts — 703f55c1b0d64a8c08a48a0933a1f6d3baf595a2ed437ea491adce128cc97982
- src/features/commercial-intelligence/presentation/formatMetrics.ts — 6d5ee08f209c7f6c84da53c95e8edb1d5016635285386aef3a88d3ad744c687f
- src/features/copilot/components/LiveCopilotHUD.tsx — 29d304a00369ee496ab2c0bf8febcafa19233f15d6ea94e0f98766ce835b7ac8
- src/features/copilot/types.ts — 43afb7ae9d3c1619471015f42bceff359b2ce653306a83abda9b3f843fdb34d3
- src/features/integrations/birth-voice/coldCall.policy.ts — a2b83b39185afcf998870b244bbfbe2348034a89bacb3aa24d1bfbe980457fb2
- src/features/integrations/email/emailReply.webhook.ts — ea8a0a7904c64762d8958ca339fb8de9cd9b032d145ea26a751bf9ebf0ccf339
- src/features/lgpd/services/optOutCheck.service.ts — b92e279bbb81bc125ecc065eb7534ed973235d6827bd2b24ed5013d6d72d05ba
- src/shared/domain/optOut.ts — 4989c1ae8f8c801f28d10cf2d5c7956d84617094813411e6ce337949d88d001b
- src/shared/infra/__tests__/PrismaOptOutRepository.test.ts — aa3e8db0a946258659cdaa81e86c26c57fe210813673d22ffe9ffa7a0376e439
- src/shared/infra/PrismaOptOutRepository.ts — ad7460290bfcfd8aaebbedd983674ed1408716a5b57c1d55a8d14cf5ca346a17
- src/shared/policies/coldCall.policy.ts — 4100748aae19a85019be4662bf8f80636a7978ef23800b451b9d3ccf195264e3
- src/shared/services/objectionDetection.service.ts — e3831f1daab8fa76098b58ed5da47399a625051b69b624ce69e446667d7d29e8
- src/shared/services/optOutCheck.service.ts — 6c5ccb0594d0a40ee0c49a6d0199ffb61b3f6b5af77a22c1e2e6f68225a53219
- src/shared/services/optOutService.ts — d0a0ff02b47fc08c85a73645b2d2bfb66f0b77ebd793cbf8fe622148c88866d6
- tests/unit/components/layout/SyncIndicator.test.tsx — 95e90c7237f916c878c3970645b1a5f8c0f795dee8ea2a2e0ad3843a38d038df
