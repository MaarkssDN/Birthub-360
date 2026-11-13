De: Agente 11 — Marca e Ativos Institucionais
Para: Agente 08 — QA e Release
Onda: Onda 5 (Plano Mestre de Saneamento — decorrente de TAREFA-SANEAMENTO-049 / BT360-DT-0058)
Status: resolvido
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

## Resolução

- **Implementado por:** Agente 08 em 2026-11-12, branch `agente/08-qa-saneamento`, worktree `Birthub-360-worktrees/agente-08-qa`.
- **Arquivo criado:** `tests/unit/brand/fixtures-brand-hygiene.test.ts` (commit `95137518b`).
- **O que faz:** varre recursivamente `tests/fixtures/**`; para buffers com magic ZIP (docx/xlsx/pptx) extrai o texto das entradas XML/TXT/MD/JSON/HTML/CSS via `unzipper` (dependência já existente) e concatena com scan latin-1 do buffer cru (cobre metadados e nomes de entrada); demais arquivos são varridos em latin-1 (preserva todos os bytes como code points, cobrindo conteúdo ASCII dentro de binários como PDF).
- **Padrões bloqueados:** `AtlasGR`, `Total Trac` (`total[\s_-]*trac`), `prospector-atlas`, `#ff5618` (case-insensitive).
- **Caminho de falha coberto:** teste unitário valida o scanner contra buffers sintéticos em memória contendo `AtlasGR`, `prospector-atlas` e `#FF5618` — nenhum fixture sujo foi commitado, conforme sugerido.
- **Evidência de execução:** `npx vitest run -c vitest.unit.config.ts tests/unit/brand/` → 2 arquivos, 5 testes, todos verdes (fixtures-brand-hygiene: 2/2; brand-hygiene pré-existente: 3/3).
