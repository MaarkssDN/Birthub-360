# AGENTS.md — Orquestração de Vendas (Playbooks, Roteiros, Jornadas)

## Dono

Agente 17 — Cadência Multicanal e Ciclo de Receita

Decisão do usuário em 2026-11-18 (resolve pendência da auditoria WB-1 —
antes sem AGENTS.md local; atribuição anterior ao 17 por histórico em
`docs/auditorias/dividas-tecnicas/DIVIDAS-AGENTE-17.md` confirmada).

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- hubs de Playbooks, Roteiros & Checklists, Processos de Vendas e Jornadas
  Comerciais; navegação interna do módulo; estados de dados demo.

## Não pode

- deixar ação/botão sem `onClick` ou sem estado disabled+tooltip —
  ação morta é defeito (UX-02);
- apresentar dados demo como reais — manter `DemoDataNotice` honesto;
- alterar schema — Agente 01; contrato de API — Agente 18;
- alterar rotas/menu globais — Agente 02 (`src/components/layout/**`).

## Coordenação

- Destino de navegação `/app/roteiros` e tabMeta → Agente 02 (somente
  consumo da rota, não alteração do registro);
- cadência/execução de jornadas → mesmo domínio do Agente 17;
- backend do módulo → verificar AGENTS.md das camadas `server/` e
  contracts antes de alterar.

## Definição de pronto local

- zero ação morta na UI;
- dados demo sempre sinalizados;
- deep link e refresh verificados nas rotas do módulo.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
