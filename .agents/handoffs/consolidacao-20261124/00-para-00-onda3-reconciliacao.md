De: 00 — Astra (sessão Onda 2 / consolidação)
Para: 00 — Astra (sessão Onda 3 — detentora do lease `global-astra.lease`)
Onda: Consolidação DEM-20261123-001
Status: aberto
Prioridade: bloqueador para promoção da linha global
Bloqueador-ref: divergência de branches de integração + parecer add/add resolvido
Sprint destino: imediato

## Problema

Existem duas linhas de integração descendentes de `815a09305`:

- `integracao/onda-2-dem20261123` @ `3b40599d6` — contém as correções finais da Onda 2 (fix teste LGPD `a81c63ccc`, pareceres Silas `bbd443f23`, relatório `3b40599d6`) que **não estão** na linha Onda 3.
- `integracao/onda-3-dem20261123` @ `1960064d8` — baseline `32d07c375` (pré-fix) + 19+ entregas Onda 3 auditadas. **Ainda contém o teste LGPD obsoleto** (`priorAuditLogsPurged === 5` / `deleteMany` esperado) → `test:unit` vermelho na linha.

## Arquivo(s) envolvido(s)

- `tests/unit/shared/services/dataSubjectErasureCascade.test.ts` (stale na linha Onda 3)
- `.agents/reviews/09-dem-20261123-integracao-onda2-32d07c375.md` (add/add — ver resolução abaixo)

## Evidência

- `git merge-tree` de `integracao/onda-3-dem20261123` × `integracao/onda-2-dem20261123`: conflito único no parecer (add/add); todo o resto mergeia limpo.
- Merge candidato já executado na branch `integracao/consolidacao-dem20261123-candidato` @ `c6433d089` (worktree `dem-20261123-consolidacao/wt-00-candidato`), com o conflito resolvido por consolidação dos dois pareceres.
- `git show integracao/onda-3-dem20261123:tests/unit/shared/services/dataSubjectErasureCascade.test.ts` → ainda espera `deleteMany`/`priorAuditLogsPurged === 5`.

## Alteração necessária

1. **Decisão de topologia (humano/00-global):** promover `integracao/consolidacao-dem20261123-candidato` como nova linha global, ou mergear `integracao/onda-2-dem20261123` em `integracao/onda-3-dem20261123` (equivalente em conteúdo; o candidato já contém ambos).
2. **Conflito de parecer JÁ RESOLVIDO** no candidato: `09-dem-20261123-integracao-onda2-32d07c375.md` agora consolida Parte A (APROVADO integridade de merge) + Parte B (REPROVADO gate unitário) + encerramento apontando para o parecer APROVADO de `a81c63ccc`. Se preferir manter os arquivos separados, a alternativa é renomear a Parte B para `...-32d07c375-gate-unitario.md`.
3. **Teste LGPD:** o fix `a81c63ccc` precisa aterrissar na linha global — sem ele, `test:unit` falha.
4. **Lease:** `global-astra.lease` (adquirido 2026-11-24T17:30-03:00, expira 2026-11-25T17:30) declara sessão única de integração global. Esta sessão NÃO escreveu em `integracao/onda-3-dem20261123` — todo o trabalho foi em branch/worktree próprios. Solicitado: confirmar se a promoção do candidato será feita pela sessão detentora do lease ou se a autoridade humana delega a esta sessão.

## Teste esperado

- Após promoção/merge: `dataSubjectErasureCascade.test.ts` espera `priorAuditLogsPurged === 0` e `deleteMany` não chamado.
- `npx tsc --noEmit` e gates intermediários verdes no SHA promovido.
- Um único arquivo de parecer canônico para `32d07c375` sem marcadores de conflito.

## Contexto adicional

- Onda 4 (dem-20261123) está PREPARADA em fila: worktrees `wt-44-cadences`, `wt-51-bitrix-auth`, `wt-56-whatsapp` aguardam slots — baseline deve ser o SHA consolidado pós-reconciliação, não `32d07c375`.
- Handoffs de hotspots/waivers/timeouts/integração emitidos nesta mesma pasta `consolidacao-20261124/`.
