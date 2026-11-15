De: Agente 24
Para: Agente 02
Onda: saneamento-handoffs-20261114
Status: aberto
Prioridade: alto
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

POST /error-reports do outbound legado passou a exigir sessão (requireTenantScope) — o botão da tela de login que o usava quebra.

## Arquivo(s) envolvido(s)

frontend login + src/features/prospecting/outbound/server/routes/system.routes.ts

## Evidência

Parecer 24, ressalva F6 do PR #323.

## Alteração necessária

Migrar o report da tela de login para o endpoint canônico /api/error-reports (verificar contrato) ou criar rota pública equivalente.

## Teste esperado

Erro na tela de login continua reportável sem sessão.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).
