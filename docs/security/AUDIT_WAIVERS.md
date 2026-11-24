# Waivers de dependency audit (npm audit)

Criado na Fase Final 1 (Gate Único de Release, ver `.agents/runs/final-fase-1.md`).

**Fonte de verdade única** para dono, motivo e data de reavaliação de qualquer waiver de
vulnerabilidade de dependência neste repositório — inclusive as duas outras ferramentas que também
checam vulnerabilidade de dependência em PR (ITEM-10, Onda 2):

- `.trivyignore.yaml` — waivers do gate de PR do Trivy (`.github/workflows/security-trivy.yml`,
  job `trivy-fs-pr-gate`) e do scan de imagem em produção (`.github/workflows/production.yaml`).
- `allow-ghsas` em `.github/workflows/dependency-review.yml` — waivers do Dependency Review.

Os dois arquivos acima só espelham o(s) mesmo(s) advisory ID(s) já registrados aqui embaixo, no
formato que cada ferramenta entende. Ao registrar, expirar ou remover um waiver **neste** arquivo,
atualize os outros dois na mesma alteração — eles não leem este arquivo automaticamente.

## Regra

`npm audit --audit-level=high` roda como gate obrigatório (sem `continue-on-error`) em todo
workflow que publica artefato (`ci.yml`, `production.yaml`, `cd-homolog.yml`). Um achado
`HIGH`/`CRITICAL` **bloqueia o pipeline** por padrão.

Se um achado `HIGH`/`CRITICAL` precisar ser aceito temporariamente (ex.: sem fix disponível, ou fix
é breaking change que exige uma onda própria de migração), o waiver precisa:

1. Ser registrado numa entrada nova neste arquivo (não só num comentário de workflow).
2. Ter dono, motivo e data de reavaliação.
3. Ser aprovado pelo Agente 00 (ou pelo dono do repositório) antes de voltar a usar
   `continue-on-error: true` no workflow — e o `continue-on-error` deve citar esta entrada por
   título/data, não ficar solto sem referência.
4. Nunca cobrir mais do que o(s) advisory ID(s) específico(s) listado(s) — não é uma licença para
   ignorar auditoria em geral.

## Waivers ativos

### `GHSA-FC5Q-39XC-VJPF` / `CVE-2026-112366` — `picomatch` (ReDoS through single-branch repeated extglobs)

- **Advisory:** https://github.com/advisories/GHSA-fc5q-39xc-vjpf (`GHSA-FC5Q-39XC-VJPF` / `CVE-2026-112366`)
- **Severidade reportada pelo `npm audit`:** high (CVSS 7.5 — propaga para `@rollup/plugin-*`, `@storybook/*`, `@typescript-eslint/*`, `dependency-cruiser`, `knip`, `tinyglobby`, `ts-morph`, `unplugin`, `vite`, `vite-plugin-pwa`, `vitest`, `workbox-build`, `node-gyp` e `libxmljs2`)
- **Cadeia:** `picomatch@<=4.0.7` (`range: "*"` — nenhuma versão corrigida publicada no registro npm até 2026-11-24; `4.0.7` é a última release upstream, publicada em 2026-08-24). Confirmado via OSV (`CVE-2026-112366`, `last_affected: 4.0.7`, sem `fixed`) e GitHub Advisory Database em 2026-11-24. O GHSA está marcado como "Withdrawn Advisory" no GitHub, mas o CVE subjacente permanece válido e é o ID que o Trivy reporta — por isso as três entradas (GHSA maiúsculo/minúsculo + CVE) permanecem em `.trivyignore.yaml`.
- **Motivo:** Advisory sem versão de patch upstream disponível (`range: <=4.0.7`, última versão publicada é a vulnerável). Toca exclusivamente ferramentas de build, lint e teste (`vite`, `vitest`, `rollup`, `typescript-eslint`, `dependency-cruiser`, `knip`), que avaliam globs estáticos controlados pelo repositório em tempo de desenvolvimento/CI e nunca processam padrões glob arbitrários vindos de entrada não confiável de usuário em runtime de produção. Aceito temporariamente até publicação de patch upstream em `picomatch`.
- **Dono:** Agente 00 / Agente 15 (Segurança) — revalidado pelo Agente 99 (Vito) em 2026-11-24.
- **Data de registro:** 2026-11-17. **Reavaliar em:** 2026-12-17 (`expired_at: 2026-12-17` nas três entradas de `.trivyignore.yaml`).

> **Nota de poda (2026-11-24, Agente 99 — Vito):** todos os demais waivers antes ativos neste
> arquivo foram removidos por estarem comprovadamente obsoletos — as versões resolvidas nos
> lockfiles escaneados pelo Trivy já estão acima do range vulnerável de cada advisory
> (`npm audit --audit-level=high` = 0 high/critical; ranges conferidos um a um na GitHub
> Advisory Database e OSV). Detalhamento completo em "## Histórico" e em
> `.agents/runs/squads/squad-90-run-99-waivers.md`.

## Débito conhecido, fora do escopo deste waiver (severidade abaixo do gate)

### `GHSA-8988-4f7v-96qf` / `CVE-2026-54285` — `@opentelemetry/core` (Unbounded memory allocation em W3C Baggage propagation)

- **Advisory:** https://github.com/advisories/GHSA-8988-4f7v-96qf — `W3CBaggagePropagator.extract()` em
  `@opentelemetry/core <2.8.0` não aplica limite de tamanho ao fazer parsing do header HTTP `baggage`
  inbound (a especificação recomenda máx. 8192 bytes / 180 entradas; a versão vulnerável só aplicava
  isso no envio, não no recebimento). Corrigido em `@opentelemetry/core@2.8.0`.
- **Severidade reportada pelo `npm audit`:** moderate (CVSS 5.3) — propaga moderate (não high/critical)
  para `@opentelemetry/exporter-otlp-http`, `@opentelemetry/resources`, `@opentelemetry/sdk-metrics-base`
  e `@opentelemetry/sdk-trace-base`; 5 achados moderate no total, todos a mesma cadeia raiz.
  `fixAvailable: false` para `@opentelemetry/core`/`@opentelemetry/exporter-otlp-http` confirmado em
  `npm audit --json` (rodado em 2026-09-11); `npm audit fix --dry-run` confirma que nenhum desses
  pacotes muda de versão automaticamente (só resolveria os achados `high` do Prisma via downgrade
  major, já coberto pelo waiver `GHSA-ggr8-5vv4-36mx` acima).
- **Cadeia:** duas cadeias paralelas, nenhuma envolvendo o OpenTelemetry realmente usado em produção:
  - `@opentelemetry/exporter-otlp-http@^0.26.0` (devDependency direta em `package.json`, pacote OTel
    **legado/depreciado**, substituído há anos por `@opentelemetry/exporter-trace-otlp-http` e
    `@opentelemetry/exporter-metrics-otlp-http`) → cópia própria de `@opentelemetry/core <2.8.0` em
    `node_modules/@opentelemetry/exporter-otlp-http/node_modules/@opentelemetry/core`.
  - `@opentelemetry/sdk-metrics-base` (transitiva, pacote também depreciado, substituído por
    `@opentelemetry/sdk-metrics`) → outra cópia própria de `@opentelemetry/core <2.8.0` em
    `node_modules/@opentelemetry/sdk-metrics-base/node_modules/@opentelemetry/core`.
- **Por que não é tratado como waiver formal (não entra em "## Waivers ativos", não é espelhado em
  `.trivyignore.yaml`/`allow-ghsas`):**
  1. **Abaixo do gate nas três ferramentas deste repositório.** `scripts/security/check-audit-waivers.ts`
     roda `npm audit --audit-level=high` (só falha para `high`/`critical`); `dependency-review.yml` usa
     `fail-on-severity: high`; `security-trivy.yml`/`cd-homolog.yml` usam `severity: HIGH,CRITICAL`.
     Nenhuma delas sequer avalia um achado `moderate` — não há gate para desbloquear, então uma entrada
     em "## Waivers ativos" (reservada a achados que bloqueiam CI e exigem aprovação do Agente 00 antes
     de religar `continue-on-error`) ou um espelho em `.trivyignore.yaml`/`allow-ghsas` seria inerte e
     diluiria o propósito dessas listas.
  2. **Raio de exposição real também é baixo, independente do gate.** `src/lib/tracing.ts` (única
     inicialização de OpenTelemetry no runtime real, `initTracing()`) importa só
     `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`,
     `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/exporter-metrics-otlp-http` e
     `@opentelemetry/sdk-metrics` — pacotes diferentes e mais novos (`^0.220`/`^0.222`), que carregam sua
     própria cópia de `@opentelemetry/core`, não listada entre os `nodes` afetados no relatório do
     `npm audit`. Busca em `src/` confirma que `@opentelemetry/exporter-otlp-http` (a devDependency
     vulnerável) não é importada em nenhum arquivo — é devDependency não utilizada. O parsing vulnerável
     de `baggage` nunca executa no processo Express real desta aplicação. Mesmo num cenário hipotético
     de uso, o próprio advisory nota que o Node.js limita por padrão o tamanho de header HTTP a 16KB
     (`--max-http-header-size` não é elevado neste projeto), o que já reduz bastante o impacto prático.
- **Dono:** Agente 15 — recomendação para o Agente 00/dono de `package.json`: `@opentelemetry/exporter-otlp-http`
  aparenta ser devDependency morta (substituída pelos pacotes `exporter-trace-otlp-http`/
  `exporter-metrics-otlp-http`, já em uso real); removê-la eliminaria uma das duas cadeias sem precisar
  de waiver nenhum. Fora do escopo desta entrada — quem faz essa alteração precisa mexer em
  `package.json`, propriedade de outro dono.
- **Data de registro:** 2026-09-11. **Reavaliar em:** quando `@opentelemetry/exporter-otlp-http` for
  removida/substituída, ou em 60 dias (`2026-11-11`) — prazo mais longo que os waivers `high` acima
  porque este achado não bloqueia nenhum gate.
- **Escopo:** só este advisory (`GHSA-8988-4f7v-96qf`/`CVE-2026-54285`), moderate, sem pressão de CI.
  Se o `npm audit` algum dia reportar essa cadeia como `high`/`critical` (ex.: nova vulnerabilidade
  agregando severidade, como já ocorreu com `mysql2` acima), este item precisa ser promovido para
  "## Waivers ativos" e espelhado nos outros dois arquivos antes que o gate volte a bloquear.

## Histórico

- 2026-11-24 — **Poda de 37 waivers comprovadamente obsoletos** (Agente 99 — Vito, DEM-20261123-001,
  branch `agente/99-trivy-waivers-s90`, base `coord/squad-90` @ `356d8a22e`). `trivy` não executável
  neste host (binário bloqueado por App Control; Docker só via TCP 2375, proibido/inalcançável),
  então a verificação usou a alternativa autorizada: `npm audit --json` + conferência individual do
  `range` vulnerável de cada advisory na GitHub Advisory Database e OSV contra as versões resolvidas
  nos lockfiles escaneados pelo gate (`package-lock.json` raiz, `agente-codigo-local/package-lock.json`,
  `landing/package-lock.json`; `pnpm-lock.yaml` e `agente-codigo-local/bun.lock` estão em
  `skip-files` do `trivy-fs-pr-gate`). Resultado: `npm audit --audit-level=high` = **0 high/critical**
  (só 2 moderate de `@opentelemetry/*`, já documentados em "Débito conhecido"). Cada waiver foi
  classificado e só removido com prova de que a versão resolvida está fora do range vulnerável:
  1. **`deepmerge-ts` (`GHSA-ggr8-5vv4-36mx`/`CVE-2026-40345`)** — RESOLVIDO: lockfile tem
     `deepmerge-ts@8.0.2` (fix `>=8.0.0`; Prisma 7.x já adotou a versão corrigida). Era o waiver mais
     antigo do repositório (registrado 2026-08-17).
  2. **`effect` (`GHSA-7589-6fvf-x4pw`)** — RESOLVIDO: lockfile tem `effect@3.22.5` (fix `>=3.22.1`,
     boundary confirmado no OSV). O "espelho pendente" em `.trivyignore.yaml`/`allow-ghsas` tornou-se
     desnecessário — o advisory não é mais reportado em versão alguma do lockfile.
  3. **`better-auth` (`GHSA-44JH-23M7-HPCF`, `GHSA-R4XP-PRCW-77QF`, `GHSA-965C-763C-88JM`)** —
     RESOLVIDO: `better-auth@1.7.14` está acima do limite `<1.7.7` dos três advisories (o critical
     `GHSA-965C` e o high `GHSA-R4XP` de OAuth foram corrigidos upstream).
  4. **`dompurify` (`GHSA-CG2G-XH64-V4Q7`, `GHSA-MRV2-3PQR-J5JR`, `GHSA-C6GR-QVV4-5V3F`)** —
     RESOLVIDO: `dompurify@3.4.17` está acima do limite `<=3.4.16` dos três advisories.
  5. **`brace-expansion` (`GHSA-Q2HR-2G5M-VWHR`, `GHSA-QHR7-859C-M2P7`, `GHSA-6J4F-FJ2G-MC7P`,
     `GHSA-G57G-F23G-4646`, `GHSA-V53P-9FQP-M79J`)** — RESOLVIDO: cópias em `2.1.7` e `5.0.13`, ambas
     nos limites/fora dos ranges vulneráveis (`<2.1.7`/`<5.0.12` etc.).
  6. **`nodemailer` (`GHSA-PRGH-XP8R-P3M5`, `GHSA-7X8W-G892-F33R`)** — RESOLVIDO:
     `nodemailer@10.2.1` acima de todos os limites (`<=10.0.5`/`<10.0.9`). Nota: a entrada
     `GHSA-7X8W-G892-F33R` estava rotulada como "nodemailer" em `.trivyignore.yaml`, mas o ID é o
     alias GHSA de `CVE-2026-93749` (`source-map-js`) — também resolvido (`1.2.2` em todos os
     lockfiles escaneados). O ID retorna 404 na GitHub Advisory API.
  7. **`undici` (`CVE-2026-84961`, `CVE-2026-19534`, `GHSA-xjj6-f33q-929c`, `GHSA-4qv8-2p9j-2685`,
     `GHSA-f72v-6w45-q472`)** — RESOLVIDO: todas as cópias (`6.29.1`, `7.30.1`, `7.30.2`, `8.12.3`)
     estão nos limites/fora dos ranges corrigidos por major.
  8. **`source-map-js` (`CVE-2026-93749`)** — RESOLVIDO: `1.2.2` em todos os lockfiles escaneados
     (raiz, agente-codigo-local, landing).
  9. **`@vitest/mocker` (`GHSA-qxg6-89mg-rqv8`, `GHSA-xp26-3454-mjgp`)** — RESOLVIDO:
     `4.1.12` é exatamente a versão `fixed` dos dois advisories.
  10. **`re2js` (`CVE-2026-116795`)** — RESOLVIDO: `2.9.1` em `agente-codigo-local/package-lock.json`,
      acima do fix `2.8.7` (OSV).
  11. **`picomatch` (`GHSA-FC5Q-39XC-VJPF`/`CVE-2026-112366`)** — **AINDA VÁLIDO (sem patch
      upstream)**: `4.0.7` é a última versão publicada e permanece `last_affected` no OSV. Único
      waiver mantido; `expired_at: 2026-12-17` inalterado.
  Removidas as 37 entradas correspondentes de `.trivyignore.yaml` (de 40 para 3 IDs) e os 7
  advisory IDs resolvidos de `allow-ghsas` em `.github/workflows/dependency-review.yml` e
  `ci.yml` (mantidos apenas os 2 do picomatch, ainda-válido). **Ressalva de verificação:**
  `trivy fs` não pôde ser executado neste host — a confirmação final de que o Trivy não reporta
  mais nenhum dos IDs podados deve ocorrer no primeiro run do `trivy-fs-pr-gate` em CI (fail-closed:
  se algum ID ainda for reportado pela base do Trivy, o gate falha e o waiver precisa ser
  reintegrado — risco baixo dado que os ranges foram conferidos na GitHub Advisory Database, mesma
  fonte do banco do Trivy).

- 2026-09-11 — Fechamento de 5 waivers/entradas obsoletas, todos confirmados resolvidos antes de
  fechar (não só expirados por prazo): rodado `npm audit --audit-level=high --json` no HEAD atual
  e cada pacote checado contra a versão resolvida em `package-lock.json`.
  1. **`GHSA-3f6p-5ww8-9rcr` / `GHSA-rgwj-5xj2-c3m3` (`mysql2` via `prisma` CLI)** — não aparece
     mais no `npm audit`. Causa: `package.json` tem `overrides.mysql2: "^3.22.0"` (adicionado desde
     o registro original do waiver), que resolveu `mysql2` para `3.24.3` em todo o
     `package-lock.json` — acima do limite vulnerável de ambos advisories (`<3.16.0` e `<=3.23.0`).
  2. **`GHSA-RGJ7-G3M4-5G8C` (`@xenova/transformers`/`sharp`)** — não aparece mais. `sharp`
     resolvido em `0.35.4` via `overrides["@xenova/transformers"].sharp: "^0.35.3"`.
  3. **`GHSA-2883-XCG3-V3HH` (`js-yaml`)** — não aparece mais. Resolvido em `4.3.2` via
     `overrides["js-yaml"]: "^4.1.0"`.
  4. **`multer` (`GHSA-WC9G-MQFW-JRWM`/`GHSA-QFVM-CV95-JQJF`/`GHSA-QVFW-J98X-7Q72`/`GHSA-535W-7CP7-47Q4`)**
     — não aparece mais. Resolvido em `multer@2.3.0` (dependência direta).
  5. **`nodemailer` (`GHSA-8M3C-C648-2XJJ`/`GHSA-WMMP-3585-3RMP`/`GHSA-2X7J-588G-CCC2`/`GHSA-CC9R-2J5M-2M83`)**
     — não aparece mais. Resolvido em `nodemailer@9.1.1` (dependência direta).

  Estas 4 últimas entradas (itens 2-5) nunca tinham override/dependência documentado quando foram
  registradas em 2026-09-08 (texto genérico, sem detalhe de cadeia/exposição no padrão das outras
  entradas deste arquivo) — provavelmente já estavam resolvidas ou perto disso no momento do
  registro. `npm audit --audit-level=high --json` pós-edição confirma a mesma leitura de antes:
  só 3 achados `high` (cadeia `prisma`/`@prisma/config`/`deepmerge-ts`, waiver
  `GHSA-ggr8-5vv4-36mx` ainda válido, expira 2026-10-11) e 5 achados `moderate`
  (`@opentelemetry/core`, já documentado em "## Débito conhecido", não afetado por esta mudança).
  Nenhuma dependência foi alterada — só documentação. Removidas as entradas correspondentes de
  `.trivyignore.yaml` (5 IDs: `GHSA-3f6p-5ww8-9rcr`, `GHSA-rgwj-5xj2-c3m3`, `GHSA-RGJ7-G3M4-5G8C`,
  `GHSA-2883-XCG3-V3HH`, `GHSA-WC9G-MQFW-JRWM`, `GHSA-QFVM-CV95-JQJF`, `GHSA-QVFW-J98X-7Q72`,
  `GHSA-535W-7CP7-47Q4`, `GHSA-8M3C-C648-2XJJ`, `GHSA-WMMP-3585-3RMP`, `GHSA-2X7J-588G-CCC2`,
  `GHSA-CC9R-2J5M-2M83` — 12 IDs no total, contando os 4 GHSAs cada de `multer`/`nodemailer`) e de
  `allow-ghsas` em `.github/workflows/dependency-review.yml`, na mesma alteração. O waiver
  `GHSA-ggr8-5vv4-36mx`/`CVE-2026-40345` (`deepmerge-ts`) e o débito `@opentelemetry/core`
  permanecem intocados — fora do escopo deste fechamento.

- 2026-09-11 — Auditoria de rotina (Agente 15) encontrou 5 achados `moderate` novos em `npm audit
--json`, todos a mesma cadeia raiz `@opentelemetry/core` (`GHSA-8988-4f7v-96qf`/`CVE-2026-54285`,
  "Unbounded memory allocation in W3C Baggage propagation"), não registrados em nenhum dos 3 arquivos
  de waiver. Confirmado o advisory real (severidade moderate/CVSS 5.3, patch em `core@2.8.0`,
  `fixAvailable: false`) e o raio de exposição: a cadeia vulnerável vem só de
  `@opentelemetry/exporter-otlp-http` (devDependency direta não usada em `src/`) e
  `@opentelemetry/sdk-metrics-base` (transitivo depreciado) — nenhum dos dois é o OpenTelemetry
  realmente inicializado em `src/lib/tracing.ts` (que usa `sdk-node`/`auto-instrumentations-node`/
  `exporter-trace-otlp-http`/`exporter-metrics-otlp-http`/`sdk-metrics`, com cópia própria e não
  vulnerável de `core`). Registrada entrada completa em "## Débito conhecido, fora do escopo deste
  waiver (severidade abaixo do gate)" acima, com advisory, cadeia, justificativa de exposição, dono e
  data de reavaliação — no mesmo nível de detalhe dos waivers de "## Waivers ativos".
  **Decisão deliberada de não seguir a instrução literal de replicar a entrada em
  `.trivyignore.yaml`/`allow-ghsas`:** as três ferramentas que este arquivo espelha
  (`scripts/security/check-audit-waivers.ts` via `npm audit --audit-level=high`,
  `dependency-review.yml` `fail-on-severity: high`, `security-trivy.yml`/`cd-homolog.yml`
  `severity: HIGH,CRITICAL`) só bloqueiam `high`/`critical` — um achado `moderate` não passa pelo gate
  de nenhuma delas, então uma entrada em `.trivyignore.yaml`/`allow-ghsas` seria inerte (não desbloqueia
  nada) e, pior, diluiria o propósito dessas duas listas, hoje reservadas a bypasses de gate real já
  aprovados pelo Agente 00 (ver "## Regra" no topo deste arquivo). Por isso o achado foi documentado
  na seção "Débito conhecido" (mesmo padrão já usado para o caso `uuid`/`exceljs` resolvido em
  30/08/2026 abaixo), não em "## Waivers ativos". Fica registrado aqui para o Coordenador validar essa
  leitura — se a decisão for mesmo assim manter os três arquivos sempre sincronizados
  independentemente de severidade, basta promover esta entrada para "## Waivers ativos" e espelhá-la.
  Nenhuma alteração em `package.json`/`server.ts`/schema (fora do escopo deste agente); recomendação de
  remover a devDependency morta `@opentelemetry/exporter-otlp-http` deixada registrada na entrada acima
  para o dono do `package.json` avaliar.

- 2026-09-11 — Reavaliação de rotina do waiver `GHSA-ggr8-5vv4-36mx`/`CVE-2026-40345`
  (`deepmerge-ts`), encontrado a 5 dias de expirar (`expired_at: 2026-09-16`) durante uma auditoria
  de dívida técnica. Verificado antes de renovar (não apenas adiada a data):
  `npm audit --json` confirma que o achado é exatamente o mesmo de quando o waiver foi registrado
  (mesma cadeia `prisma@7.10.0` → `@prisma/config@7.10.0` → `deepmerge-ts@7.1.5`, `fixAvailable`
  continua apontando só para o downgrade major `@prisma/config@6.12.0`); `npm view prisma versions`
  confirma que `7.10.0` continua sendo a versão estável mais recente da série 7.x (não houve bump
  que atualizasse `deepmerge-ts` internamente); `npm view deepmerge-ts version` mostra `8.0.2`
  disponível upstream, mas o Prisma ainda não a adotou em nenhuma versão `7.x` publicada. Nenhuma
  das duas condições de fechamento deste waiver (Prisma `7.x` com fix, ou planejamento real da
  próxima major) se concretizou — renovado por mais 30 dias (`expired_at: 2026-10-11` em
  `.trivyignore.yaml`, mesma data nas duas entradas). Nenhuma mudança de escopo ou justificativa;
  só a data.

- 2026-09-02 — `trivy-fs-pr-gate` (e o scan de imagem em `production.yaml`) bloqueava com
  `GHSA-rgwj-5xj2-c3m3` (`mysql2`, MEDIUM, decompression-bomb DoS via zlib inflate — mesma cadeia
  dev-only via `prisma` CLI dos dois waivers acima), sem esse advisory estar listado em nenhum
  waiver. Causa raiz não era um achado novo a aceitar: os dois jobs Trivy usam `format: sarif` sem
  `limit-severities-for-sarif: true`, e a `trivy-action` (ver `entrypoint.sh`, bloco "Handle
  SARIF") faz `unset TRIVY_SEVERITY` nesse caso — ou seja, `severity: HIGH,CRITICAL` configurado
  em ambos os jobs era ignorado silenciosamente, e o `exit-code: 1` avaliava achados de qualquer
  severidade (inclusive MEDIUM/LOW/UNKNOWN), contradizendo o nome e os comentários dos dois jobs.
  Confirmado rodando `trivy fs .` v0.70.0 localmente contra o repositório: com `--severity
HIGH,CRITICAL` (comportamento pretendido) o achado não aparece; sem essa flag (comportamento
  real dos jobs antes desta correção), aparece. Corrigido adicionando
  `limit-severities-for-sarif: true` em `security-trivy.yml` (job `trivy-fs-pr-gate`) e em
  `production.yaml` (scan de imagem) — nenhum waiver novo foi necessário, o achado está
  genuinamente abaixo do gate (MEDIUM < HIGH), como a seção "Débito conhecido" abaixo já previa
  para esse caso.

- 2026-09-02 — o waiver `GHSA-3f6p-5ww8-9rcr` (registrado em 2026-09-01 nesta seção) nunca tinha
  sido espelhado para `.trivyignore.yaml` nem para `allow-ghsas` em
  `.github/workflows/dependency-review.yml`, apesar da regra no topo deste arquivo — achado porque
  o job `trivy-fs-pr-gate` (bloqueante) começou a falhar em PRs sem nenhuma dependência nova
  (`npm audit`/Dependency Review já aceitavam o achado, só o Trivy não). Sincronizado nos dois
  arquivos, com `expired_at: 2026-10-01` (30 dias a partir do registro original) para
  `.trivyignore.yaml`, igual ao prazo já descrito acima.

- 2026-08-30 (Onda 43) — `uuid` (via `exceljs`, dependência direta) — `GHSA-w5hq-g745-h8pq`,
  severidade moderate, listada aqui desde 2026-08-25 como débito rastreado (fix só disponível via
  upgrade major, `exceljs@4`). **Resolvido**: `exceljs` atualizado de `3.10.0` para `4.4.0`
  (`npm audit`/`npm audit --omit=dev` confirmam zero achados moderate depois da atualização, só os
  3 `high` já waivados acima). Único ponto de uso no código
  (`src/features/integrations/bitrix/service/extractionFiles.ts`, `new ExcelJS.Workbook()`) não
  precisou de nenhuma mudança — API usada é estável entre as duas majors. Testes afetados (11/11),
  `tsc`/lint/build sem erro novo.

- 2026-08-25 — ITEM-10, correção pós-CI real (PR #269): o job `trivy-fs-pr-gate` novo (descrito
  na entrada abaixo) falhou na primeira execução real em CI — `trivy fs` reportou HIGH em
  `package-lock.json` mesmo com o waiver `GHSA-ggr8-5vv4-36mx` já em `.trivyignore.yaml`.
  Investigado rodando `trivy fs --severity HIGH,CRITICAL --ignorefile .trivyignore.yaml --format
table` localmente (via `docker run --network host` com a CA/proxy do ambiente de agente — o
  mesmo achado, não um achado novo): o Trivy indexa esta vulnerabilidade por `CVE-2026-40345`, não
  pelo GHSA ID que `npm audit` usa. Adicionado `CVE-2026-40345` como segunda entrada em
  `.trivyignore.yaml`, mesmo `expired_at`, e a entrada do waiver acima atualizada para citar os
  dois IDs — não é um waiver novo, é o mesmo risco aceito, só reconhecido sob o ID que a
  ferramenta usa.
- 2026-08-25 — ITEM-10 (Onda 2, CodeQL/Trivy/Dependency Review bloqueantes): três gates novos
  passaram a checar vulnerabilidade de dependência em PR, além do `npm audit` já bloqueante em
  `ci.yml`/`production.yaml`/`cd-homolog.yml`: CodeQL (`.github/workflows/codeql.yml`,
  javascript-typescript + python, com gate real de `level: error` em
  `scripts/security/check-codeql-sarif.ts` — `codeql-action/analyze` sozinho não falha o
  workflow), Dependency Review (`.github/workflows/dependency-review.yml`, `fail-on-severity:
high` no diff de manifests do PR) e Trivy passando a rodar também em PR de forma bloqueante
  (`.github/workflows/security-trivy.yml`, job `trivy-fs-pr-gate` — o scan semanal existente
  continua não-bloqueante, agora só nos eventos `schedule`/`workflow_dispatch`). O scan de imagem
  Docker (`production.yaml`, job `publish`) também passou a rodar Trivy antes do `docker push`,
  bloqueando o release se a imagem tiver achado `HIGH`/`CRITICAL` com fix disponível sem waiver. O
  waiver `GHSA-ggr8-5vv4-36mx` acima passou a ser espelhado em `.trivyignore.yaml` (Trivy) e em
  `allow-ghsas` (Dependency Review) — ver nota no topo deste arquivo.

- 2026-08-16 — Fase Final 1: removido `continue-on-error: true` do step de audit em `ci.yml` e
  `production.yaml`. O comentário anterior ("known issue with better-auth pending upstream
  resolution") já não correspondia a nenhum achado real no momento da remoção — o audit já passava
  limpo sozinho, e o `continue-on-error` estava mascarando isso em vez de proteger contra algo.
- 2026-08-17 — Fase Final 1, reaplicação: um commit posterior (`cf7bffd1`, merge de correção de
  mock do Baileys não relacionado) havia revertido acidentalmente o gate único de release inteiro
  (removeu `secret-scan` de `production.yaml`, o `needs:` nos 4 workflows secundários, e
  reintroduziu `continue-on-error` sem waiver). Reaplicado o gate original. Nesta reaplicação,
  `npm audit --audit-level=high` já não retorna mais zero — encontrou o waiver `GHSA-ggr8-5vv4-36mx`
  acima (não existia em 2026-08-16, surgiu de uma atualização do Prisma entre essa data e agora).
  `continue-on-error: true` foi reintroduzido em `ci.yml`, `production.yaml` e `cd-homolog.yml`
  citando esta entrada — não é o mesmo débito vestigial de antes.
- 2026-08-18 — Sprint 01/Onda 13 (SEC-005): o `continue-on-error: true` foi removido dos 3
  workflows e substituído por `npm run security:audit-waivers`
  (`scripts/security/check-audit-waivers.ts`), que roda `npm audit --audit-level=high --json`,
  atravessa a cadeia de dependência de cada achado até o advisory real, e falha o gate para
  qualquer `HIGH`/`CRITICAL` cujo advisory ID não esteja listado na seção "## Waivers ativos"
  deste arquivo. O escopo do waiver `GHSA-ggr8-5vv4-36mx` (só esse advisory, só essa cadeia) agora
  é verificado automaticamente, não só por convenção de comentário. Também corrigido nesta sprint:
  `package.json` tinha `overrides.uuid: "^10.0.0"` conflitando com a dependência direta
  `uuid@^14.0.1` (adicionado sem reconciliar em `41d5d98`, remediação GitGuard) — isso fazia
  `npm audit`/`npm install` falharem com `EOVERRIDE` **antes** de produzir qualquer relatório,
  e o `continue-on-error: true` antigo mascarava esse erro estrutural junto com o achado real de
  vulnerabilidade. Override alinhado para `^14.0.1`, igual à dependência direta.
- 2026-10-21 — Auditoria de Dependências / Resolução de Bloqueador de Gate de CI: Resolvido o advisory crítico `GHSA-f2ph-cmg5-wxc8` em `storybook` e `@storybook/addon-vitest` através da atualização pontual das dependências para a versão corrigida `10.6.3` no `package-lock.json`, eliminando os dois achados críticos e garantindo exit code 0 no gate `npm run security:audit-waivers`.



