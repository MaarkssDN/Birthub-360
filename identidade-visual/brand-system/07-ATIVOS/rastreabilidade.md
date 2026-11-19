# Rastreabilidade — Cadeia de Custódia dos Tokens — Birth Hub 360°

**Propósito:** documentar como os tokens de identidade nascem (`identidade-visual/birthhub360/tokens/`), como chegam ao runtime (`official-identity.css` → `globals.css` → componentes) e como auditar drift entre as camadas.

**Escopo:** cadeia de custódia dos tokens de marca, versionamento e mecanismos de auditoria. Não cobre tokens de features isoladas (ex.: `src/features/voice-hub/components/tokens.ts` — divergente, ver `docs/design/TOKEN-AUDIT.md`).

**Estado:** verificado em 2026-11-19.

**Data:** 2026-11-19 · **Fontes:** `identidade-visual/birthhub360/tokens/*`, `src/styles/official-identity.css`, `src/styles/globals.css`, `src/config/brand.ts`, `package.json`, `scripts/design-system-audit.js`, `scripts/extract-design-tokens{,-v2}.ts`, `docs/design/TOKEN-AUDIT.md`, `public/design-lab/identidade-v2/MANIFEST.sha256`, git tags.

**Documentos relacionados:** `../04-DESIGN-SYSTEM/` (especificações), `../08-GUIAS-DE-IMPLEMENTACAO/frontend.md`, `../08-GUIAS-DE-IMPLEMENTACAO/contribuicao.md`, `../09-PLANO-DE-EVOLUCAO/`.

---

## 1. Cadeia de custódia (fonte → runtime)

```
identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}   ← FONTE MESTRE (machine-readable)
identidade-visual/birthhub360/tokens/characters.{css,json,ts}    ← tokens dos personagens
        │
        ▼  @import (official-identity.css:1-2)
src/styles/official-identity.css                                ← importa tokens + adapters de compatibilidade
        │   • aliases legados --bg→--color-background etc. (:6-61, marcados @deprecated em birthhub360.css:101-116)
        │   • overrides light AA (:62-107, :264-315)
        │   • utilitários de superfície/efeito (:126-486: .bh-*, .border-glow-*, .btn-neon-cta…)
        ▼
src/styles/globals.css                                           ← @theme Tailwind 4 + :root/.dark + @font-face + keyframes
        │
        ▼
Componentes React: src/components/ui/**, src/components/layout/**, src/components/brand/**,
        src/features/**, landing (Landing360), PWA manifest (vite.config.ts)
        │
        ▼ (contextos sem CSS: meta theme-color, PDF/e-mail, canvas)
src/config/brand.ts  (BRAND.colors — espelho TS com os mesmos hex dark)
```

Pontos de acoplamento verificados:

- `official-identity.css:1-2` — único ponto de import dos tokens canônicos; o comentário em `:4-5` proíbe redefinir a paleta ali ("never redefine the canonical palette here").
- `official-identity.css:6-61` — camada de compatibilidade: mapeia tokens legados (`--bg`, `--ink`, `--brand`, `--gold`…) para os canônicos `--color-*`. **Regra: código novo usa `--color-*`; `--bg/--ink/...` são `@deprecated`** (`birthhub360.css:101-116`).
- `official-identity.css:264-315` — mitigação de dívida: reescreve `text-[#00D4FF|#FF2D9B|#F59E0B|#8B7DFF|#EF4444]` arbitrários no tema claro (só texto, só esses 5 hex).
- `src/config/brand.ts:38-75` — `BRAND.colors` duplica os hex dark da paleta Neon para contextos sem CSS; divergências aqui **não** afetam componentes (que usam tokens).
- `vite.config.ts:19-23` — manifest PWA com `theme_color: '#F4F7FB'` hardcoded (consistente com o light canônico `#F4F7FB`; a variante `#F8FAFC` é legado/DESIGN.md — pendência §19.7).

## 2. Fontes machine-readable

| Arquivo | Conteúdo | Versão |
|---|---|---|
| `identidade-visual/birthhub360/tokens/birthhub360.css` | Tokens CSS dark (`:9-117`), light AA (`:119-186`), aliases `@deprecated` (`:101-116`) | — |
| `identidade-visual/birthhub360/tokens/birthhub360.json` | Tokens em JSON + `notes.precedence/conflicts/headingVariants` | `"version": "2026.1"` (`:10`) |
| `identidade-visual/birthhub360/tokens/birthhub360.ts` | Espelho TypeScript | — |
| `identidade-visual/birthhub360/tokens/characters.{css,json,ts}` | Tokens dos 29 personagens | `"version": "1.0.0"` (`characters.json:4`) |

`birthhub360.json → notes.conflicts` registra divergências entre Brandbook/Manual Visual/Manual Produto/Catálogo (light `#F4F7FB` vs `#F8FAFC`, muted dark `#9EADC8` vs `#A1A1B5`, hover `#252532` vs `#242430`, alphas de sombra/borda/glow, code-bg `#09090D` vs `#08090F`) — **esses conflitos são documentados, não resolvidos**; a implementação segue os tokens.

## 3. Versionamento

| Camada | Mecanismo | Estado |
|---|---|---|
| Tokens de marca | Campo `version` no JSON (`2026.1`); sem changelog formal | **versionamento manual, sem semver formal** |
| Tokens de personagens | `version: "1.0.0"` | idem |
| Documentos HTML oficiais | Sem versionamento interno visível; precedência fixa pelo README | — |
| Pacote V2 | `public/design-lab/identidade-v2/MANIFEST.sha256` (148 arquivos auditados; 77 versionados) + `_baseline-v2.0/v2.0-entregue.tar.gz` | **proposta-não-homologada** |
| Repositório | Git tags existentes: `v1.0.0`, `v2.0.0-recovery` (+ tags `archive/worktree-agent-*`); branches `agente/<nn>-<slug>`, `integracao/onda-<n>` | tags não são específicas do Brand System — **não há tag de release de identidade** |
| Design system runtime | Sem versão exposta; `DESIGN.md` não declara versão | lacuna — **[PROPOSTO]** versionar tokens com data (`AAAA.N`) já praticado em `2026.1` |

## 4. Auditoria de drift (como detectar divergência)

| Ferramenta/artefato | O que faz | Como rodar/usar | Status |
|---|---|---|---|
| `docs/design/TOKEN-AUDIT.md` | Auditoria manual Voice-Hub vs `globals.css`: conflitos de cor/tipografia/motion/raio + duplicação de `tokens.ts` | Documento de referência do método (tabelas de conflito, recomendações) | **precedente** — método reaproveitável; recomendações parcialmente pendentes |
| `scripts/design-system-audit.js` | Auditoria automatizada: inventaria componentes visuais do codebase, screenshots por categoria/componente | `node scripts/design-system-audit.js [--viewport=1440x900] [--output=prints-design-system] [--category=buttons] [--component=Button]` | **ferramenta ativa** |
| `scripts/extract-design-tokens.ts`, `extract-design-tokens-v2.ts` | Extração de tokens do código | scripts de extração (ver uso interno) | **ferramenta ativa** |
| `scripts/design-system-capture.ts`, `design-system-capture-simple.ts`, `capture-redesign-screenshots.ts`, `capture.cjs` (`docs/design/screenshots/`) | Captura de screenshots de regressão visual | Playwright | **ferramenta ativa** — goldens comparáveis aos de `04_ASSETS_VISUAIS` |
| `public/design-lab/identidade-v2/MANIFEST.sha256` + `EVIDENCIAS-FORA-DO-GIT.txt` + `LEIA-ME-REPOSITORIO.md` | Integridade do pacote V2 (sha256); 71 evidências fora do git por budget de 60 MB (`scripts/ci/check-public-budget.mjs`) | `grep -vFf <(sed 's#^#  #' EVIDENCIAS-FORA-DO-GIT.txt) MANIFEST.sha256 \| sha256sum -c --quiet` | **proposta-não-homologada** |
| `scripts/ci/check-public-budget.mjs` | Budget de tamanho de `public/` no CI | CI | **gate ativo** |
| `tests/unit/features/landing/hero-n1.test.tsx`, `tests/unit/components/ui/HeroMockup.test.tsx` | Testes de componentes visuais | `npm test`/vitest | **gate ativo** |

### 4.1 Dívida de drift conhecida (medida em 2026-11-19)

- **2039 hex literals em 150 arquivos .tsx** (~26% dos 583 arquivos) e **1275 classes arbitrárias `[#…]` em 101 arquivos** (`_FATOS-CANONICOS.md` §11). Piores ofensores: `Landing360.tsx` (125), `NewLoginScreen.tsx` (39), `landing/luxury Act*.tsx` (~200), `Analytics.tsx` (19).
- PR #368 (`agente/00-paleta-oficial-migracao`, hex→var() em ~100 arquivos) está OPEN com 5 gates vermelhos; decisão do 00: **NÃO integra**; handoff `onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`.
- CSS morto sem import: `src/index.css`, `src/styles/elegance.css`, `src/styles/luxury-tokens.css` — paletas Champagne/Sage/Pearl e `--lux-*` JetBrains Mono (§12).
- Mini DS divergente vivo: `src/features/voice-hub/components/design-system/` (§12; ver `TOKEN-AUDIT.md`).
- Sub-apps divergentes: `landing/` (Cabin), `src/features/prospecting/outbound/` (escuro/lime).
- Overrides parciais: `official-identity.css:264-315` cobre apenas 5 hex de texto no tema claro.

### 4.2 Como auditar drift hoje (procedimento)

1. **Cor:** `grep -rE '#[0-9a-fA-F]{6}' src --include='*.tsx'` e comparar contra tokens; novos hex devem virar `var(--color-*)` ou justificativa registrada.
2. **Tokens órfãos:** conferir se `official-identity.css` continua importando `birthhub360.css`/`characters.css` (`:1-2`) e se nenhum arquivo redefine a paleta canônica (proibido pelo comentário `:4-5`).
3. **Componentes:** `node scripts/design-system-audit.js --category=<cat>` para inventário visual.
4. **Fontes:** confirmar que `globals.css` só referencia `/fonts/{sora,inter,ibm-plex-mono}-*` e que `public/fonts/brand/*` não voltou a ser importado.
5. **Integridade documental:** `MANIFEST.sha256` do pacote V2 quando aplicável.
6. **Regressão visual:** screenshots Playwright (`scripts/design-system-capture*.ts`) contra goldens.

## 5. Lacunas

- Não existe teste automatizado que falhe quando um hex arbitrário entra em `src/components/ui/**` — **[PROPOSTO]** gate de lint customizado (handoff Agente 03/08).
- `brand.ts` duplica hex sem vínculo verificado com tokens em CI — **[PROPOSTO]** teste de paridade.
- Nenhuma tag Git específica do Brand System — **[PROPOSTO]** marcar releases de identidade (`identidade-vAAAA.N`).
