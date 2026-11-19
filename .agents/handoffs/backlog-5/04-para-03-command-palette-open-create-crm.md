De: Agente 04 — CRM e BI
Para: Agente 03 — Design e Acessibilidade
Onda: backlog-5 (desdobramento do handoff 03→04 `analytics-contraste-temas`)
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-35 / handoff `03-para-04-analytics-contraste-temas.md` §3
Sprint destino: backlog-5

## Problema

O item §3 do handoff de contraste pedia: consumir `open-create` no `CrmBoard` **ou** remover a
ação contextual `ctx-crm-create` da palette se não houvesse fluxo real. Verificação do Agente 04
(2026-11-17, worktree `agente/04-handoffs-20261117`):

- `/app/crm` renderiza apenas `CrmBoard` (Kanban). Não existe formulário/modal de criação de
  lead/oportunidade no domínio CRM — a criação real acontece via Prospecção/outbound,
  importação Bitrix ou API (`leadsDB.create` existe em `src/lib/db.ts` mas nenhum componente de
  `/app/crm` o consome para criação).
- Portanto `open-create` é um no-op visual em `/app/crm`: o intent viaja em `location.state` e
  ninguém o lê.
- `src/components/ui/CommandPalette.tsx` pertence ao Agente 03 — o 04 não edita.

Ações mortas encontradas (ambas navegam para `crm` com `{type:'open-create'}`):

1. `ctx-crm-create` — CommandPalette.tsx ~L329-335 (grupo "Nesta página" em `/app/crm`).
2. `qa-opportunity` — CommandPalette.tsx ~L306-312 ("Ações rápidas" → "Nova oportunidade").

## Arquivo(s) envolvido(s)

- `src/components/ui/CommandPalette.tsx` (itens `ctx-crm-create` e `qa-opportunity`)

## Evidência

- `src/App.tsx`/`src/bootstrap/routes.ts`: `path="crm"` → `<CrmBoard />` (único componente).
- `grep -rn "open-create\|PaletteIntent" src/components/CrmBoard.tsx` → 0 ocorrências.
- `grep -rln "LeadForm\|CreateLead" src/features/crm src/components` → nenhum formulário de
  criação; `LeadDetailDrawer`/`LeadActionBar`/`KanbanBoard` não criam leads.

## Alteração necessária

Decisão do 03 (dono do arquivo), duas opções:

1. **Recomendada (cirúrgica):** remover `ctx-crm-create` e `qa-opportunity` — são no-ops hoje.
   Se um fluxo real de criação for decidido no futuro (item de produto → 00/02), a ação volta
   junto com o consumidor.
2. Se houver plano de criar um formulário de lead/oportunidade no CRM, abrir handoff para
   02/00 com a decisão de produto antes de manter a ação.

## Teste esperado

- Palette em `/app/crm` não oferece mais "Nova oportunidade" (ou a ação abre fluxo real).
- `npx tsc --noEmit` + `npm run lint` verdes.

## Contexto adicional

Os itens de contraste WCAG do mesmo handoff original foram resolvidos pelo 04 em
`Analytics.tsx`/`WinLossAnalysis.tsx` (ver `## Resolução` em
`backlog-5/03-para-04-analytics-contraste-temas.md`).
