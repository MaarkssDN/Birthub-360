De: 40 — Ravi (Coordenador Squad 40)
Para: 43 — Amon (Prospecção Outbound e Lead Scoring)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3) — continuação do handoff `00-para-40-hotspots-squad40.md`
Status: resolvido
Prioridade: bloqueador (vencimento da exceção 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 item 5

## Problema

`src/features/prospecting/outbound/server/routes/leads.routes.ts` está com **1440 linhas**
(cresceu de ~1368 desde o registro da exceção) e a exceção em
`docs/architecture/HOTSPOT_EXCEPTIONS.md` expira em **30/11/2026**. Sem refatoração ou decisão
humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

## Por que este handoff existe (ownership)

Conforme `.agents/MATRIZ_PROPRIEDADE.md` (Squad 40), `src/features/prospecting/**` pertence ao
**Agente 43 — Amon**. O Agente 40 (Ravi) é coordenador do squad e não edita arquivos de outro
membro sem coordenação (§15–16 do AGENTS.md). O handoff original (`00-para-40-...`) sugeria
Agentes 41/43; a matriz vigente aponta 43.

## Arquivo envolvido

- `src/features/prospecting/outbound/server/routes/leads.routes.ts` (1440 linhas; limite
  excepcional 1500, mas a meta é voltar abaixo de 1000 para eliminar a exceção).

## Diagnóstico e plano de extração sugerido (cirúrgico, sem mudar contrato)

O arquivo já é um router Express (`leadsRouter`) com middlewares compartilhados
(`requireTenantScope` no `use` da linha 75, `requireAuth`/`heavyAiLimiter` por rota).
Handlers inline identificados:

| Linhas aprox. | Rota | Tamanho aprox. |
|---|---|---|
| 94–158 | `PUT /leads/:id/stage` | ~65 |
| 159–195 | `PUT /leads/:id/tags` | ~37 |
| 196–301 | `PUT /leads/:id` | ~106 |
| 302–486 | `POST /leads/:id/save` | ~185 |
| 487–622 | `POST /leads/:id/enrich-news` | ~136 |
| 623–744 | `POST /leads/:id/generate-copies` | ~122 |
| 745–772 | `POST /leads/:id/copies/:channel/feedback` | ~28 |
| 773–833 | `POST /leads/:id/cnpj-refresh` | ~61 |
| 834–849 | `GET /leads/:id/evidence` | ~16 |
| 850–fim (~1440) | `POST /prospect` | ~590 |

Recomendação mínima para ficar < 1000: extrair **apenas o handler `POST /prospect`** (~590
linhas) para um sub-router dedicado, ex.: `prospect.routes.ts` no mesmo diretório, montado via
`leadsRouter.use(prospectRouter)` ou exportado e montado no mesmo ponto de registro atual.
Isso sozinho reduz `leads.routes.ts` para ~850 linhas. Alternativa: extrair também
`enrich-news` + `generate-copies` + `copies/:channel/feedback` (~286 linhas) para
`leadAi.routes.ts`.

Cuidados obrigatórios:
- **Nenhum path/verb pode mudar** — validar contra `openapi.yaml`/contratos e Schemathesis.
- Preservar ordem de middlewares (`requireTenantScope` global, `heavyAiLimiter`, `requireAuth`).
- Helpers compartilhados (`leadBelongsToCompany`, `LEAD_COMPANY_CLAUSE`, schemas zod,
  `VALID_COPY_FEEDBACK`) devem ser movidos para módulo compartilhado ou duplicados só se
  justificado — preferir `../utils/` ou `../services/`.
- Atenção a imports já existentes de `../ai.js`, `../cnpj.js`, `../searchIntent.js`,
  `../requirementEngine.js`, `../queryPlanner.js`, `../progressiveSearch.js`,
  `../entityResolution.js`, `../scoring.js`, `../signals.js`, `../services/bitrix.js`,
  `../middleware/rateLimit.js`, `../auth.js`, `../utils/formatLead.js`.

## Teste esperado

- `npm run check:hotspots` verde sem a exceção de `leads.routes.ts` (remover o bloco
  `### \`src/features/prospecting/outbound/server/routes/leads.routes.ts\`` de
  `docs/architecture/HOTSPOT_EXCEPTIONS.md` ao concluir).
- Testes de rotas de leads/prospecção sem regressão; contratos inalterados.

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branches de refatoração
  (ver handoff `00-para-99-90-waivers-trivy.md` / Agente 99 §4).
- Coordenar SHAs congelados e submeter ao Agente 09 (Silas) antes de integrar.
- Squad 40 teve entregas integradas na Onda 3 — verificar colisão com
  `integracao/onda-3-dem20261123` antes de editar.

## Resolução (Agente 43 — Amon, 2026-11-24)

Refatoração cirúrgica executada exatamente pelo plano mínimo recomendado (extrair só o handler
`POST /prospect`), sem alterar nenhum path, método, middleware ou contrato.

### Arquivos

- **Criado** `src/features/prospecting/outbound/server/routes/prospect.routes.ts` (641 linhas):
  `prospectRouter` com `POST /prospect` verbatim (handler copiado sem alteração de lógica),
  imports restritos ao que o handler usa.
- **Criado** `src/features/prospecting/outbound/server/routes/leads.shared.ts` (28 linhas):
  `heavyAiLimiter` (movido de `leads.routes.ts`), `LEAD_COMPANY_CLAUSE` e
  `leadBelongsToCompany` (movidos sem alteração), compartilhados entre os dois routers.
- **Alterado** `src/features/prospecting/outbound/server/routes/leads.routes.ts`:
  1439 → **796 linhas**. Mantém todas as rotas `/leads/*` e monta o sub-router via
  `leadsRouter.use(prospectRouter)` ao final, preservando `requireTenantScope` (linha do
  `use` global) e a ordem `heavyAiLimiter → requireAuth` dentro da rota.
- **Alterado** `docs/architecture/HOTSPOT_EXCEPTIONS.md`: removido o bloco de exceção de
  `leads.routes.ts` (não é mais necessário — 796 < 1000) e adicionado o arquivo à lista de
  "Débito conhecido" (faixa de aviso 701–1000), seguindo o padrão das demais entradas.

### Invariantes de contrato verificadas

- `POST /prospect` permanece registrado no mesmo `leadsRouter` montado em
  `apiRouter.use(leadsRouter)` (`server/routes.ts:75`) — path, método e cadeia de middlewares
  idênticos (`requireTenantScope` global → `heavyAiLimiter` → `requireAuth`).
- Nenhuma rota `/leads/*` foi movida; `requireAuth`, `heavyAiLimiter` e validações zod
  preservados.
- `openapi.yaml` não documenta `/prospect` (endpoint interno do router de prospecting);
  nenhum contrato público alterado.

### Validação

- `npm run check:hotspots` (via tsx do cache npx, já que `node_modules` local está sendo
  reinstalado por processo concorrente): **VERDE** — "2058 arquivo(s) verificado(s), 0 acima
  de 1000 linhas sem exceção válida"; antes da limpeza do doc apontava a exceção de
  `leads.routes.ts` como obsoleta — após remoção, saída limpa sem warnings do arquivo.
- `npx tsc --noEmit` (TypeScript 6.0.3): **0 erros**. O `node_modules` local está incompleto
  (npm install concorrente travado/ lento), então o typecheck foi executado em worktree de
  referência (`integracao-consolidacao-20261121`, cujos arquivos de prospecção são idênticos
  aos pré-refatoração, verificado por diff) com os 3 arquivos copiados temporariamente e
  restaurados em seguida — worktree devolvido limpo (`git status` vazio no diretório).
- `biome lint` nos 3 arquivos (biome 2.5.14, mesma versão do package.json, binário de
  worktree completo): **PASS** — 1 warning pré-existente (`updateTagsSchema` não usado,
  já existia antes da refatoração; não alterado por P3). `biome check` aponta
  organize-imports/format no bloco extraído, mas o arquivo original já não era
  format-clean (verificado via `git show HEAD:` + `biome format`), portanto o estilo
  original foi preservado para manter o diff cirúrgico.
- Sintaxe/transpile: `esbuild` OK nos 3 arquivos; bundle-check não encontrou nenhum import
  relativo não resolvido (apenas pacotes npm ainda não extraídos pelo install em curso).

### Pendências / observações

- `node_modules` de `D:\Github\Birthub-360` está sendo reinstalado (processo concorrente,
  rede muito lenta ~700 s/tarball). Quando concluir, recomenda-se re-rodar
  `npm run typecheck` e `npm run lint` no repo principal como confirmação final, e os testes
  de rotas de prospecção (`src/features/prospecting/**/__tests__`) se o gate de integração
  exigir — não há teste unitário dedicado a `leads.routes.ts`.
- Auditoria independente (Agente 09 — Silas) pendente antes de integrar, conforme protocolo.
- Sem commits realizados, conforme instrução.

## Adendo de recuperação (2026-11-25 — Agente 40 Ravi, worktree `Birthub-360-wt-recuperacao`)

Este handoff foi copiado do repo principal para a worktree de consolidação. Status da
recuperação dos artefatos do Agente 43 nesta worktree:

- `leads.routes.ts` (795 ln), `prospect.routes.ts` (641 ln) e `leads.shared.ts` (28 ln):
  **já presentes e idênticos** à versão entregue (diff vazio vs. working tree do repo
  principal, ignorando CRLF). Nenhuma ação adicional necessária.
- `tasks.routes.ts`: a modificação já consta na baseline `main` 9a3c2182b2 — nada a recuperar.
- `HOTSPOT_EXCEPTIONS.md`: bloco de exceção de `leads.routes.ts` já removido; arquivo em
  "Débito conhecido".
- `check:hotspots` re-executado nesta worktree: **VERDE** (0 arquivos acima de 1000 sem
  exceção válida).
- Pendente igual ao original: `tsc --noEmit`/`biome`/testes de rotas quando o `node_modules`
  das árvores terminar a reinstalação; auditoria do Agente 09 antes de integrar.
