De: 43 — Amon (Prospecção Outbound e Lead Scoring)
Para: 00 — Coordenador
Onda: 3
Status: aberto
Prioridade: normal
Bloqueador-ref: ONDA3-43-PROSPECTING-AUTHZ
Sprint destino: onda-3

## Problema

Divergência de nomenclatura/propriedade registrada durante ONDA3-43-PROSPECTING-AUTHZ:

1. `src/features/prospecting/AGENTS.md` declara "Dono: Agente 05 — Prospecção"
   (ID legado do roster antigo). Na MATRIZ_PROPRIEDADE de 100 agentes,
   `src/features/prospecting/**` **não aparece** em nenhuma linha — o slot `43`
   da matriz aponta para `src/features/crm/scoring/**`, domínio diferente.
2. A missão do Agente 43 (Amon — "Prospecção Outbound e Lead Scoring") atribui
   explicitamente `src/features/prospecting/**` como ownership de escrita.
3. Consequência prática: o IDOR corrigido nesta onda está em
   `src/features/prospecting/outbound/server/routes/tasks.routes.ts`, que o AGENTS.md
   local reserva ao "Agente 05". Executei sob a autoridade da missão/ matriz de 100
   agentes, mas convém o 00 publicar na matriz oficial quem é o dono vigente de
   `src/features/prospecting/**` (e de `src/features/integrations/**`, também ausente
   da matriz — vide handoff 43→50).

## Arquivo(s) envolvido(s)

- `src/features/prospecting/AGENTS.md` (linha 5: "Agente 05 — Prospecção")
- `.agents/MATRIZ_PROPRIEDADE.md` (sem linha para `src/features/prospecting/**` nem
  `src/features/integrations/**`)

## Evidência

Missão ONDA3-43 + leitura dos dois arquivos acima no baseline `32d07c375`.

## Alteração necessária

- 00 decidir e registrar na MATRIZ_PROPRIEDADE o dono vigente de
  `src/features/prospecting/**` (sugestão: Agente 43/Amon para outbound+scoring, ou
  manter 05 legado se ainda ativo — não executei 05 nesta onda).
- Atualizar `src/features/prospecting/AGENTS.md` com o ID correto (decisão humana /
  00 — agentes não editam AGENTS.md de outros domínios sem designação).

## Teste esperado

N/A — governança.

## Contexto adicional

Também criei `tests/unit/features/prospecting/outbound/tasksAuthz.test.ts` — diretório
`tests/**` é de squad 00/08 na matriz, mas segui o precedente de
`tenantScope.test.ts` (mesma pasta, onda anterior) para o teste de regressão
exigido pela missão. Se o 00 preferir realocar, o arquivo é autocontido.
