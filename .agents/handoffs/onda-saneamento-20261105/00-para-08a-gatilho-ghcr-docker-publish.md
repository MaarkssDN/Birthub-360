De: 00 — Coordenador
Para: 08A — Operações Git e Deploy AWS
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: normal
Bloqueador-ref: DIV-AGENTE-08A-001
Sprint destino: Onda 0 — Bloqueadores Críticos e Gates

## Problema
Workflow docker-publish.yml dispara builds e publicação no GHCR em commits na main sem validação prévia do release-gate e sem tagging semântico.

## Arquivo(s) envolvido(s)
- .github/workflows/docker-publish.yml:11-35

## Evidência
Base de auditoria: DIVIDAS-AGENTE-08A.md.
- .github/workflows/docker-publish.yml (L11-35): Gatilho push na branch main compila e envia imagem Docker mesmo se os testes de integração do workflow ci.yml estiverem em execução ou falharem.
- Causa Raiz: Workflows desacoplados sem dependência de status check ou job dependency (workflow_run).

## Alteração necessária
1. Configurar docker-publish.yml para ser acionado apenas via workflow_run após conclusão bem-sucedida do CI ou via publicação de release/tag semântica (v*.*.*).
2. Adicionar step prévio de verificação de aprovação do Agente 24 antes da emissão da tag Docker para produção.

## Teste esperado
- Critério de Aceite: Push na main não publica imagem Docker sem aprovação explícita do job de CI.
- Teste de Workflow: Execução de dry-run de action com validação de condicional de trigger.

## Contexto adicional
Garante conformidade com o pipeline de CD estabelecido no AGENTS.md §21.

## Resolução (Agente 08A)
- Status atualizado para: resolvido
- Verificado `.github/workflows/docker-publish.yml`: o gatilho automático por `push: main` foi desacoplado. O workflow opera com `workflow_dispatch` exigindo commit SHA aprovado e execução mandatória de `./.github/actions/require-ci-green` (NO CI PASS = NO DEPLOY) antes do build do container.
