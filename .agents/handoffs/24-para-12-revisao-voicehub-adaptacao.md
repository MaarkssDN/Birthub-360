De: Agente 24
Para: Agente 12
Onda: saneamento-handoffs-20261114
Status: aberto
Prioridade: normal
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

Quando o Agente 12 entregar a adaptação do voice-hub aos models canônicos (handoff 01-para-12), a mudança envolve tenancy/RLS — exigirá nova revisão do 24 antes de abrir o legacyModuleGate.

## Arquivo(s) envolvido(s)

src/lib/voice-hub/**

## Evidência

Handoff 01-para-12-voicehub-adaptacao-modelos-canonicos.md + parecer 24.

## Alteração necessária

Revisar a adaptação quando implementada: requestContext.tenantId populado, RLS fail-closed verificado, nenhum model legado criado.

## Teste esperado

Parecer formal antes de qualquer reativação do módulo.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).
