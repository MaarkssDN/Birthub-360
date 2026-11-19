# Handoff — Criação manual de lead/oportunidade (UX-01 / DEBT-0024)

```
De: 02A — UX Research & Usability
Para: 04 — CRM e BI
Onda: WB-1
Status: resolvido
Prioridade: bloqueador (jornada CRM)
Bloqueador-ref: DEBT-0024
Sprint destino: a definir pelo 00
```

## Problema

Não existe criação manual de lead/oportunidade na UI. **Correção v2 (base main @ 8b40cdb90):** os intents da Command Palette **ainda existem em main** — `qa-opportunity` (`CommandPalette.tsx:307-312`) e `ctx-crm-create` (`:330-335`) navegam para `{type:'open-create'}`, mas **nenhum consumidor** do intent existe no CRM (grep `open-create`/`PaletteIntent` em `CrmBoard.tsx`, `CrmBoardToolbar.tsx`, `useCrmBoardController.ts`, `useCrmBoardUrlParams.ts` → zero ocorrências). Leads só nascem de prospecção/promote (`src/features/prospecting/services/prospecting/promote.ts:166`) ou import Bitrix (`BitrixImportModal`). O backend já está pronto: `POST /api/leads` (`src/features/crm/routes/lead.routes.ts:48`, `leadSchema`, montado em `src/bootstrap/routes.ts:105`), `LeadUseCases.createLead` (`src/features/crm/application/LeadUseCases.ts:66`, com regras de posse CLOSER/SDR, dedupe empresa+funil e round-robin já testadas), `leadsDB.create` (`src/lib/db.ts:127`) e `useLeads().createLead` (`src/hooks/useDatabase.ts:176-183`) — **sem consumidor de UI**.

## Arquivo(s) envolvido(s)

- `src/components/CrmBoard.tsx` (sem handler de criação; header em `CrmBoardToolbar.tsx`) — **dono confirmado pelo usuário (2026-11-18): Agente 04** — declarado em `src/components/AGENTS.md` (raiz)
- `src/components/ui/CommandPalette.tsx` — **dono: Agente 03** (`src/components/ui/AGENTS.md`); os intents existem, falta só o consumidor — se o fluxo for decidido, a palette provavelmente não precisa de mudança (já emite `open-create`)
- Novo form: sugerido `src/features/crm/components/LeadForm.tsx` ou rota `/app/crm/novo`

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-01, CONFIRMADO na v2 — intents da palette existem em main, gap é o consumidor ausente no board).

## Alteração necessária

**DECIDIDO pelo usuário (2026-11-18): opção (b) — prospecção-only.** Leads nascem exclusivamente de prospecção/promote/Bitrix. Não implementar criação manual. Ação decorrente: remover intents mortos `open-create`/`qa-opportunity`/`ctx-crm-create` da Command Palette — handoff separado ao Agente 03 (`00-para-03-...`). Documentação oficial da decisão: run report `.agents/runs/00-missao-maestra-us-ux-20261118.md` adendo 5.

## Teste esperado

E2E: ação de criação → form → POST 201 → card aparece no Kanban na coluna inicial; `npx tsc --noEmit`; teste de unidade do submit com erro de API exibindo mensagem PT-BR.

## Contexto adicional

O débito da ação fantasma da palette (no-op sem consumidor) permanece aberto em main — os intents existem mas nada os consome. Coordenar com 03 (`src/components/ui/**` — CommandPalette) e com o 00 (dono de `CrmBoard.tsx`) se a opção (a) for escolhida.
