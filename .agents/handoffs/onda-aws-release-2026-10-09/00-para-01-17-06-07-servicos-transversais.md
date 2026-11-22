De: 00
Para: 01, 17, 06, 07
Onda: aws-release-2026-10-09
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: release architecture gate
Sprint destino: release atual

## Problema
O gate de arquitetura reporta novos imports entre features para opt-out, janela comercial e detecção de objeções. Estes serviços são usados por múltiplos domínios; a implementação tem proprietário vertical inadequado.

## Arquivos envolvidos
cadence/application/optOutService, cadence/domain/optOut, cadence/infra/PrismaOptOutRepository; lgpd/services/optOutCheck.service; integrations/birth-voice/coldCall.policy; ai-voice/objectionDetection.service e os consumidores infratores.

## Acordo de coordenação
Coordenador root atribuiu ao executor release_architecture fases SERIAIS no worktree isolado aws-release-architecture, base d930264ae60d5b4ca5026c05c4131d0bce8fb64d: 01 publica serviços/contratos compartilhados, 17 adapta cadence e compatibilidade, 06 adapta integrations, 07 adapta AI/copilot. Sem execução concorrente dos proprietários. LGPD/opt-out permanece no escopo de segurança transversal do 01. Não alterar regras, baseline, schema ou prompts.

## Alteração necessária
Mover implementações sem alterar regras para src/shared (local existente com dono 01), preservar reexports compatíveis nos caminhos anteriores, atualizar imports novos que violam fronteiras. Nenhum shared importa features. O handoff onda-7/17-para-05-06-12-contrato-optout.md já estabelece o contrato único de opt-out e permite novo ponto público.

## Teste esperado
Reproduzir falha original; gate arquitetura sem violações novas; testes de opt-out canal/global, tenant, falha, política de horário e detecção; typecheck, lint, build. Root executa release completo e 24 revisa antes de commit/integração/deploy.

## Contexto adicional
Não transfere aprovação de release ao autor. Nenhuma mudança funcional, de persistência ou de consentimento planejada.

## Resolução
- Serviços transversais migrados canonicamente para `src/shared/`:
  - `src/shared/domain/optOut.ts`
  - `src/shared/services/optOutService.ts`
  - `src/shared/infra/PrismaOptOutRepository.ts`
  - `src/shared/services/optOutCheck.service.ts`
  - `src/shared/policies/coldCall.policy.ts`
  - `src/shared/services/objectionDetection.service.ts`
- Reexports mantidos nos caminhos de origem em cadence, lgpd, integrations e ai-voice.
- Modularização de `commercialIntelligence.api.ts` (abaixo de 1000 linhas) e extração de `src/features/commercial-intelligence/presentation/formatMetrics.ts`.
- Validação executada via `npm run test:architecture` com 100% de sucesso (exit code 0, 0 violações de hotspot, 0 cross-feature imports ilegais).
