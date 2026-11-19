# Relatório 14 — Inventário visual das rotas internas `/app/*` (somente observação)

Agente / Onda / Branch: 14 — Ambiente de Execução e Test Harness / Onda 1 / claude/sleepy-hamilton-umhot9
Demanda: missão do Agente 00 (reprovisionar harness, reexecutar specs, inventário visual, A11Y-001).

## Suposições feitas
- Usuário de teste descartável criado via `signUp()` (tests/e2e/helpers.ts) => papel ADMIN, onboarding concluído. Logo, rotas com `RequireRole` (ADMIN/GESTOR) NÃO redirecionaram; o comportamento para SDR/CLOSER/VISUALIZADOR NÃO foi inventariado.
- Tema alternado como o app: `localStorage['birthhub360_theme']` = `light|dark` (src/contexts/ThemeContext.tsx; classe `.dark` no `<html>`). Verificado `isDark` coerente em todas as variantes (0 divergências).
- Servidor subido manualmente como o webServer do config (`dotenv-cli -e .env.test -- tsx tests/e2e/e2e-server.ts`, PORT=3000, E2E_BITRIX_MOCK=1, BITRIX_MIN_INTERVAL_MS=0; API_RATE_LIMIT_MAX=50000). Sem Meilisearch.
- Rotas parametrizadas (`market-intelligence/accounts/:id`) e `/app` (index) não visitadas. `settings/pillars/:pillar` só para `market` e `ai` (as demais são cobertas pelas `settings_*` que redirecionam para o mesmo componente).

## Plano executado
| Etapa | Critério | Resultado |
|---|---|---|
| Reprovisionar Postgres 5434 + Redis 6379 | `pg_isready`, `redis-cli ping` | OK: o diretório `/tmp/pgd/data` sobreviveu; só reiniciei (`rm postmaster.pid` + `pg_ctl start` como `postgres`; `redis-server --daemonize yes`). `prisma migrate deploy`: "No pending migrations to apply" (158 migrações). Bootstrap de papéis não foi necessário (papéis persistiram). `.env.test` existia (modo 600, 13 chaves; valores não impressos). |
| `auth.spec.ts` | verde | TESTADO: 4 passed (41.0s) |
| `accessibility.spec.ts` | verde | TESTADO: 34 passed (3.8m) |
| `mobile-sweep.spec.ts` (sem snapshots) | verde | TESTADO: 1 passed (54.7s) — 36 módulos a 393x851, sem overflow >4px e sem tela branca |
| Inventário visual 70 rotas x 4 variantes | capturas + métricas | TESTADO (observação): 280 screenshots, 70 rotas |
| Contraste de títulos no tema claro | >=5 telas | MEDIDO em 70 telas / 445 títulos h1-h4 |

Comandos (reproduzíveis pelo 24; `export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`):
- `npx dotenv-cli -e .env.test -- npx playwright test tests/e2e/auth.spec.ts --trace off` → 4 passed
- `... accessibility.spec.ts --trace off` → 34 passed
- `... mobile-sweep.spec.ts --trace off` → 1 passed
- Inventário: scripts temporários fora do repo (`<scratchpad>/inv.mts`, `contrast.js`, `detail.mts`); dados brutos em `<scratchpad>/results.jsonl`.
  Scratchpad = `/tmp/claude-0/-home-user-Birthub-360/a40a4371-a26d-561b-8a52-2f967324f903/scratchpad/` (capturas em `shots/`, nome `<rota com _>__<light|dark>_<d|m>.png`, d=1280x800, m=390x844, deviceScaleFactor 1).

## Arquivos alterados
- Criados: este relatório. Atualizado: `.agents/handoffs/onda-1/00-para-14-env-test-playwright-local.md` (seção Resolução). Nenhum src/, .github/, snapshot, package.json/lockfile tocado. Nada commitado; capturas fora do repositório.

## Resultado agregado (70 rotas)
- Redirects: 10 (market-intelligence/deck→prospect; settings/pillars e settings_*(8)→settings/pillars/<slug>; todos intencionais/aliases). Nenhum redirect por RBAC (usuário ADMIN).
- Overflow horizontal a 390px: 0 rotas (>4px) em ambos os temas — confirma o mobile-sweep.
- Carregamento (domcontentloaded + suspense + 1,2s de espera): máx 2,2s (dashboard); mediana ~1,85s. Telas brancas: nenhuma (menor texto: 298 caracteres em /app/prospect).
- Console error: 5 rotas (ver achados; 429/404 de rede + um 500 observado em reexecução isolada (evidência bruta NÃO preservada — ver achado 8)). Warnings: 1 rota com THREE.Clock deprecated (4x) e um aviso de GPU stall WebGL (PRÉ-EXISTENTE, three.js).
- Rede 4xx/5xx: 5 rotas (characters 429 (registrado em `results.jsonl`) e 500 (relatado pelo 14, sem registro bruto), editor 429, intelligence/elite-agent 404, intelligence/pending-actions 404, pending-actions 404).
- axe (WCAG 2.0/2.1 A+AA), desktop 1280, light+dark: 19 rotas com violação crítica/séria. Totais (rota x tema): crítico 30 (label 22, select-name 6, button-name 2), sério 10 (color-contrast 10). Zero violações em 51 rotas.

## Tabela por rota
| rota | redirect | console errors (máx. por variante) | rede 4xx/5xx | overflow 390 | axe crítico/sério (light-desk / dark-desk; ids) | tempo máx (ms) | observação |
|---|---|---|---|---|---|---|---|
| activities | - | 0 | - | 0 | 0 / 0  | 1774 | |
| analytics | - | 0 | - | 0 | 0 / 0  | 1872 | |
| automations | - | 0 | - | 0 | 0 / 0  | 1711 | |
| bitrix | - | 0 | - | 0 | 0 / 0  | 1865 | |
| cadence | - | 0 | - | 0 | 0 / 0  | 1684 | |
| calendar | - | 0 | - | 0 | 0 / 0  | 1853 | |
| characters | - | 4 | 429 /api/agent/characters; 429 /api/agent/characters/activity | 0 | 0 / 0  | 1691 | |
| chatbook | - | 0 | - | 0 | 0 / 0  | 1844 | |
| commercial_intelligence | - | 0 | - | 0 | 0 / 0  | 1906 | |
| companies | - | 0 | - | 0 | 0 / 0  | 1920 | |
| contacts | - | 0 | - | 0 | 0 / 0  | 1844 | |
| copiloto_ia | - | 0 | - | 0 | 0 / 0  | 2007 | |
| crm | - | 0 | - | 0 | 0 / 0  | 1972 | |
| crm360 | - | 0 | - | 0 | 0 / 0  | 1774 | |
| daily-plan | - | 0 | - | 0 | 0 / 0  | 1860 | |
| dashboard | - | 0 | - | 0 | 1 / 1 color-contrast | 2202 | |
| editor | - | 1 | 429 /api/knowledge | 0 | 0 / 0  | 1716 | |
| failover | - | 0 | - | 0 | 1 / 0 color-contrast | 1896 | |
| forecast | - | 0 | - | 0 | 0 / 0  | 1847 | |
| gamification | - | 0 | - | 0 | 1 / 1 button-name | 1764 | |
| home | - | 0 | - | 0 | 0 / 0  | 1742 | |
| integrations | - | 0 | - | 0 | 0 / 0  | 1942 | |
| intelligence | - | 0 | - | 0 | 0 / 0  | 1796 | |
| intelligence/elite-agent | - | 2 | 404 /api/commercial-agent/mission/default/trace | 0 | 0 / 0  | 2012 | |
| intelligence/pending-actions | - | 1 | 404 /api/agent/commercial-cell/pending-actions | 0 | 0 / 0  | 1818 | |
| jornadas | - | 0 | - | 0 | 0 / 0  | 1767 | |
| knowledge | - | 0 | - | 0 | 0 / 0  | 1808 | |
| market-intelligence | - | 0 | - | 0 | 0 / 0  | 1773 | |
| market-intelligence/deck | prospect | 0 | - | 0 | 0 / 0  | 1808 | |
| market-intelligence/hub | - | 0 | - | 0 | 1 / 0 color-contrast | 1979 | |
| mesa-tratamento | - | 0 | - | 0 | 0 / 0  | 1921 | |
| metas | - | 0 | - | 0 | 0 / 0  | 2021 | |
| module-access | - | 0 | - | 0 | 0 / 0  | 1948 | |
| notifications | - | 0 | - | 0 | 0 / 0  | 1899 | |
| objections_matrix | - | 0 | - | 0 | 0 / 0  | 1950 | |
| pending-actions | - | 1 | 404 /api/agent/commercial-cell/pending-actions | 0 | 0 / 0  | 1802 | |
| pipeline_ponderado | - | 0 | - | 0 | 0 / 0  | 1785 | |
| playbooks | - | 0 | - | 0 | 0 / 0  | 2169 | |
| processos | - | 0 | - | 0 | 0 / 0  | 1856 | |
| propostas | - | 0 | - | 0 | 0 / 0  | 1904 | |
| prospect | - | 0 | - | 0 | 0 / 0  | 2110 | |
| prospect/inteligente | - | 0 | - | 0 | 0 / 0  | 1888 | |
| qualification_matrix | - | 0 | - | 0 | 0 / 0  | 1933 | |
| reports | - | 0 | - | 0 | 0 / 0  | 1789 | |
| resilience | - | 0 | - | 0 | 1 / 0 color-contrast | 1787 | |
| roleplay | - | 0 | - | 0 | 1 / 0 color-contrast | 1970 | |
| roteiros | - | 0 | - | 0 | 0 / 0  | 1826 | |
| sdr-diagnostic | - | 0 | - | 0 | 0 / 0  | 1938 | |
| settings | - | 0 | - | 0 | 0 / 0  | 1867 | |
| settings/pillars | settings/pillars/hub | 0 | - | 0 | 1 / 1 label | 1781 | |
| settings/pillars/ai | - | 0 | - | 0 | 2 / 2 label, select-name | 1985 | |
| settings/pillars/market | - | 0 | - | 0 | 1 / 1 label | 1889 | |
| settings_ai | settings/pillars/ai | 0 | - | 0 | 2 / 2 label, select-name | 1924 | |
| settings_automation | settings/pillars/automation | 0 | - | 0 | 1 / 1 label | 1751 | |
| settings_engagement | settings/pillars/engagement | 0 | - | 0 | 1 / 1 label | 1950 | |
| settings_hub | settings/pillars/hub | 0 | - | 0 | 1 / 1 label | 1728 | |
| settings_market | settings/pillars/market | 0 | - | 0 | 1 / 1 label | 1764 | |
| settings_performance | settings/pillars/performance | 0 | - | 0 | 1 / 1 label | 1792 | |
| settings_predictability | settings/pillars/predictability | 0 | - | 0 | 2 / 2 label, select-name | 1937 | |
| settings_sales | settings/pillars/sales | 0 | - | 0 | 1 / 1 label | 1699 | |
| signals-risks | - | 0 | - | 0 | 0 / 0  | 1883 | |
| signals-risks/deal-risks | - | 0 | - | 0 | 1 / 1 color-contrast | 2128 | |
| signals-risks/radar | - | 0 | - | 0 | 0 / 0  | 2043 | |
| team | - | 0 | - | 0 | 0 / 0  | 2157 | |
| topic_training | - | 0 | - | 0 | 0 / 0  | 1815 | |
| usage | - | 0 | - | 0 | 0 / 0  | 1784 | |
| voice-hub | - | 0 | - | 0 | 1 / 1 color-contrast | 1887 | |
| war-room | - | 0 | - | 0 | 0 / 0  | 1908 | |
| winloss | - | 0 | - | 0 | 0 / 0  | 1861 | |
| workspace | - | 0 | - | 0 | 0 / 0  | 2063 | |

(Células "axe" = nº de violações crítica/séria em desktop claro / escuro; "-" = nenhuma. Overflow em px de scrollWidth-clientWidth a 390px.)

## Contraste de títulos no tema CLARO (A11Y-001)
Método: em cada rota, desktop claro, para todo h1-h4 visível, `getComputedStyle().color` vs. fundo efetivo (composição alfa dos ancestrais com background-color; fallback branco). Limiar WCAG: 4.5:1, ou 3:1 se >=24px (ou >=18.66px e peso>=700). Limitação: onde há `background-image` (gradiente) sob o título o fundo estimado é aproximado (campo `bgImageUnderneath`); NÃO medi pixel a pixel.
- 445 títulos em 70 telas; 444 passam; 1 falha.
- Cores computadas dominantes: h1-h3 `rgb(3,105,161)` (#0369A1) sobre `rgb(244,247,251)` e `rgb(255,255,255)` => 5,52:1 (AA para texto normal) — 358 de 445. Texto escuro `rgb(15,23,42)` (#0F172A) em 76. Menor razão fora a falha: 4,91:1 (dashboard H2 "Jornada Comercial 360°"), 5,27:1 (team H2).
- Telas amostradas explicitamente (valores medidos): home (H1 #0369A1/#F4F7FB 5,52:1), dashboard (H2 4,91:1), activities (H1 5,52:1), analytics (H1 5,52:1), team (H2 5,27:1), characters (falha, abaixo).
- FALHA: `/app/characters` H1 "29 Personagens Oficiais", 30px, cor `rgb(255,193,7)` (#FFC107, ouro neon) sobre `rgb(244,247,251)`: 1,52:1 (mínimo exigido 3:1). Evidência: `<scratchpad>/shots/characters__light_d.png`. Conclusão: A11Y-001 está efetivamente tratado nos títulos de todas as telas inventariadas, EXCETO characters (e axe não detecta isso, pois o título não é reportado no desktop claro — ver "observações" abaixo).
- Observação: o axe também não reportou o H1 de characters; é provável que o título use cor via classe/efeito que o axe considera indeterminado. Aferição própria prevalece.

## Os 10 piores achados
Classificação conforme PROTOCOLO_QUALIDADE_E_ACEITE §3. Todos PRÉ-EXISTENTES (nenhum src/ foi tocado). Screenshots em `<scratchpad>/shots/`.
1. `label` crítico em 9 rotas de configuração de pilares (`settings/pillars/*`, `settings_*`): checkbox `.sr-only` e inputs sem label associada (ex.: "Element does not have an implicit (wrapped) <label>"). Evidência: `settings_hub__light_d.png`, `settings_ai__dark_d.png`. Classificação: OBRIGATÓRIO (a11y mínima do .claude/CLAUDE.md §10; eslint `label-has-associated-control` já é débito conhecido). Dono: 02/03 (REQUER OUTRO AGENTE).
2. `select-name` crítico em `settings/pillars/ai`, `settings_ai`, `settings_predictability` (selects sem nome acessível). Evidência: `settings_ai__light_d.png`. OBRIGATÓRIO. Dono: 02/03.
3. `button-name` crítico em `/app/gamification` (botão `.appearance-none` sem texto). Evidência: `gamification__light_d.png`. OBRIGATÓRIO. Dono: 02/03.
4. `/app/characters` H1 ouro #FFC107 sobre fundo claro, 1,52:1 (A11Y-001 residual). Evidência: `characters__light_d.png`. OBRIGATÓRIO (contraste AA; regra da constituição sobre títulos no tema claro). Dono: 03.
5. `color-contrast` sério em `/app/voice-hub` (12 nós em luz; ex.: texto #F8F9FF sobre #FFFFFF 1,05:1; #90A1B9 sobre branco 2,63:1) — card `bh-platform-card` com texto claro sobre superfície clara no tema claro. Evidência: `voice-hub__light_d.png` e `voice-hub__dark_d.png` (também falha em dark). OBRIGATÓRIO. Dono: 12/03 (módulo marcado como legado/503 pelo gate; DECISÃO HUMANA se o módulo deve voltar).
6. `color-contrast` sério em `/app/failover` e `/app/resilience` (emerald-500 #00BC7D sobre branco/#E6F8F2: 2,24-2,47:1; 6 nós). Evidência: `failover__light_d.png`. OBRIGATÓRIO. Dono: 03/10.
7. `color-contrast` sério em `/app/roleplay` (amber-500 #FE9A00 sobre branco 2,13:1, 3 nós), `/app/market-intelligence/hub` (#28A188 sobre #D9EAEC 2,58:1), `/app/signals-risks/deal-risks` (#020618 sobre #8C6A04 4,01:1, `.bh-official-control`), `/app/dashboard` (1 nó, claro e escuro; NÃO reproduzido na segunda execução do axe de detalhe — intermitente/depende de dados). Evidência: `roleplay__light_d.png`, `signals-risks_deal-risks__light_d.png`, `dashboard__dark_d.png`. OBRIGATÓRIO. Dono: 03/04.
8. `/app/characters`: `GET /api/agent/characters` e `/activity` responderam 429 na primeira varredura (2 shards em paralelo) e 500 em reexecução isolada. Console error. Evidência: `results.jsonl` (campo `net`), `characters__light_d.png`. O 429 provavelmente é artefato de carga do meu inventário; o 500 é erro real do backend para org nova. OBRIGATÓRIO investigar o 500 (REQUER OUTRO AGENTE: 13 — Enxame/agentes de runtime). CORREÇÃO (00, após revisão do CodeRabbit/24): `results.jsonl` registra apenas os 429; o 500 foi relatado pelo Agente 14 numa reexecução isolada (`detail.mts`) cuja saída não foi guardada, então método/URL/horário/corpo da resposta NÃO estão disponíveis e não serão inventados. Status do achado: 500 NÃO VERIFICADO até ser reproduzido. Para reproduzir: subir o servidor como no item de ambiente (sem `API_RATE_LIMIT_MAX` alto não é necessário), autenticar como ADMIN de uma organização recém-criada (sem dados) e executar `GET /api/agent/characters` e `GET /api/agent/characters/activity` com o cookie de sessão, registrando status, corpo e o log do servidor. Só então abrir o handoff 14→13.
9. 404 em `/api/agent/commercial-cell/pending-actions` (rotas `pending-actions` e `intelligence/pending-actions`) e `/api/commercial-agent/mission/default/trace` (`intelligence/elite-agent`), com console error (2/1/1). Para org nova pode ser estado vazio mal tratado como erro (sem a distinção empty vs. error exigida em AGENTS.md §25). Evidência: `pending-actions__light_d.png`. OBRIGATÓRIO a confirmar (REQUER OUTRO AGENTE: 07/18). Não confirmei se o 404 é "sem dado" ou "rota ausente".
10. `/app/editor`: 429 em `GET /api/knowledge` na varredura em paralelo (não reproduzido isoladamente). Classificação: OPCIONAL/artefato de carga (rate limiter sob 2 shards); registrado por honestidade.
Também OPCIONAL: avisos THREE.Clock deprecated e GPU stall (WebGL) — PRÉ-EXISTENTE; `pg` DeprecationWarning no servidor.
DECISÃO HUMANA: nenhuma estética avaliada (não houve revisão visual subjetiva das capturas); as capturas ficam disponíveis para o 03/24.

## Testes
auth 4/4, accessibility 34/34, mobile-sweep 1/1 (todos TESTADO, reexecutados após reprovisionamento). O inventário é observação, não gate.

## Evidências
Dados brutos por rota/variante (url final, ms, console, rede, overflow, axe, headings): `<scratchpad>/results.jsonl`. Log do servidor: `<scratchpad>/server.log`.

## NÃO EXECUTADO
- Testes visuais com snapshots (`visual.spec.ts`), `--update-snapshots`: por instrução.
- Rotas com papel não-ADMIN (SDR/CLOSER/VISUALIZADOR) e comportamento de `RequireRole`: usuário foi ADMIN.
- `market-intelligence/accounts/:id`, `/app` (index), `settings/pillars/{sales,performance,predictability,automation,engagement,hub}` por URL direta (cobertas por redirect das settings_*).
- Interações (cliques/modais/forms) além do carregamento; verificação visual subjetiva dos 280 screenshots (não inspecionei imagem por imagem; achados baseados em métricas/axe).
- Meilisearch não provisionado; busca/indexação não exercitadas.
- Revisão do Agente 24 sobre este relatório (§40).

## Problemas fora do escopo / Handoffs abertos
Nenhum handoff novo criado (achados classificados acima apontam os donos; o 00 decide). Sugestão: handoffs 14→03 (contraste/labels), 14→13 (characters 500), 14→07/18 (404 pending-actions).

## Aprendizados reutilizáveis
- Reprovisionar após queda: o diretório `/tmp/pgd/data` costuma sobreviver; basta `rm -f postmaster.pid`, `pg_ctl start` como `postgres` e `redis-server --daemonize yes`; não precisa refazer bootstrap/migrate.
- Inventário de rotas em paralelo (2 shards) gera 429 espúrios em `/api/*`; usar 1 shard para dados limpos.
- Funções passadas a `page.evaluate` a partir de `.mts` rodado com tsx quebram (helper `__name` do esbuild); passar como string/arquivo JS.

## Pendências / Riscos
- Parecer do 24. Serviços locais são efêmeros (reprovisionar após reinício). Servidor de teste (porta 3000) encerrado ao final; Postgres e Redis seguem ativos.
