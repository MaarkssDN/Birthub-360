# Handoff — Botão "Abrir Roteiros & Checklists" sem onClick (UX-02 / DEBT-0060)

```
De: 02A — UX Research & Usability
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: WB-1
Status: aberto
Prioridade: normal
Bloqueador-ref: DEBT-0060
Sprint destino: a definir pelo 00
```

## Problema

Em `PlaybooksHub.tsx:219-224`, cada card de playbook tem dois botões mortos: `<Button variant="default" size="sm" className="w-full">Abrir Roteiros & Checklists</Button>` e `<Button variant="outline" size="sm"><ArrowUpRight className="w-4 h-4" /></Button>` — nenhum tem `onClick`. O destino real existe: `/app/roteiros` renderiza `RoteirosHub` (`src/components/layout/tabMeta.ts:187`, módulo sales-orchestration).

**Decisão do usuário (2026-11-18):** `src/features/sales-orchestration/**` → **Agente 17** — AGENTS.md local criado. O micro-fix é deste dono.

## Arquivo(s) envolvido(s)

- `src/features/sales-orchestration/components/PlaybooksHub.tsx` (`:219-224`)

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-02, CONFIRMADO, P2).

## Alteração necessária

Mínimo: `onClick={() => navigate('/app/roteiros')}` no botão principal. Para o botão `ArrowUpRight`: se não houver rota de detalhe de playbook, remover o botão ou aplicar o mesmo `disabled` + `title="Em breve"` já usado em "Novo Playbook" (`PlaybooksHub.tsx:55-62`) — nunca deixar ação morta.

## Teste esperado

Clique em "Abrir Roteiros & Checklists" navega para `/app/roteiros` com o playbook/contexto correto se aplicável; `npx tsc --noEmit`; smoke e2e da rota.

## Contexto adicional

O restante do hub já está honesto (KPIs "Indisponível", `DemoDataNotice`, "Novo Playbook" disabled com tooltip) — a correção é cirúrgica, sem refatorar o arquivo.
