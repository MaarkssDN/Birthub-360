De: 00 — Coordenador
Para: 18 — Contratos, API e Documentação Viva; 08 — QA e Release (workflow)
Onda: transversal (CI / Postman sync)
Status: aberto
Prioridade: alto
Bloqueador-ref: Postman sync FAILURE em todo push na main (run 43675956577 e anteriores)
Sprint destino: próxima janela de saneamento de CI

## Problema

O workflow `.github/workflows/postman-sync.yml` falha em todo push na `main` com HTTP 400 da API do Postman (`REJECTED_PATCH` / `invalidParamsError`). O push da collection `"Birth Hub 360º API"` é rejeitado e o check fica vermelho na main.

## Arquivo(s) envolvido(s)

- `.github/workflows/postman-sync.yml` (Agente 08)
- `.postman/workflows.yaml` — `syncSpecToCollection`/`syncCollectionToSpec` com `deleteOrphanedRequests: false`
- `postman/specs/Birth Hub 360º API/openapi.yaml`
- `postman/collections/Birth Hub 360º API/**` (gerado do spec)

## Evidência (log exato, run 43675956577, job "Push workspace")

```json
{
  "code": "REJECTED_PATCH",
  "message": "The specified parameter is in an invalid format",
  "details": {
    "syncErrorName": "invalidParamsError",
    "param": "value",
    "message": "value.id \"59369139-8bf327cd-4798-4a99-ab8d-5634f777e7ac\" is already in use",
    "opIndex": 0,
    "mutateOp": "create",
    "itemId": "59369139-8bf327cd-4798-4a99-ab8d-5634f777e7ac",
    "itemKind": "http-request",
    "itemName": "Marca a conversa como pronta (transcrição/análise concluídas — PROCESSING → READY)",
    "parentId": "59369139-35e927d0-645c-4947-9044-e6098a0435c6"
  }
}
```

Seguido de: `Collection Birth Hub 360º API: Failed to update - HTTP 400 ... entity may be malformed or fail server-side validations.`

## Diagnóstico do Agente 00

- O request problemático corresponde a `POST /copiloto-ia/conversations/{id}/ready` — único arquivo `*.request.yaml` para essa operação no repo (sem duplicata local, sem `operationId` duplicado no spec — o spec nem usa `operationId`).
- O id `59369139-8bf327cd-...` **não existe em nenhum arquivo do repo** — é gerado pelo sync-planner do Postman (UUID determinístico por entidade).
- `mutateOp: "create"` + "id already in use" = o planner gerou um `create` para um item cujo id determinístico **já existe no workspace Postman** sob outra identidade (provável órfão de sync anterior — item renomeado/movido de pasta, ou sync parcial que criou o request e falhou depois).
- Agravante estrutural: `.postman/workflows.yaml` define `deleteOrphanedRequests: false` nos dois sentidos — o planner **nunca remove órfãos**, então a colisão é permanente até intervenção manual no workspace ou mudança de config.
- Não é problema de tamanho do openapi.yaml nem de parâmetro inválido no spec — o `param: "value"` é o campo `id` do item Postman.

## Alteração necessária (sugestão — dono decide)

1. **Curto prazo (destravar o check)**: no workspace Postman, localizar o item órfão que detém o id `59369139-8bf327cd-4798-4a99-ab8d-5634f777e7ac` (buscar pelo nome "Marca a conversa como pronta" — pode haver 2 entradas, uma em pasta antiga) e removê-lo/renomeá-lo; re-rodar o workflow.
2. **Alternativa**: sync manual único com `deleteOrphanedRequests: true` (avaliar risco de apagar requests criados manualmente no Postman antes de ligar — auditar o workspace primeiro).
3. **Prevenção**: considerar assert no CI que detecta requests duplicados por (method, url) na collection antes do push, ou documentar que o workspace Postman é somente-gerado-do-spec (proibir edição manual para não criar órfãos).

## Teste esperado

- `Postman sync` verde na main (push de teste ou `workflow_dispatch`).
- Collection no Postman contém exatamente 1 request para `POST /copiloto-ia/conversations/{id}/ready`.

## Contexto adicional

- O workflow foi criado em `d6dd944ab` (2026-10-31) e o request file não mudou desde então — a colisão é estado do lado do Postman, não do repo.
- Se houver outros itens órfãos, o próximo push falhará no próximo id colidido — resolver a classe do problema (órfãos), não só este item.
