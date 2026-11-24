# EVIDÊNCIA — Verificação de staleness dos waivers Trivy (Squad 90, 2026-11-24)

**Agente:** 90 — Hélio (coordenação; verificação executada pelo coordenador por ausência de executor despachado)
**Worktree:** `wt-coord` · **Branch:** `coord/squad-90` · **Base:** `93e82c220`
**Método:** inspeção de `package-lock.json` (versões resolvidas) + `npm audit --package-lock-only --audit-level=high` + leitura de `.trivyignore.yaml`/`AUDIT_WAIVERS.md`. `trivy fs` **não executável neste ambiente** (binário bloqueado por App Control; Docker TCP 2375 proibido/indisponível) — ver §4.

## 1. `npm audit --audit-level=high` (2026-11-24, registry npm)

**Resultado: 0 high, 0 critical.** Apenas 2 moderate:
- `@opentelemetry/instrumentation-http` (via `@opentelemetry/auto-instrumentations-node`, devDep) — já documentado como débito moderado em `AUDIT_WAIVERS.md`.

Implicação: **nenhum achado HIGH/CRITICAL no catálogo npm** — todos os waivers Grupo A/B podem estar obsoletos no lockfile atual, mas o Trivy usa base própria (OSV/CVE) e pode divergir do npm audit. Remoção de waiver exige confirmação por `trivy fs` (fail-closed: se o Trivy ainda reportar, o gate quebra — então a poda deve ser incremental e verificada em CI).

## 2. Versões resolvidas no `package-lock.json` vs. condição de fix dos waivers

| Pacote | Versão lockfile | Condição do waiver | Provável status |
|---|---|---|---|
| `deepmerge-ts` | **8.0.2** | fix `>=8.0.0` | **RESOLVIDO** — waiver `GHSA-ggr8-5vv4-36mx`/`CVE-2026-40345` provavelmente obsoleto |
| `effect` | **3.22.5** | vuln `<=3.22.0` | **RESOLVIDO** — `GHSA-7589-6fvf-x4pw` provavelmente obsoleto (e o espelho pendente pode nem ser necessário) |
| `source-map-js` | 1.2.2 | fix `>=1.2.2` (Grupo C) | **RESOLVIDO** — poda segura |
| `undici` (4 cópias) | 6.29.1 / 7.30.2 / 7.30.1 / 8.12.3 | fixes por major (Grupo C) | **RESOLVIDO** — poda segura |
| `re2js` | **ausente** do lockfile raiz | só lockfile secundário (Grupo C) | **RESOLVIDO** — poda segura |
| `dompurify` | 3.4.17 | recomendação `>=3.2.0` | prováveis fixes `>=3.x` — verificar IDs exatos |
| `nodemailer` | 10.2.1 | "última minor estável" | provável fix — verificar IDs |
| `better-auth` (+`@better-auth/*`) | 1.7.14 | aguardando release corretiva | provável fix — verificar IDs |
| `picomatch` | 4.0.7 | `<=4.0.7` sem patch upstream | **AINDA VULNERÁVEL por versão** — única entrada com motivo técnico real de permanência (renovar até patch upstream; `expired_at` já é 17/12) |
| `brace-expansion` | 2.1.7 + 5.0.13 (×3 cópias) | a confirmar ranges dos GHSAs | verificar com trivy |
| `@vitest/mocker` | 4.1.12 | dev-only | provável fix — verificar |

## 3. Conclusão operacional

1. A dívida real de waivers é **muito menor** que as 40 entradas sugerem: evidência forte de que a maioria (Grupo A inteiro + Grupo B quase todo + Grupo C) já está resolvida por bumps de dependência posteriores ao registro dos waivers — os waivers **não foram podados** porque ninguém re-verificou com `trivy fs`.
2. **Risco invertido:** manter waivers obsoletos não quebra gate hoje, mas (a) mascara achados futuros do mesmo pacote se a versão regredir, e (b) `expired_at` vencido em 30/11 fará o Trivy **re-reportar** advisories já corrigidos → gate falha por falso positivo até alguém podar.
3. **Ação prioritária (E1 — Agente 99):** executar `trivy fs --severity HIGH,CRITICAL --ignorefile .trivyignore.yaml .` e `trivy fs .` (sem ignore) em ambiente com a ferramenta; podar do `.trivyignore.yaml` todo ID que não reaparecer; atualizar `AUDIT_WAIVERS.md` + `allow-ghsas` na mesma alteração; renovar apenas os que persistirem (provável: `picomatch` e talvez `brace-expansion`/`@vitest/mocker` — confirmar).
4. **Alternativa sem trivy local:** abrir PR de poda parcial só do Grupo C (evidência §2 já suficiente para `source-map-js`/`undici`/`re2js`) e deixar Grupo A/B para confirmação em CI — mas o procedimento correto continua sendo `trivy fs` antes/depois.

## 4. Limitação de ambiente (registrada, não mascarada)

- `trivy.exe` v0.76.2 baixado → execução bloqueada por política de Controle de Aplicativo do host.
- Docker daemon acessível apenas via TCP 2375 (proibido por regra do squad e inalcançável: timeout).
- `semgrep`/`gitleaks` não instalados.
- Comando canônico para o executor: `trivy fs --severity HIGH,CRITICAL --scanners vuln --format json -o trivy-after.json .` (com e sem `--ignorefile .trivyignore.yaml`), comparar IDs reportados vs. IDs waiver, podar os ausentes.

---
*Hélio (90) — evidência primária para o plano `.agents/runs/squads/squad-90-plano.md`*
