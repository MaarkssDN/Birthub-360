# Parecer do Agente 24 — Reauditoria MEL-27 (PWA / brace-expansion)

**Missão:** DEM-20261114-003 — MEL-27
**Autor:** Agente 09 · **Auditor:** Agente 24
**Branch:** `agente/09-onda4-pwa` · **Commits:** `ad5111463`, `cb0459e2f`, `505259624`, `b37e041f1`

## Veredito: APROVADO (com ressalvas) — mergeado em `integracao/onda-4`

O objetivo real de MEL-27 — eliminar a bomba do precache/PWA (`brace-expansion@2.x`
sob `minimatch@11`) — está resolvido no caminho auditado.

### Confirmado no lockfile

- `node_modules/glob@14.0.4` única instância; `minimatch@11.0.5` + `brace-expansion@5.0.13`
  aninhados sob `glob/node_modules/` — cobre workbox-build e todos os `glob@14`
  (cacache, rimraf, archiver-utils, joshwooding).
- glob@7.2.3 legados intactos com minimatch@3/be2.

### Ressalvas do parecer (e desfecho)

1. **`pnpm-lock.yaml` dessincronizado** — não bloqueia (npm é o PM do CI); regenerar
   quando pnpm disponível ou formalizar aposentadoria do lockfile. *Pendente.*
2. **"Impossível via npm" era amplo demais** — o 24 sugeriu a forma aninhada com `"."`.
   **IMPLEMENTADA e VERIFICADA pelo orquestrador** (commit `b37e041f1`):
   `"@ts-morph/common"` e `"@typescript-eslint/typescript-estree"` agora usam
   `"minimatch": {".": "^11.0.5", "brace-expansion": "^5.0.12"}` → as 3 instâncias
   minimatch@11 recebem be5.0.13; `npm ci` limpo + teste runtime `Minimatch('src/{a,b}/**')`
   MATCH-OK nos 3 caminhos; raiz mantém be2.1.7 chamável p/ minimatch@3/5.
   **Residual eliminado — estado final é MELHOR que o aprovado.**
3. **Build pós-fix**: gate final fica com o CI (`npm ci`, lint, typecheck, build +
   verify:pwa-precache).

### Encaminhamentos

- Revalidar `npm ls brace-expansion` + teste Minimatch em qualquer bump futuro de
  glob/minimatch/brace-expansion/typescript-eslint/ts-morph.
- Regenerar `pnpm-lock.yaml` (handoff aberto).
