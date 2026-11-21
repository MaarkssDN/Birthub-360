De: Agente 18 — Contratos, API e Documentação Viva
Para: Agente 08 — QA e Release
Onda: 5
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-39
Sprint destino: Onda 5

## Problema

MEL-39 pede Schemathesis configurado. O runner portátil já existe nesta branch
(`scripts/api/schemathesis.mjs`, resolve venv Windows/PATH/`uvx` e recebe `--url` + args extras),
mas `.github/workflows/**` é propriedade do Agente 08 — o Agente 18 não pode criar o job de CI.

## Arquivo(s) envolvido(s)

- `scripts/api/schemathesis.mjs` (entregue pelo 18)
- `docs/openapi.yaml` (spec de entrada)
- `.github/workflows/` (a criar/alterar pelo 08)

## Evidência

- `docs/api/README.md` documenta o modo report-first.
- Schemathesis precisa de API rodando; o job de CI ideal é **report-first agendado/manual**
  (workflow_dispatch + schedule semanal contra staging ou contra servidor efêmero do compose de
  teste), não bloqueante no PR — os checks default (`not_a_server_error`, conformidade) tendem a
  gerar falsos positivos em rotas que exigem sessão/tenant reais.
- Alternativa mais barata se subir servidor efêmero for inviável: manter só o gate estático
  `verify:openapi-drift` (já no CI) e rodar Schemathesis manualmente por release.

## Alteração necessária

Criar workflow (ex.: `schemathesis.yml`) que:
1. instala Python + `pip install schemathesis` (ou usa `uvx`);
2. sobe a API de teste (compose de integração existente ou `npm run start:e2e` com `.env.test`);
3. roda `node scripts/api/schemathesis.mjs --url http://127.0.0.1:3000` com `continue-on-error: true`
   na primeira versão (report-first), publicando o output como artefato;
4. evoluir para gate bloqueante só em checks `not_a_server_error` depois de uma baseline limpa.

## Teste esperado

- Execução manual do workflow produz relatório Schemathesis sem derrubar o job.
- `npm run verify:openapi-drift` continua verde (já coberto pelo `ci.yml`).

## Contexto adicional

- `package.json` já tem `test:api-schema` hardcoded para `.venv-opensource` Windows — não funciona
  em Linux/CI; o novo script é o caminho portátil. Trocar o script do package.json exige aprovação
  do Agente 00 (package.json é dele).
- Se o 08 preferir não criar workflow agora, registrar a decisão "Schemathesis = report-first
  manual" no INDEX de demandas fecha o MEL-39 de forma explícita.
