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

## Resolução parcial (Agente 17 — 2026-11-12)

Item 1 do Agente 17 — **verificação do que o backend retorna por tenant**:

- `GET /api/sales-orchestration/overview` é servido por
  `src/features/sales-orchestration/server/SalesOrchestrationService.ts` (implementado sob a regra
  "P0 #693 — API de orquestração honesta"). Verificado no código em `origin/main`:
  - `playbooks` vem de `PlaybookInsight` real do tenant (sem seed/template);
  - `kpis.cadenciasAtivas` vem de `CadenceSequence` real (`active: true, deletedAt: null`);
  - `jornadas`, `processos`, `roteiros` são `[]` fixos e declarados em `meta.emptySections`;
  - métricas sem cálculo real (`aderenciaPlaybook`, `speedToLeadMin`, `complianceRate`, etc.)
    retornam `null` e são listadas em `meta.unavailableMetrics` — nunca número inventado;
  - `meta.source` é `'real'` quando há dados reais e `'none'` quando vazio — exatamente o contrato
    `source: 'real'|'none'` que a UI usa para exibir `DemoDataNotice`/estado vazio honesto.
- **Decisão do Agente 17**: declarar escopo reduzido — as três superfícies sem modelo de dados real
  permanecem vazias e honestas (comportamento já implementado), em vez de popular com dados demo.
  Documentar isso formalmente no Documento Mestre é decisão de produto (Agente 00/02), fora do
  escopo de arquivo do 17.

Status mantido `em-andamento`: itens dos Agentes 07, 02 e 08 seguem pendentes de verificação.
