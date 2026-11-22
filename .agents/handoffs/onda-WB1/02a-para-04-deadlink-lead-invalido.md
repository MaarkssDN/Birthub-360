# Handoff — Deep link `?lead=<id>` inválido fecha drawer silenciosamente (UX-11 / DEBT-0065)

```
De: 02A — UX Research & Usability
Para: 04 — CRM e BI
Onda: WB-1
Status: resolvido
Prioridade: normal
Bloqueador-ref: DEBT-0065
Sprint destino: Onda B (WB-1)
```

## Problema

`LeadDetailDrawer.tsx:184-186`: qualquer falha no `GET /api/leads/:id` cai num `catch` único que dispara `toast.error('Erro ao carregar detalhes do lead')` genérico e chama `onClose()` — o drawer fecha e o usuário não distingue "lead não existe / sem acesso" (404) de "falha de rede" (offline, 500, timeout). Em deep link compartilhado (`?lead=<id>`), o destinatário perde o contexto sem saber por quê.

## Arquivo(s) envolvido(s)

- `src/features/crm/components/LeadDetailDrawer.tsx` (`fetchLead`, `:173-190`)
- Opcional: `src/lib/api.ts`/`apiFetch` se a distinção 404↔rede exigir inspeção de status no erro

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-11, CONFIRMADO, P3).

## Alteração necessária

No catch: (a) se erro for 404 → toast "Lead não encontrado ou sem permissão de acesso" e fechar (comportamento atual é aceitável aqui); (b) se erro de rede/5xx → manter o drawer aberto em estado de erro com mensagem "Falha ao carregar — tentar novamente" e botão retry que re-chama `fetchLead`, em vez de fechar.

## Teste esperado

`?lead=id-inexistente` → mensagem específica de não encontrado; API indisponível → drawer permanece com estado de erro e retry funciona; `npx tsc --noEmit`.

## Contexto adicional

Mesmo padrão de honestidade de estados já aplicado em `CrmBoard.tsx:592-599` (EmptyState de erro com retry) e `SinglePageDashboard.tsx:100-131`.

## Resolução (Agente 04 — 2026-11-19)

- Implementado helper `isLeadNotFoundError` e estado `loadError: 'network' | null` em `src/features/crm/components/LeadDetailDrawer.tsx`.
- Erros 404 disparam `toast.error('Lead não encontrado ou sem permissão de acesso')` e fecham o drawer; falhas de rede mantêm o drawer aberto com painel de erro e botão `"Tentar novamente"`.
- Validação: `tsc --noEmit` (exit 0) e `biome lint` (0 diagnósticos). Relatório completo em `.agents/runs/correcoes-wb1/04-ux11-deadlink-lead.md`.
