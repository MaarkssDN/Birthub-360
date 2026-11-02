# Parecer Agente 24 — PR #158 @ 805e96a6

- **Missão:** realinhar `pnpm-lock.yaml` com os overrides (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH)
- **Autor:** MarksNN (commit por MaarkssN) — branch `agente/wf2-pnpm-lockfile-overrides`
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** origin/main 2d62f9fa566eecf31a0c1a70f679cca794a2760a
- **SHA auditado:** 805e96a6c002362ab969cfc221179917c17c4486 (reverificado imediatamente antes da escrita)
- **Escopo:** `package.json` (remove bloco `pnpm.overrides`), `pnpm-workspace.yaml` (+`acorn: 8.11.3`), `pnpm-lock.yaml` (regenerado). `package-lock.json` intacto.

## Decisão: **BLOQUEADO**

Sem P1 de código. Bloqueios de processo/gate:
1. AGENTS.md:446 — "`package.json` e lockfile exigem aprovação explícita do 00". Não há aprovação do Agente 00 registrada.
2. Gate de aplicação do Release falha (herdado da main) e para no Biome; testes unitários não rodam no CI. Teste obrigatório não executado não é aprovação.

## Critérios e evidências

| Item | Resultado |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` (pnpm 10.34.6, worktree limpo) | OK (falha na main — confirmado o bug) |
| `npx vite build` com layout isolado do pnpm | **FALHA**: `Rollup failed to resolve import "workbox-window" from virtual:pwa-register` |
| idem com `--shamefully-hoist` | OK; `check:bundle-budget` ok, 1.965.250 / 3.145.728 B gzip, 0 violações (reproduz o PR) |
| gitleaks 8.21.2 `origin/main..HEAD` | no leaks found |
| Release 41408829174 | failure — 4 errors / 645 warnings, mesmo conjunto de diagnósticos da main (run 41406269451, 4/645). Nenhuma falha nova. |
| Bundle Budget 41408828928, CodeQL 41408829095, Visual Regression 41408829136, Trivy 41408829039, Dependency Review 41408829051 | success |
| SonarQube 41408829090 | em andamento na escrita (falha herdada na main 41406269361) |

### Waiver do acorn (GHSA-ch52)
- O pin `acorn: 8.11.3` veio do squash 0c4fe2fd ("agente/08-waiver-ghsa-ch52", 2026-10-04). Nenhum id `GHSA-ch52*` existe em `.trivyignore.yaml`, `dependency-review.yml` (allow-ghsas) nem em `docs/security/AUDIT_WAIVERS.md`; não há registro de quem aprovou.
- OSV (api.osv.dev) e GitHub Advisory: **nenhuma vulnerabilidade** para acorn 8.11.3 nem 8.18.0 (as advisories conhecidas afetam só <5.7.4/6.4.1/7.1.1). O downgrade 8.18.0→8.11.3 no pnpm **não reintroduz vuln conhecida** → não é P1.
- O pin já existia (era efetivo via `package.json` pnpm.overrides); o PR só muda o local.

### Amostra de versões (importer `.`)
- 185 deps diretas; 20 mudaram em relação ao lock pnpm anterior, **nenhum salto major** (maiores: better-auth 1.7.5→1.7.15, nodemailer 10.0.12→10.3.1, storybook 10.6.0→10.6.5, vite 6.4.3→6.4.5, vitest 4.1.11→4.1.12, undici 6.28.1→6.29.1, multer 2.4.0→2.5.0).
- 45 deps diretas resolvem versões diferentes entre `pnpm-lock.yaml` e `package-lock.json` (ex.: lucide-react 1.47.0 vs 1.38.0, @bull-board/* 9.10.1 vs 9.6.0, @hookform/resolvers 5.9.1 vs 5.4.0, tiptap 3.31.3 vs 3.30.6; algumas mais antigas no pnpm, ex. typescript-eslint 8.70.1 vs 8.72.1). acorn: pnpm 8.11.3 / npm 8.18.0.
- O crescimento do bundle (1.917.852 → 1.965.250 B) vem dessas versões diferentes resolvidas pelo pnpm; o CI usa `npm ci` e o Bundle Budget do head passou com o lock npm. Não afeta produção hoje.
- Nenhum workflow, Dockerfile ou script usa `pnpm install`; não há `packageManager` no package.json.

## Achados
- **P2-1:** `workbox-window` é importado por `virtual:pwa-register` (src/main.tsx:13) mas não é dependência direta; com pnpm isolado o build falha. Declarar `workbox-window` (7.4.1, como no package-lock) em devDependencies — exige aprovação do 00.
- **P2-2:** pin `acorn: 8.11.3` sem waiver documentado em AUDIT_WAIVERS.md; registrar justificativa ou remover o pin (Agente 08 / 00).
- **P3-1:** dois lockfiles divergentes (45 diretas) — decidir gerenciador único ou sincronizar.
- **P3-2:** a descrição do PR cita `--shamefully-hoist` só como observação; deixar explícito que o caminho pnpm ainda não builda sem hoist.

## Pendências
- Aprovação explícita do Agente 00 (package.json/lockfile).
- Gate verde de testes unitários no CI (depende de corrigir os 4 erros Biome herdados da main).
- Conclusão do SonarQube 41408829090.

Atualização futura do PR: via merge da main na branch (sem rebase).
