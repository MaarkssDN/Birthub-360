# Handoff — Portal/direitos do titular LGPD

De: 00 — Coordenador
Para: 21 — Privacidade e LGPD
Onda: W7
Status: aberto
Prioridade: alto (conformidade)
Sprint destino: próxima onda

## Problema

Auditoria marcou "Portal do titular LGPD — em andamento". O fluxo completo
(solicitação → verificação de identidade → exportação → eliminação/
anonimização → confirmação → auditoria) precisa ser inventariado e
completado.

## Arquivo(s) envolvido(s)

- `src/features/**` (privacy, lgpd, consent, OptOutRecord, anonimização
  de Contact — PII cifrada + blind index já existem)
- Rotas públicas `/privacy`, `/terms`

## Evidência

- Worktree `agente-21-lgpd-portal` preservada para retomada.

## Alteração necessária

1. Inventariar o que existe (endpoints de direitos, consentimento,
   anonimização, páginas legais).
2. Implementar a peça mais crítica faltante (provável: endpoint de
   solicitação de exclusão com anonimização real ou exportação).
3. Respeitar RLS/tenancy e verificação de identidade do titular.

## Teste esperado

- Testes provando o fluxo implementado; npx tsc --noEmit.

## Contexto adicional

Branch `agente/21/lgpd-consentimento` existe no remoto — verificar se há
trabalho prévio a reaproveitar antes de recomeçar.
