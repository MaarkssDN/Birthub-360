# Handoff — Triagem POS4 dos bloqueadores de segurança (11 hotspots + waivers Trivy)

```
De: Agente 99 — Vito (AppSec/SAST/Secret Scanning)
Para: Agente 00 — Coordenador
Onda: POS4 (pós-Onda 4, DEM-20261124)
Status: resolvido (triagem concluída; ações dependentes listadas abaixo)
Prioridade: alto
Bloqueador-ref: vencimentos 2026-11-29/30 dos 11 hotspots e dos waivers Trivy
Sprint destino: decisão humana sobre hotspots; saneamento de espelhos pelo Agente 08
```

## Problema

Verificar o estado real dos "11 exceções arquiteturais" (`docs/architecture/HOTSPOT_EXCEPTIONS.md`,
reavaliar até 2026-11-30) e dos waivers Trivy (`.trivyignore.yaml`, `expired_at` 2026-11-30 e
2026-12-17), sem renovação automática, classificando cada item.

## Ambiente e método

- Worktree `wt-99-sec`, branch `agente/99-sec-triage-pos4`, base `9f80c07ed`.
- `trivy` CLI **não instalado** no ambiente (verificado: `which trivy` falha; docker não
  utilizado para não depender de pull de imagem). Limitação registrada — a verificação de
  waivers usou fontes autoritativas equivalentes:
  1. `npm audit --audit-level=high --json` → **0 achados HIGH/CRITICAL** (só 2 moderate de
     OpenTelemetry, já documentados como débito conhecido abaixo do gate);
  2. GitHub Advisory Database (`api.github.com/advisories`, `?cve_id=`) → faixas
     `vulnerable_version_range` oficiais de cada GHSA/CVE;
  3. OSV.dev (`api.osv.dev/v1/querybatch`) → varredura pacote@versão sem vulnerabilidades
     abertas para todas as versões instaladas;
  4. análise estática dos lockfiles efetivamente varridos pelo Trivy.
- Lockfiles varridos pelo `trivy-fs-pr-gate` (`.github/workflows/security-trivy.yml`,
  `skip-files: 'pnpm-lock.yaml,agente-codigo-local/bun.lock'`): `package-lock.json` (raiz),
  `landing/package-lock.json`, `agente-codigo-local/package-lock.json` (o `bun.lock` referenciado
  em skip-files **não existe** — o package-lock do subdiretório é varrido).

## Resultado 1 — 11 exceções arquiteturais: TODAS AINDA VÁLIDICAS

`npm run check:hotspots` executado em 2026-11-24: **gate verde** (0 arquivos >1000 linhas sem
exceção válida). `git log --since=2026-11-20` em cada arquivo-alvo: **nenhum commit** — nenhuma
modularização ocorreu desde a auditoria de 2026-11-23 (`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md`).

| # | Arquivo | Linhas (gate) | Limite excepc. | Vence | Classificação |
|---|---------|---------------|----------------|-------|----------------|
| 1 | `src/features/landing/pages/Landing360.tsx` | 3191 | 3500 | 2026-11-30 | AINDA-VÁLIDO — dono Marks-Mah / Squad 30 |
| 2 | `src/features/landing/pages/Landing360Impeccable.tsx` | 1021 | 1050 | 2026-11-30 | AINDA-VÁLIDO — margem de só 29 linhas; dono Agente 15 |
| 3 | `src/features/integrations/bitrix/service/extraction.ts` | 1042 | 1100 | 2026-11-30 | AINDA-VÁLIDO — dono Agente 06A |
| 4 | `src/features/commercial-intelligence/domain/CommercialIntelligence.ts` | 1231 | 1250 | 2026-11-30 | AINDA-VÁLIDO — margem de 19 linhas; dono maarkss1 |
| 5 | `src/features/prospecting/outbound/server/routes/leads.routes.ts` | 1440 | 1500 | 2026-11-30 | AINDA-VÁLIDO — cresceu de 1368 (auditoria) para 1440; dono Agente 05 |
| 6 | `src/features/voice-hub/components/design-system/index.tsx` | 1099 | 1200 | 2026-11-30 | AINDA-VÁLIDO — dono Agente 12 |
| 7 | `src/features/intelligence/routes/intelligence.routes.ts` | 1054 | 1100 | 2026-11-30 | AINDA-VÁLIDO — dono Agente 07 |
| 8 | `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` | 1016 | 1020 | 2026-11-30 | AINDA-VÁLIDO — **margem de apenas 4 linhas**, qualquer PR que adicione linhas quebra o gate; dono Agente 13 |
| 9 | `src/lib/voice-hub/services/workflowRuntimeService.ts` | 1437 | 1500 | 2026-11-30 | AINDA-VÁLIDO — dono Agente 06 |
| 10 | `src/features/crm/components/LeadDetailDrawer.tsx` | 1052 | 1100 | 2026-11-30 | AINDA-VÁLIDO — cresceu de 1008 para 1052; dono Agente 02 |
| 11 | `src/features/landing/components/pillars/PillarRegistry.tsx` | 1403 | 1450 | 2026-11-30 | AINDA-VÁLIDO — dono Agente 02/03 |

**NÃO renovei nenhuma exceção** — renovação é decisão dos donos/Coordenador (regra de proibição de
renovação automática da auditoria de Onda 2 permanece). Recomendação ao 00: despachar os donos dos
itens 8, 4 e 2 (menores margens) com prioridade, e submeter ao Orquestrador Humano a decisão de
prorrogação justificada (a auditoria de Onda 2 sugeria extensão única até 2026-12-14 condicionada
a branches de refatoração).

## Resultado 2 — Waivers Trivy: 40/40 RESOLVIDOS → removidos

O `.trivyignore.yaml` tinha **40 entradas** (não 36 — a contagem da auditoria de Onda 2 estava
desatualizada; 33 GHSA incluindo duplicatas de caixa alta/baixa + 7 CVE). Todas verificadas uma a
uma contra a versão instalada e a faixa vulnerável oficial:

| Advisory (IDs) | Pacote | Versão fix | Instalado (lockfile) | Estado |
|---|---|---|---|---|
| GHSA-ggr8-5vv4-36mx, CVE-2026-40345 | deepmerge-ts | >=8.0.0 | 8.0.2 | RESOLVIDO |
| GHSA-44JH-23M7-HPCF, GHSA-R4XP-PRCW-77QF, GHSA-965C-763C-88JM (+minúsculas) | better-auth (+adapters 1.7.14) | <1.7.7 | 1.7.14 | RESOLVIDO |
| GHSA-CG2G-XH64-V4Q7, GHSA-MRV2-3PQR-J5JR, GHSA-C6GR-QVV4-5V3F (+minúsculas) | dompurify | <=3.4.16 | 3.4.17 | RESOLVIDO |
| GHSA-Q2HR-2G5M-VWHR, GHSA-QHR7-859C-M2P7, GHSA-6J4F-FJ2G-MC7P (+minúsculas) | brace-expansion | vários | 5.0.13, 2.1.7 | RESOLVIDO |
| GHSA-G57G-F23G-4646, GHSA-V53P-9FQP-M79J, GHSA-PRGH-XP8R-P3M5 (+minúsculas) | nodemailer | <=10.0.9 | 10.2.1 | RESOLVIDO |
| GHSA-7X8W-G892-F33R (+minúscula) | (rotulada "nodemailer"; ID inexistente na GitHub Advisory DB — 404) | — | — | RESOLVIDO-OBSOLETO |
| CVE-2026-93749 | source-map-js | <1.2.2 | 1.2.2 (3 lockfiles) | RESOLVIDO |
| CVE-2026-84961, CVE-2026-19534, GHSA-xjj6-f33q-929c, GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472 | undici | vários | 6.29.1 / 7.30.1 / 7.30.2 / 8.12.3 | RESOLVIDO |
| GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp | @vitest/mocker | <4.1.12 / <5.0.3 | 4.1.12 | RESOLVIDO |
| CVE-2026-116795 | re2js | <2.8.7 | 2.9.1 (agente-codigo-local) | RESOLVIDO |
| GHSA-FC5Q-39XC-VJPF, CVE-2026-112366 (+minúsculas) | picomatch | advisory **Withdrawn** upstream | 4.0.7 (OSV limpo) | RESOLVIDO-OBSOLETO |

Notas:
- As entradas `GHSA-G57G`/`GHSA-V53P` estavam com `statement` dizendo "brace-expansion" mas são
  advisories de **nodemailer** — erro de rotulagem já sem efeito (ambos resolvidos por versão).
- `GHSA-7589-6fvf-x4pw` (effect, ReDoS) já estava resolvido via override `effect@^3.22.5`
  (commits `fa4df687b`, `4ecbfe0fb`) e **não** constava do `.trivyignore.yaml` — o "Espelhos
  pendentes" registrado em `AUDIT_WAIVERS.md` torna-se desnecessário.
- `pnpm-lock.yaml` (skip-files) e `landing/package-lock.json` não contêm versões vulneráveis dos
  pacotes waivados.

## Alterações feitas (commits locais nesta branch)

1. `.trivyignore.yaml` — removidas as 40 entradas; arquivo mantido com `vulnerabilities: []` e
   nota de encerramento (o path é referenciado por `security-trivy.yml` e `production.yaml`).
2. `docs/security/AUDIT_WAIVERS.md` — seção "## Waivers ativos" esvaziada (gate
   `check-audit-waivers.ts` só lê essa seção); entradas antigas preservadas sob novo heading
   "## Waivers encerrados em 2026-11-24 — triagem POS4 (registro histórico, NÃO autoriza nada)";
   entrada completa de Histórico com a evidência por grupo.

## Ações dependentes (fora da minha propriedade)

- **Agente 08 / QA (`tests/`):** `tests/unit/security/trivy-pr-gate.test.ts` falha agora — o teste
  "respects HIGH/CRITICAL severities and keeps the ignore list aligned with the waiver docs"
  (linha 41) exige `GHSA-ggr8-5vv4-36mx`/`CVE-2026-40345` em `.trivyignore.yaml`, que ficou vazio.
  O assert ficou obsoleto junto com os waivers; o teste precisa ser atualizado para o novo estado
  (lista vazia + IDs presentes apenas como histórico em `AUDIT_WAIVERS.md`). Reproduzido:
  `npx vitest run tests/unit/security/trivy-pr-gate.test.ts` → 1 failed/1 passed. Não editei —
  `tests/` é propriedade do Agente 08.
- **Agente 08 / CI (.github/**):** os espelhos `allow-ghsas` em
  `.github/workflows/dependency-review.yml` e `ci.yml` ainda contêm os GHSA waivados — agora
  todos resolvidos; recomendo saneá-los na mesma leva (handoff sugerido abaixo do 00).
- **Agente 00 / donos dos hotspots:** decisão de renovação vs. despacho de refatoração para os
  11 itens da tabela acima (vencimento 2026-11-30).

## Verificação executada

- `npm run check:hotspots` → ✅ verde (1975 arquivos, 11 cobertos por exceção válida).
- `npm audit --audit-level=high --json` → 0 HIGH/CRITICAL.
- `scripts/security/check-audit-waivers.ts` não executado de ponta a ponta (roda `npm audit`
  internamente; equivalência já demonstrada pelo audit direto + seção "Waivers ativos" vazia não
  quebra o gate — ele só falha com achado HIGH/CRITICAL não coberto, e não há achados).
- Trivy real **não executado** (binário indisponível) — recomendado rodar `npm run security:trivy`
  ou o job `trivy-fs-pr-gate` no primeiro PR após o merge para confirmação final fail-safe.

**Agente 99 — Vito** · 2026-11-24 · commits locais em `agente/99-sec-triage-pos4`
