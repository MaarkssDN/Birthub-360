- De: 00
- Para: 00 (coordenação) / 09 (Mobile) / 11 (Marca)
- Status: ABERTO — depende de decisões de escopo
- Prioridade: P0-condicional / P1 / P2

## Achados

### DEBT-0004 — Mobile sem backend alcançável — P0 SE mobile é escopo Day-1
`capacitor.config.ts:28-49`: DEFAULT_APP_URL `app.birthhub360.com.br` "ainda não resolve DNS"; AndroidManifest App Link → onrender.com arquivado; sem assetlinks.json; APK só debug manual.
**Decisão humana:** mobile entra no lançamento? Se sim → backend real+TLS+assetlinks. Se não → remover do escopo/marketing formalmente.
Offline sync real e deep link OK (pontos positivos).

### INF-05/06 — Identidade visual divergente — P1/P2
`identidade-visual/` documenta paleta Neon ANTERIOR (#00D4FF/#FF2D9B) vs paleta vigente (Gold/Iris/Orbit); splash Capacitor usa Obsidian #0B132B. Sincronizar tokens com `globals.css`/`brand.ts`.

### DEBT-0025/ARQ — Clusters mortos — decisão remover×reincluir — P1 higiene
`ai-voice/`+`voice/` (~15 arq sob typecheck), `proposals/` (assinatura simulada), `temporal-workers/`+`crawlee/` (não compilam — SDKs ausentes, excluídos do tsconfig), `public/design-lab/` (~100 arq públicos em prod), `agente-codigo-local/` (segundo app no repo), `prospecting/outbound/` SPA, voice-hub frontend.
**Ação 00:** inventário de decisão por cluster → handoffs aos donos; remoção exige teste de não-uso.

### ARQ-07/08/09/10 — P2
4 componentes `// @ts-nocheck` em produção; framer-motion+motion duplicados; ≥15 deps mortas (rodar `npx knip`); 4-5 stacks LLM paralelos.

### ARQ-13 — Exceções hotspot + waivers Trivy vencem 2026-11-30 — P3 urgente
13 exceções + ~30 waivers em bloco; `check:hotspots` pode falhar em massa. Renovar ou modularizar antes do SHA candidato.
