De: 00 — Astra
Para: 99 — Vito (AppSec), sob coordenação de 90 — Hélio
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: bloqueador (vencimento 30/11/2026)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §3-4
Sprint destino: ciclo imediato

## Problema

36 waivers em `.trivyignore.yaml` vencem em 30/11/2026. A auditoria do Agente 99 classificou os registros em 3 grupos, mas a validação corretiva e a poda ainda não foram executadas. Renovações automáticas estão expressamente proibidas.

## Arquivo(s) envolvido(s)

- `.trivyignore.yaml`, `docs/security/AUDIT_WAIVERS.md`, `package.json`, `package-lock.json`
- Evidência-base: `docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §3

## Evidência

Classificação já produzida pelo Agente 99:

- **Grupo A (produção real — ação crítica):** `better-auth` (GHSA-44JH-23M7-HPCF, GHSA-R4XP-PRCW-77QF, GHSA-965C-763C-88JM), `dompurify` (GHSA-CG2G-XH64-V4Q7, GHSA-MRV2-3PQR-J5JR, GHSA-C6GR-QVV4-5V3F), `nodemailer` (GHSA-G57G-F23G-4646, GHSA-V53P-9FQP-M79J, GHSA-PRGH-XP8R-P3M5). Mitigações parciais já existentes: validação de sessão em camadas, `sanitizeHtml` com allowlist, `emailSanitizer` anti-CRLF.
- **Grupo B (build/teste — risco de runtime nulo):** Prisma CLI, Vitest, Picomatch etc. Manter classificação estrita; sem impacto em produção.
- **Grupo C (provavelmente obsoletos):** `source-map-js` (CVE-2026-93749), `undici` (5 IDs — já coberto por overrides no `package.json`: `^6.29.1`, `^7.30.1`, `^8.12.3`), `re2js` (lockfile secundário). Candidatos à poda após scan limpo.

## Alteração necessária

1. Executar `trivy` (ou scanner equivalente autorizado) sobre `package-lock.json` de produção no ambiente de CI/homologação.
2. **Grupo A:** preparar PRs de bump não-disruptivo de `nodemailer` e `dompurify` (e avaliar `better-auth` upstream); validar que mitigações existentes permanecem até o bump.
3. **Grupo C:** remover do `.trivyignore.yaml` somente registros comprovadamente sem ocorrência no scan — meta: reduzir ~36 para ~18.
4. **Grupo B:** documentar justificativa formal de "ferramenta de build" por waiver remanescente.
5. Atualizar `AUDIT_WAIVERS.md` com a decisão por waiver e nova data de revisão.

## Teste esperado

- Scan Trivy pós-poda: zero findings não-waived em dependências de produção.
- `npm run test:unit` + `npm run build` verdes após bumps.
- Nenhum waiver removido sem evidência de scan limpo (prova por item).

## Contexto adicional

- `package.json` e lockfile exigem aprovação explícita do Agente 00 — propor diff antes de aplicar.
- Ambiente autorizado: CI ou worktree dedicado; NÃO usar API Docker TCP 2375.
- Após cada entrega, SHA congelado → parecer Agente 09 → integração em lote pelo 00.
