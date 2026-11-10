De: Agente 11 — Marca e Ativos Institucionais
Para: Agente 08 — QA e Release
Onda: Onda 5 (Plano Mestre de Saneamento — decorrente de TAREFA-SANEAMENTO-049 / BT360-DT-0058)
Status: aberto
Prioridade: normal
Bloqueador-ref: BT360-DT-0058
Sprint destino: Onda 5

## Problema

`tests/fixtures/` é propriedade do Agente 08 (`tests/AGENTS.md`). A verificação
da TAREFA-SANEAMENTO-049 (menções residuais a marcas legadas em fixtures)
confirmou que os dois únicos fixtures (`sample.pdf`, `sample.docx` em
`tests/fixtures/knowledge/`) estão limpos — contêm apenas a marca atual
"Birth Hub 360". Porém não existe teste automatizado que impeça regressão:
qualquer fixture futura pode reintroduzir nomes legados (AtlasGR, Total Trac,
prospector-atlas etc.) sem ser detectado.

## Arquivo(s) envolvido(s)

- `tests/fixtures/knowledge/sample.pdf`
- `tests/fixtures/knowledge/sample.docx`
- Sugestão de novo teste: `tests/unit/brand/` (ex.: `fixtures-brand-hygiene.test.ts`)

## Evidência

- Extração de texto dos fixtures (pypdf/zipfile): "Fixture de teste - Base de
  Conhecimento Birth Hub 360" e "Hello Birth Hub 360 fixture PDF test".
- `grep -rniE "atlas|total ?trac|atlasgr" tests/fixtures/` → sem ocorrências.
- Já existe precedente de guard de marca: `tests/unit/brand/brand-hygiene.test.ts`.

## Alteração necessária

Criar teste unitário que varra `tests/fixtures/**` (binários via extração de
texto ou varredura binária por encoding latin-1/utf-8) e falhe se encontrar
marcas legadas (`AtlasGR`, `Total Trac`, `prospector-atlas`, `#ff5618` etc.),
seguindo o padrão de `brand-hygiene.test.ts`. Cobrir caminho de sucesso
(fixtures atuais passam) e de falha (fixture sintético com nome legado é
rejeitado — pode ser validado contra string mock, sem commitar fixture sujo).

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts tests/unit/brand/`

## Contexto adicional

- O Agente 11 não alterou `tests/**` por respeitar a propriedade do Agente 08.
- Fixtures atuais não precisaram de alteração (já estavam sanitizados).
