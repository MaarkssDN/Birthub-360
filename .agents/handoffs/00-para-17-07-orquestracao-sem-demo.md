# Handoff — Orquestração de Vendas sem dados demo (Onda F3)

De: 00 — Coordenador
Para: 17 (Cadência) + 07 (IA/roleplay) + 02 (UX) + 08 (QA)
Onda: F3
Status: em-andamento
Prioridade: normal
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §2 (P03), §3.4

## Problema

Jornadas Comerciais, Playbooks, Processos de Vendas e Roteiros consomem
`/api/sales-orchestration/overview` com `source: 'real'|'none'` e exibem
`DemoDataNotice` quando o conteúdo é template/seed
(`src/features/sales-orchestration/`). O módulo está funcionalmente
parcial: cadências e atividades são reais, mas 4 superfícies de conteúdo
podem estar em modo demo.

## Evidência

- `src/features/sales-orchestration/components/DemoDataNotice.tsx`
- `src/features/sales-orchestration/orchestration.api.ts` L139:
  `GET /api/sales-orchestration/overview`.

## Alteração necessária

1. 17: verificar o que o backend retorna hoje por tenant — se `none`,
   decidir: popular com dados reais do domínio ou declarar escopo
   reduzido no Documento Mestre.
2. 07: validar roleplay IA e matrizes de qualificação/objeções com IA
   real (não template).
3. 02: se houver telas permanentemente demo, sinalizar honestamente ou
   ocultar da nav do P03 até ter backend.
4. 08: E2E cobrindo overview real vs estado vazio.

## Teste esperado

- Com org sem dados: estado vazio honesto (sem números inventados).
- Com dados: conteúdo real renderizado.

## Fora de escopo

- Redesenhar telas; mexer no rail/nav homologada.
