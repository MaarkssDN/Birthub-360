# Handoff 05 → 02 — Botão "Reportar problema" da tela de login quebrado

- **De:** 05 — Prospecção
- **Para:** 02 — Produto e UX
- **Onda:** Onda 1 (pós-PR #323)
- **Status:** aberto
- **Prioridade:** normal (impacto prático zero enquanto o módulo estiver 503)
- **Bloqueador-ref:** parecer 24 PR #323, achado [MÉDIO]
- **Sprint destino:** próxima onda de frontend

## Problema

`POST /api/outbound/error-reports` passou a exigir sessão + company
(`requireTenantScope` no router). O botão "Reportar problema" existe em TODA tela,
inclusive a de **login** — exatamente o caso de uso do endpoint (usuário não
autenticado relatando problema). Desde o endurecimento, o reporte da tela de login
falha com 401.

## Arquivo(s) envolvido(s)

- Frontend: componente do botão "Reportar problema" (provavelmente em
  `src/components/` ou layout de auth — localizar pelo texto/endpoint chamado)
- Backend canônico já existente: `/api/error-reports` (rota principal, fora do
  router legado `/api/outbound`)

## Evidência

- Comentário original em `system.routes.ts` (`/error-reports`): "presente em toda
  tela, inclusive login".
- Parecer 24 PR #323 registrou a regressão funcional como follow-up obrigatório.

## Alteração necessária

Migrar o botão "Reportar problema" para o endpoint canônico `/api/error-reports`
(que aceita relatos anônimos), ou torná-lo condicional: na tela de login usa o
endpoint canônico; autenticado pode continuar no legado até a reabertura.

## Teste esperado

- Relato enviado da tela de login persiste e aparece na listagem de error-reports.
- Relato autenticado continua funcionando.

## Contexto adicional

O módulo `/api/outbound` está atrás de gate 503 — a regressão só se materializa se
algum frontend ainda chamar a rota legada. Verificar se há consumidor real antes
de priorizar.
