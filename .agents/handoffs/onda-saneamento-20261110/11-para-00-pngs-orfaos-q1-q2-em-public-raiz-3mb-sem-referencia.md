De: Agente 11 — Marca e Ativos Institucionais
Para: Agente 00 — Coordenador
Onda: Onda 5 (Plano Mestre de Saneamento — decorrente de TAREFA-SANEAMENTO-050 / BT360-DT-0059)
Status: resolvido
Prioridade: normal
Bloqueador-ref: BT360-DT-0059
Sprint destino: Onda 5

## Problema

Dois PNGs de ~1,5 MB cada na raiz de `public/` (`q1.png`, `q2.png`,
1835×857 e 1836×857 px, ~3,0 MB combinados) não são referenciados por nenhum
arquivo do repositório (verificado via grep em `src/`, `public/`, `index.html`,
`documentacao-aplicacao/`, `identidade-visual/`). O próprio guia de design
(`design-system-guide/BIRTH-HUB-360-DESIGN-SYSTEM-GUIDE.html`) os descreve como
"dois PNGs soltos sem uso de marca". Como não são assets de marca nem têm
referência, recompressão não resolve — a recomendação é remoção.

## Arquivo(s) envolvido(s)

- `public/q1.png`
- `public/q2.png`

## Evidência

- `grep -rn "q1.png\|q2.png"` em todo o repositório → única ocorrência é a
  menção documental acima, nenhum consumo real.
- `git log` mostra origem em commit genérico "chore: commit remaining pending
  changes" (2ab1b5359), sem contexto de uso.
- Fora da propriedade estrita do Agente 11 por não serem ativos de marca —
  por isso handoff ao Coordenador em vez de deleção unilateral.

## Alteração necessária

Remover `public/q1.png` e `public/q2.png` (histórico git preserva os arquivos
se necessário). Nenhum consumidor conhecido — remoção é segura.

## Teste esperado

- `npm run build` segue verde (assets não referenciados).

## Contexto adicional

- Demais ativos pesados de `public/` (landing, ícones, screenshots de
  `documentacao-aplicacao/`) foram otimizados nesta mesma onda com
  compressão lossless (Pillow): ~2,25 MB economizados, nomes de arquivo
  preservados, todas as referências intactas.

## Resolução

PNGs q1.png/q2.png removidos (~3MB, zero referencias) — commit do coordenador na integracao.
