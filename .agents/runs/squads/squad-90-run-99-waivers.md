# RUN 99 — Poda de waivers Trivy + classificação de hotspots (Squad 90)

**Agente:** 99 — Vito (AppSec, SAST e Secret Scanning)
**Data:** 2026-11-24 · **DEM:** DEM-20261123-001
**Branch:** `agente/99-trivy-waivers-s90` · **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-90/wt-99`
**Base:** `coord/squad-90` @ `356d8a22e` · **Lease:** `.agents/runs/leases/squad-90-wt99.lease` (portas 22900-22999)
**Autorização:** deliberação humana §3 (renovação/poda de waivers).

---

## 1. Reprodução do scanner — ferramenta efetivamente usada (e limitação honesta)

`trivy` **não pôde ser executado** neste host:

- `trivy` não está no PATH; binário `trivy.exe` v0.76.2 baixado anteriormente é bloqueado por
  política de App Control do Windows (não contornado, conforme instruído).
- `docker version` → daemon acessível apenas via TCP `192.168.0.116:2375` → `i/o timeout`
  (além de proibido pela regra do squad, está inalcançável).
- `npx trivy` / `npm view trivy` / `npm view osv-scanner` → pacotes inexistentes no registry npm.
- `semgrep`/`gitleaks`/`osv-scanner` não instalados.

**Alternativa autorizada utilizada (equivalente para o escopo de waivers de vulnerabilidade):**

1. `npm audit --json` no worktree (registry npm real) → **0 high, 0 critical**; apenas 2 moderate
   (`@opentelemetry/auto-instrumentations-node` → `@opentelemetry/instrumentation-http`), já
   documentados em "Débito conhecido" de `AUDIT_WAIVERS.md`.
2. Extração de todas as versões resolvidas dos 11 pacotes waivados nos **3 lockfiles escaneados**
   pelo gate (`package-lock.json` raiz, `agente-codigo-local/package-lock.json`,
   `landing/package-lock.json`). `pnpm-lock.yaml` e `agente-codigo-local/bun.lock` estão em
   `skip-files` do job `trivy-fs-pr-gate` (`.github/workflows/security-trivy.yml:65`).
3. Consulta ao **OSV API** (`api.osv.dev/v1/querybatch` + `/v1/vulns/{id}`) para os IDs com
   cobertura OSV e à **GitHub Advisory Database API** (`api.github.com/advisories/{ghsa}`) para
   os GHSAs que o OSV ainda não espelha — é a mesma fonte primária que alimenta o banco de
   vulnerabilidades do Trivy para ecossistema npm.
4. Comparação do `vulnerable_version_range`/`ranges.events` de cada advisory contra cada versão
   resolvida — um a um, não por pacote.

**Limitação residual (registrada, não mascarada):** o banco do Trivy pode ter defasagem própria em
relação à GitHub Advisory DB/OSV. Como o gate é fail-closed, se algum ID podado ainda for reportado
pelo Trivy em CI, o `trivy-fs-pr-gate` falha e o waiver precisa ser reintegrado. Risco avaliado como
baixo porque os ranges foram conferidos na fonte primária. Confirmação definitiva: observar o
primeiro run do `trivy-fs-pr-gate` após merge (ou rodar `trivy fs` em qualquer host com a ferramenta).

## 2. Divergência 36 waivers históricos vs 40 entradas atuais — conciliada

- `.trivyignore.yaml` na base tinha **40 entradas** (IDs, contando duplicatas de caixa GHSA
  maiúsculo/minúsculo). Os "36" do plano correspondiam aos waivers com `expired_at: 2026-11-30`;
  +3 entradas `picomatch` com `expired_at: 2026-12-17` = 40. Não havia divergência real — era
  contagem de entradas vs. contagem de advisories únicos (os pares maiúsculo/minúsculo são o mesmo
  advisory indexado sob caixa diferente; ambos foram mantidos por precaução pois o matching do
  Trivy não é documentado como case-insensitive para todos os backends).
- `AUDIT_WAIVERS.md` listava 7 blocos em "Waivers ativos" (effect, picomatch, better-auth ×3,
  dompurify ×3, nodemailer ×2+1, source-map-js, undici ×5, deepmerge-ts ×2, @vitest/mocker ×2,
  re2js) — mais verboso que o `.trivyignore.yaml` porque agrupa IDs.
- `allow-ghsas` (dependency-review.yml + ci.yml) tinha 9 IDs.

## 3. Classificação de cada waiver (versão resolvida → range vulnerável → veredito)

| Pacote | Versões no(s) lockfile(s) escaneado(s) | Advisory | Range vulnerável | Veredito |
|---|---|---|---|---|
| `deepmerge-ts` | 8.0.2 | GHSA-ggr8-5vv4-36mx / CVE-2026-40345 | `<8.0.0` | **corrigido-obsoleto** (Prisma 7.x já adotou fix) |
| `effect` | 3.22.5 | GHSA-7589-6fvf-x4pw | `<=3.22.0` (fix 3.22.1) | **corrigido-obsoleto** — "espelho pendente" tornou-se desnecessário |
| `better-auth` (+`@better-auth/core`) | 1.7.14 | GHSA-44JH-23M7-HPCF (low), GHSA-R4XP-PRCW-77QF (high), GHSA-965C-763C-88JM (critical) | `<1.7.7` / `<1.7.0` / `<1.7.7` | **corrigido-obsoleto** (OAuth state/magic-link corrigidos upstream) |
| `dompurify` | 3.4.17 | GHSA-CG2G-XH64-V4Q7, GHSA-MRV2-3PQR-J5JR, GHSA-C6GR-QVV4-5V3F (todos low) | `<=3.4.16` | **corrigido-obsoleto** |
| `brace-expansion` | 2.1.7, 5.0.13 (×4 cópias) | GHSA-Q2HR-2G5M-VWHR, GHSA-QHR7-859C-M2P7, GHSA-6J4F-FJ2G-MC7P, GHSA-G57G-F23G-4646, GHSA-V53P-9FQP-M79J | `<2.1.7`/`<5.0.12` etc. | **corrigido-obsoleto** |
| `nodemailer` | 10.2.1 | GHSA-PRGH-XP8R-P3M5, GHSA-7X8W-G892-F33R | `<=10.0.4`–`<10.0.9` | **corrigido-obsoleto**. Nota: `GHSA-7X8W-G892-F33R` retorna 404 na GitHub Advisory API e era alias de `CVE-2026-93749` (source-map-js), rotulado errado como "nodemailer" no `.trivyignore.yaml` — ambos resolvidos |
| `source-map-js` | 1.2.2 (3 lockfiles) | CVE-2026-93749 | `<=1.2.1` | **corrigido-obsoleto** |
| `undici` | 6.29.1, 7.30.1, 7.30.2, 8.12.3 | CVE-2026-84961, CVE-2026-19534, GHSA-xjj6-f33q-929c, GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472 | fixes por major (6.29.1/7.30.1/8.12.2) | **corrigido-obsoleto** — todas as cópias nos limites/fora do range |
| `@vitest/mocker` | 4.1.12 | GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp | fixed em 4.1.12 | **corrigido-obsoleto** (exatamente a versão de fix) |
| `re2js` | 2.9.1 (só `agente-codigo-local`) | CVE-2026-116795 | fix 2.8.7 (OSV) | **corrigido-obsoleto** |
| `picomatch` | 4.0.7 (3 lockfiles) | GHSA-FC5Q-39XC-VJPF / CVE-2026-112366 | `<=4.0.7`; 4.0.7 é a última versão publicada (2026-08-24) | **sem-patch — AINDA VÁLIDO** (GHSA marcado "Withdrawn" no GitHub, mas CVE permanece `last_affected` no OSV; mantidas as 3 entradas) |

**Resultado:** 36 de 39 advisory-IDs únicos removidos; único waiver remanescente = picomatch
(3 entradas: GHSA maiúsculo, GHSA minúsculo, CVE). `expired_at: 2026-12-17` **não renovado** —
mantido o prazo já vigente; reavaliação substantiva fica para 17/12 ou quando upstream publicar
patch (verificar `npm view picomatch version`).

## 4. Alterações aplicadas (todas fail-closed preservado)

| Arquivo | Mudança |
|---|---|
| `.trivyignore.yaml` | 40 → 3 entradas (só picomatch). Cabeçalho documenta a poda e a evidência |
| `docs/security/AUDIT_WAIVERS.md` | "Waivers ativos" reduzido à entrada picomatch (revalidada); os 10 blocos resolvidos movidos para "## Histórico" com evidência item a item; entrada effect/picromatch atualizada |
| `.github/workflows/dependency-review.yml` | `allow-ghsas`: 9 → 2 IDs (só picomatch); comentário do cabeçalho atualizado |
| `.github/workflows/ci.yml` | `allow-ghsas`: idem |

**Não alterado (propositalmente):** `docs/architecture/HOTSPOT_EXCEPTIONS.md` — renovação de exceção
de arquivo de outro squad não cabe ao Squad 90 (ver §5). Nenhum check desativado; nenhuma poda além
dos IDs comprovados.

## 5. Os 11 hotspots arquiteturais — decisão individual (documento, sem renovação silenciosa)

Gate `check:hotspots` executado: **PASS** (11 exceções válidas até 2026-11-30; contagens reais abaixo).
Vencimento formal das exceções: **30/11**; decisão humana recomendada até **29/11 21h -03**.

| # | Arquivo | Atual/Limite | Folga | Dono registrado | Decisão proposta |
|---|---|---|---|---|---|
| 1 | `Landing360.tsx` | 3191/3500 | 309 | Marks-Mah (Squad 30) | **Exceção fundamentada** até 14/12 + branch de refatoração (fatiar seções) — sem urgência de linhas |
| 2 | `Landing360Impeccable.tsx` | 1021/1050 | **29** | Agente 15 legado (Squad 30) | **ALTA PRIORIDADE** — qualquer PR de formatação quebra o gate. Extrair subcomponentes (<800). Exceção só como ponte de 14d |
| 3 | `extraction.ts` (Bitrix) | 1042/1100 | 58 | Agente 06A (Squad 50) | Exceção 14d condicionada a split paginação/streaming/parse |
| 4 | `CommercialIntelligence.ts` | 1231/1250 | **19** | maarkss1 (Squad 40) | **ALTA PRIORIDADE** — catálogo de tipos crescendo; split por subdomínio com barrel de re-export |
| 5 | `leads.routes.ts` (prospecting) | 1440/1500 | 60 | Agente 05 (Squad 40) | Exceção 14d condicionada a extrair controllers secundários |
| 6 | `voice-hub design-system/index.tsx` | 1099/1200 | 101 | Agente 12 (Squad 60) | Exceção 14d; desmembrar barrel em módulos por categoria |
| 7 | `intelligence.routes.ts` | 1054/1100 | 46 | Agente 07 (Squad 70) | Exceção 14d; sub-routers por domínio (agents/swarm/automations) |
| 8 | `marketIntelligenceCompany.service.ts` | 1016/1020 | **4** | Agente 13 (Squad 70) | **CRÍTICO** — 4 linhas de folga; qualquer edição quebra. Extrair helpers é pré-requisito de qualquer PR que toque o arquivo; exceção curta (7d) ou refatoração imediata |
| 9 | `workflowRuntimeService.ts` | 1437/1500 | 63 | Agente 06 (Squad 60) | Exceção 14d; decompor motor IVR em serviços menores |
| 10 | `LeadDetailDrawer.tsx` | 1052/1100 | 48 | Agente 02 (Squad 40) | Exceção 14d; extrair abas para componentes filhos |
| 11 | `PillarRegistry.tsx` | 1403/1450 | 47 | Agente 02/03 (Squad 30) | Exceção 14d; progresso real (1773→1403) — extrair os 5 viewers restantes |

**Recomendação ao Astra (não executada por mim):** exceção única de 14 dias (até 14/12/2026) apenas
para os itens 1, 3, 5, 6, 7, 9, 10, 11, **condicionada à abertura de branches de refatoração** para
os 5 maiores/mais apertados (`Landing360.tsx`, `leads.routes.ts`, `workflowRuntimeService.ts`,
`PillarRegistry.tsx`, `extraction.ts`) e tratamento diferenciado dos críticos de folga:
`marketIntelligenceCompany.service.ts` (4 linhas — exceção mínima de 7 dias ou refatoração
imediata pelo dono), `CommercialIntelligence.ts` (19) e `Landing360Impeccable.tsx` (29).
Renovar as 11 em bloco sem condição repetiria o ciclo que gerou o vencimento de 30/11.

## 6. Testes / verificações executadas

- `npm audit --json` → 0 high/critical, 2 moderate ✅
- `npm run security:audit-waivers` → "nenhum achado HIGH/CRITICAL. Gate OK." ✅
- `npx tsx scripts/architecture/check-hotspots.ts` → 0 falhas, 11 exceções válidas ✅
- OSV `querybatch` 15 combos pacote@versão → todos CLEAN (picomatch confirmado via CVE dedicado)
- GitHub Advisory API: 13/14 GHSAs consultados; ranges conferidos; `GHSA-7X8W-G892-F33R` = 404
- Contagem de linhas dos 11 hotspots vs. limites excepcionais (tabela §5)

## 7. Bloqueios / pendências

1. **Confirmação `trivy fs` em CI** — primeira execução do `trivy-fs-pr-gate` após merge é a prova
   final; fail-closed protege contra falso negativo.
2. **`picomatch`** — sem patch upstream; monitorar `npm view picomatch version` > 4.0.7; waiver
   expira 17/12.
3. **Hotspots** — decisão de renovação/contingência é do Astra/humano (dono dos arquivos é de
   outros squads); minha recomendação está em §5 e no handoff.
4. **Ownership note:** editei `.github/workflows/{ci,dependency-review}.yml` (nominalmente Agente
   08/Tess) e `docs/security/AUDIT_WAIVERS.md` (docs, Agente 08/Dora) por exigência da regra de
   "mesma alteração" e da missão deliberada §3. Diff é mínimo (só `allow-ghsas` + documentação).
   Silas deve validar essa interpretação de propriedade.

---
*Vito (99) — Squad 90 · DEM-20261123-001*
