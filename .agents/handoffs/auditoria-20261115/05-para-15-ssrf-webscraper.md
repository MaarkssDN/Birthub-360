De: Agente 05
Para: Agente 15
Onda: auditoria-20261115
Status: em-andamento
Prioridade: bloqueador
Bloqueador-ref: DEM-20261115-001
Sprint destino: alto

## Problema
webScraper.service.ts sem SSRF guard completo (sem DNS pinning, sem revalidação de redirect, sem limite de corpo) exposto via POST /api/prospecting/enrich sem requireRole — qualquer usuário autenticado (incl. VISUALIZADOR) pode acionar scraping arbitrário + Playwright. Google Places também é o único provider faturável fora do teto monthlyProspectingBudgetUsd e das métricas.

## Arquivo(s) envolvido(s)
src/features/prospecting/services/enrichment/webScraper.service.ts; src/features/prospecting/prospecting.routes.ts (rota /enrich); src/shared/security/urlGuard.ts (padrão existente a reutilizar — o guard real não é ssrfGuard).

## Evidência
docs/orchestration/auditoria-20261115/05-prospeccao.md (P1-1).

## Alteração necessária
1. requireRole mínimo na rota /enrich (alinhar com rotas faturáveis ACH-05-01).
2. Aplicar assertSafeExternalUrl + revalidação por redirect + cap de corpo/tamanho no scraper.
3. Incluir Places no teto de budget/métricas.

## Teste esperado
Request com URL interna/redirect malicioso → 400/403; VISUALIZADOR → 403; Places decrementa budget.

## Resolução
Executado por Agente 05 em `agente/05-aud1-ssrf` (worktree Birthub-360-wt-a1-05), continuando trabalho
não commitado de sessão anterior do mesmo agente. Escopo 05 coberto; item 3 (Places no budget) fica
registrado como pendência para o Agente 05 em demanda separada — não faz parte do fix SSRF.

1. **RBAC** — `src/features/prospecting/routes/prospecting.routes.ts`: `POST /enrich` agora exige
   `requireRole(['ADMIN', 'GESTOR', 'CLOSER', 'SDR'])`, mesmo conjunto das rotas faturáveis vizinhas
   (/discover, /icebreaker etc.). VISUALIZADOR → 403 antes de qualquer fetch. Body `url` também
   passou a validar `typeof === 'string'`.

2. **SSRF real** — `src/features/prospecting/services/enrichment/webScraper.service.ts`:
   - `assertSafeExternalUrl(targetUrl)` chamado ANTES de qualquer fetch (fora dos try/catch de
     fallback) → AppError(400) propaga à rota. Cobre DNS resolution + IP privado/reservado/
     link-local (inclui 169.254.169.254 metadata, CGNAT 100.64/10, faixas de transição) e exige
     HTTPS (exceção aprovada: http loopback fora de prod, ver urlGuard.isLoopbackHttpAllowed).
   - Fetch HTTP substituído por `safeFetch` → DNS pinning (conexão TCP fixada nos endereços já
     validados; redirect 3xx para outro host falha fechado por mismatch TLS/SNI).
   - **Cap de corpo**: `MAX_SCRAPE_BODY_BYTES = 2 MiB`, aplicado sobre `content-length` declarado E
     `byteLength` real do corpo materializado (content-length mentiroso/ausente coberto). Resposta
     acima do limite cai no fallback Playwright, nunca devolve payload hostil.
   - **Timeouts**: HTTP 8s (`AbortSignal.timeout`), Playwright goto 12s (constante nomeada).
   - **Playwright fallback**: `page.route('**/*')` revalida CADA request (documento, redirect,
     subrecurso) com `assertSafeExternalUrl` + cache por hostname; falha fechado via
     `route.abort()`. `data:`/`blob:`/`about:` passam (não abrem rede). `browser.close()` em
     `finally` — antes vazava processo Chromium headless em exceção. Ressalva documentada no
     código: janela residual de DNS rebinding entre validação e conexão do Chromium (não aceita
     lookup customizado) — mitigada por revalidação por request.
   - `page.content()` truncado em 2 MiB antes da sanitização.
   - `isSafeUrl` mantido como primeira camada literal (hostname) — defesa em profundidade, a
   camada DNS/guard real é o `assertSafeExternalUrl`.

3. **Testes** — `webScraper.service.test.ts` (8 testes, mock do urlGuard no padrão
   threecx.service.test.ts): https externo passa pelo guard e retorna sinais via safeFetch;
   169.254.169.254/latest/meta-data rejeitado pelo guard antes de fetch; falha do guard em host
   privado via DNS aborta sem safeFetch; body > 2 MiB descartado (content-length declarado e
   byteLength real); falha do safeFetch cai no fallback sem quebrar contrato. `isSafeUrl` literal
   continua testado (localhost/127.0.0.1/192.168/172.16-31).
   `prospecting.routes.test.ts`: VISUALIZADOR → 403 sem chamar scraper; SDR → 200 com sinais;
   URL bloqueada pela política literal → 400 sem raspar.

**Gates executados**: `npx vitest run -c vitest.unit.config.ts` nos 2 arquivos → 25/25 passam.
`npx biome lint` nos 4 arquivos → limpo. `npx tsc --noEmit` → único erro pré-existente e
ambiental: módulos `@capacitor/filesystem`, `@capacitor/share`,
`@capacitor-community/speech-recognition` declarados no package.json mas ausentes do
node_modules deste worktree (instalação parcial) — afeta `src/lib/native*.ts`, nenhum arquivo
tocado; nenhum erro TS nos arquivos da missão.

**Pendências / notas para 15 e 00**:
- O cap de corpo ideal seria streaming dentro do `safeFetch`/urlGuard (propriedade do Agente 01);
  hoje o buffer interno do safeFetch já foi alocado antes do nosso byteLength check — limitação
  aceita e documentada.
- Sites que só respondem em `http://` público passam a ser rejeitados pelo guard (HTTPS
  obrigatório) — trade-off documentado; antes o fetch cru aceitava.
- Item "Places no teto de budget/métricas" (Alteração necessária #3) NÃO coberto nesta entrega —
  fora do escopo do fix SSRF/RBAC; precisa de demanda própria (envolve provider Google Places +
  monthlyProspectingBudgetUsd).
- `biome check` (organize-imports) acusa ordenação de imports pré-existente em
  prospecting.routes.ts — presente no HEAD, não introduzida por esta mudança; gate oficial
  (`biome lint`) está limpo.
