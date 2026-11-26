# Exceções de hotspot (arquivo excessivamente grande) — ITEM-13

Este arquivo é a contraparte legível-por-humano do gate rodado por
`scripts/architecture/check-hotspots.ts` (`npm run check:hotspots`), seguindo o mesmo padrão já
usado neste repositório para waiver de dívida técnica (`docs/security/AUDIT_WAIVERS.md` +
`scripts/security/check-audit-waivers.ts`): uma exceção só existe se estiver registrada aqui, com
dono e prazo — nunca só como comentário solto no código ou supressão silenciosa no script.

## Regra

`scripts/architecture/check-hotspots.ts` varre `src/**/*.{ts,tsx}`, `server.ts` e `worker.ts`
(excluindo testes, `.d.ts`, `dist/`, `build/`, `android/`, `ios/`) e classifica cada arquivo por
contagem de linhas:

- **≤ 700 linhas:** OK, sem aviso.
- **701–1000 linhas:** aviso não-bloqueante (`WARN`) — sinaliza um arquivo grande, não quebra o
  gate. Hoje (2026-08-25, na branch com ITEM-07/08/09 mergeados) existem alguns arquivos nessa
  faixa — são dívida pré-existente sinalizada, não uma regressão introduzida por este item.
- **> 1000 linhas:** falha o gate (`exit 1`), a menos que o arquivo tenha uma exceção ativa **e**
  não-expirada nesta seção cobrindo um limite igual ou maior ao tamanho atual do arquivo.

`1000` foi escolhido porque é o primeiro múltiplo redondo acima do maior arquivo real do
repositório no momento em que este gate foi criado (`src/features/integrations/components/
BitrixImportPanel.tsx`, 960 linhas) — alto o suficiente para não bloquear nenhum arquivo existente
sem exceção, baixo o suficiente para pegar um hotspot novo crescendo sem controle logo depois de
nascer.

## Formato de uma exceção nova

`scripts/architecture/check-hotspots.ts` só lê blocos `### \`caminho\`` de dentro da seção
"## Exceções ativas" abaixo — copie o bloco a seguir para lá ao adicionar uma exceção nova (não
deixe o bloco de exemplo aqui nesta seção, ele não é uma exceção real e é ignorado pelo parser de
propósito por estar fora de "## Exceções ativas"):

```
### `caminho/relativo/do/arquivo.ts`

- **Limite excepcional:** N linhas (o tamanho até onde o arquivo pode crescer sem quebrar o gate)
- **Dono:** Agente NN — Nome do agente (ou pessoa, se fora do roster de agentes)
- **Motivo:** por que o arquivo precisa ficar acima do limite padrão agora, e por que não é
  possível/desejável modularizar imediatamente
- **Registrado em:** YYYY-MM-DD
- **Reavaliar até:** YYYY-MM-DD (obrigatório — uma exceção sem esta data, ou com uma data já
  vencida, faz o gate falhar mesmo que o arquivo esteja coberto pelo limite excepcional)
```

## Exceções ativas

### `src/features/commercial-intelligence/domain/CommercialIntelligence.ts`

- **Limite excepcional:** 1250 linhas
- **Dono:** maarkss1 (fora do roster de agentes)
- **Motivo:** catálogo só de tipos (`interface`/`type` dos DTOs de Inteligência Comercial), sem
  lógica: passou de 1000 linhas (1193) com forecast auto-calibrado, gargalo de funil, benchmark de
  vendedor, cenário de contratação, atribuição por canal e motivo de perda por IA. Dividir por
  subdomínio (mantendo este arquivo como barrel de re-export) é o caminho certo, mas é uma
  refatoração mecânica ampla que não cabe junto de uma correção de CI.
- **Registrado em:** 2026-09-23
- **Reavaliar até:** 2026-11-30 (mesmo checkpoint dos demais itens desta lista)

## Débito conhecido, abaixo do limite de falha (sem exceção necessária)

Arquivos na faixa de aviso (701–1000 linhas) no momento em que este gate foi criado — não
requerem exceção porque não quebram o gate, só ficam registrados aqui para não serem
"descobertos" de novo como achado novo em uma auditoria futura. `BitrixImportPanel.tsx` e
`CadenceHub.tsx` saíram desta lista em 2026-08-29 por já terem cruzado 1000 linhas — ver
"Exceções ativas" acima. `SwarmDashboard.tsx` saiu em 2026-10-25 pelo mesmo motivo (1018 linhas).

- `src/features/market-intelligence/server/accountIntelligence.service.ts` (857 linhas)
- `src/features/intelligence/components/SwarmDashboard.tsx` (modularizado em 2026-11-10: 933 linhas, meta < 1000 atingida)
- `src/features/crm/components/LeadDetailDrawer.tsx` (refatorado em 2026-11-24 e recuperado na consolidação em 2026-11-25: 534 linhas após extração de header, seções de empresa/contato, BANT, notas e Bitrix24 para componentes filhos — abaixo do limite de aviso, removido da lista)
- `src/features/integrations/bitrix/service/extraction.ts` (803 linhas — modularizado em 2026-11-25 na onda consolidação-20261124: paginação extraída para `extractionPagination.ts` e checkpoint incremental para `extractionCheckpoint.ts`; exceção de hotspot removida)
- `src/features/prospecting/outbound/server/routes/leads.routes.ts` (795 linhas — exceção removida em 2026-11-24 após extração de `POST /prospect` para `prospect.routes.ts`, handoff 40→43)
- `src/components/CrmBoard.tsx` (modularizado em 2026-11-12: 886 linhas + `CrmBoardToolbar.tsx`; nova extração em 2026-11-15 para `useCrmBoardBatchActions`/`useCrmBoardUrlParams` em `src/hooks/` — 687 linhas, abaixo do limite de aviso)

Se qualquer um desses cruzar 1000 linhas num PR futuro sem uma exceção registrada acima, o gate
bloqueia normalmente — esta lista é só contexto, não é uma isenção.
