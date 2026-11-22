# Parecer independente — PR #237 — retomada
Data: 2026-11-12
Auditor: Agente 24. Autor original: Agente 01; correção incremental: Agente 08, aplicada pelo Coordenador.
Base: 94f95097b5d9a46ea7745bd074db9c77fe159004
Revisão anterior: 46235a57f5f7ca896d628429622951f2f0b7c7dd
Revisão auditada: 7b6f889d1cfb5d0a31c7fce3d06f7189ad8faee4
Branch: agente-01/fix-e2e-hang
Blob helpers.ts: b5c1d0f4ee3cf50cc5f68cefc3fce270ebbe35bc

## Escopo e método
Leitura independente de AGENTS.md, prompt 24, diff dos 11 arquivos anteriores, handoff de aceite ao 02, discussão CodeRabbit e CI. O incremento atual modifica somente tests/e2e/helpers.ts: quatro linhas adicionadas, nenhuma removida. Conteúdo conferido no SHA atual. Sem execução local de aplicação ou inspeção visual pelo auditor. Sem alteração de produto, contratos, tenancy, LGPD, dependências, workflows, timeout ou tolerâncias visuais.

## Achado e correção
Antes, clicar no rail e depois no item CRM duplicava o histórico. A CI anterior confirmou que page.goBack esperava /app e recebia /app/crm (crm.spec.ts:84).
Agora o helper espera dest.url por 1.000ms após o rail e retorna quando alcançado; caso contrário preserva o clique no item. Correção estática conferida. O limite de 1.000ms precisa ser observado na aplicação real. Harness informado pelo 08: 3/3 aprovado; não equivale a E2E, lint, typecheck ou build do novo SHA.

## Evidências anteriores — não são resultados do SHA atual
Release: https://github.com/marcelinhomarkss-rgb/Birthub-360/actions/runs/43146978430
Job 130949250662: npm run test:e2e terminou em 34,3 minutos; 43 failed, 1 skipped, 100 passed; saída 1. Lint, formato, tipos, unitários, integração, build, smoke e segurança passaram nesse run. Gate global vermelho.
VR: https://github.com/marcelinhomarkss-rgb/Birthub-360/actions/runs/43146977897
Job 130946965632: 88 falhas. Login claro desktop: 83.437 pixels diferentes (0,07), screenshot estável e repetição no retry. Não aceitar baselines automaticamente.
Falhas adicionais: seletores comerciais antigos ADMIN/GESTOR; contraste sério no login 4,34:1 versus mínimo 4,5:1 (quatro ocorrências); locators de headline/e-mail ambíguos e onboarding. Sem comparação funcional da base, não atribuir tudo ao PR.
Aceite documental 02: e03bbc2618212b0646204facc8754309ef93dd98. Teste unitário CSS/DOM não substitui validação visual móvel; handoff menciona getComputedStyle, mas jsdom tem limitação declarada.

## Encaminhamentos e critérios
- 08: validar histórico CRM e destinos diferentes da home no novo SHA; executar gates pertinentes.
- 08: corrigir seletores comerciais e investigar headline/e-mail/onboarding, preservando asserções e escopo.
- 03: corrigir contraste com proprietários; preservar axe.
- 08: reconciliar VR com #224, #233–236 e #238, revisando imagens sem reduzir thresholds.
- 24: reauditar revisão exata após correções e resultados CI.
CI inicialmente iniciada para 7b6f889: Release 43232185737, VR 43232186026, Sonar 43232185712. Resultados pendentes na emissão.

## Decisão
BLOQUEADO para integração. Correção estática presente, E2E real pendente e gates anteriores vermelhos. Não autoriza merge, release ou deploy. Qualquer alteração de conteúdo exige nova revisão. A thread foi observada resolvida pelo Coordenador, que não a resolveu; isso não constitui validação funcional.
