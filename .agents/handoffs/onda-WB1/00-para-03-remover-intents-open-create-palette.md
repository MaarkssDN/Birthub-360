# Handoff — Remover intents mortos `open-create` da Command Palette (decisão UX-01)

```
De: 00 — Coordenador
Para: 03 — Design e Acessibilidade
Onda: WB-1 (pós-auditoria)
Status: resolvido
Prioridade: normal
Bloqueador-ref: UX-01 (decidido: prospecção-only)
Sprint destino: a definir
```

## Problema

Decisão de produto do usuário (2026-11-18): leads nascem **somente** de
prospecção/promote/Bitrix — não haverá criação manual de lead/oportunidade
na UI. Consequência: os intents `qa-opportunity` e `ctx-crm-create` da
Command Palette navegam para `{type:'open-create'}` no CRM, mas **nenhum
consumidor existe** (`CrmBoard.tsx`, `CrmBoardToolbar.tsx`,
`useCrmBoardController.ts`, `useCrmBoardUrlParams.ts` — grep zero
ocorrências). São ações mortas que prometem funcionalidade inexistente.

## Arquivo(s) envolvido(s)

- `src/components/ui/CommandPalette.tsx:307-312` (`qa-opportunity`)
- `src/components/ui/CommandPalette.tsx:330-335` (`ctx-crm-create`)
- Tipos/constantes relacionados (`PaletteIntent`, listas de ações) no mesmo arquivo

## Evidência

- Relatório: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-01, CONFIRMADO em main @ 8b40cdb90)
- Handoff de decisão: `.agents/handoffs/onda-WB1/02a-para-04-criacao-manual-lead-oportunidade.md` (resolvido)

## Alteração necessária

Remover as duas ações/intents que emitem `open-create` (e o tipo
`open-create` se ficar órfão). Se houver outras ações da palette que
prometam criação no CRM, auditar e remover/corrigir da mesma forma.
Não tocar em `CrmBoard.tsx` (dono: Agente 04).

## Teste esperado

`npx tsc --noEmit` + `npm run lint` verdes; palette abre sem as ações
removidas; nenhuma referência residual a `open-create` em `src/`; teste
de unidade da palette (se existir) atualizado.

## Contexto adicional

Se no futuro o produto decidir por criação manual, o backend já está
pronto (`POST /api/leads`, `LeadUseCases.createLead`) — este handoff não
fecha essa porta, apenas remove a promessa falsa atual.
**Após implementar, solicitar revisão ao Agente 24.**

## Resolução (00, 2026-11-18)

Verificação no working tree (`agente/00-integracao-skills`): os intents
`qa-opportunity`/`ctx-crm-create`/`open-create`→CRM **já foram removidos**
pelo commit `3356c2e65 fix(03): remove ações no-op da Command Palette
(handoff 04→03)` — trabalho prévio do backlog-5 que cobre exatamente este
pedido. Os `open-create` remanescentes (`activities`/`companies`/`contacts`)
têm consumidores reais (`ActivityList.tsx:200`, `CompanyList.tsx:53`,
`ContactList.tsx:76`). Pendente apenas o merge da branch para main —
nenhuma ação adicional do Agente 03 necessária.
