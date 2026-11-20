# Logotipo — Birth Hub 360°

**Propósito:** especificação do logotipo oficial: anatomia, variações, proteção, mínimos, usos proibidos.
**Estado:** CONFIRMADO (anatomia e regras do Manual Mestre) + PENDENTE (área de proteção/mínimos divergem entre fontes).
**Data:** 2026-11-19 · **Fontes:** `MANUAL-MESTRE-IDENTIDADE-VISUAL-BIRTH-HUB-360.md` §4, `identidade-visual/birthhub360/logos/*.svg`, `docs/BrandConstitution.md` §4, `src/config/brand.ts`, `src/components/brand/*`.

---

## 1. O que é o logotipo

Dois componentes que funcionam juntos ou separados:

1. **Emblema Orbital (símbolo)** — círculo com aro pontilhado dourado, 6 arcos de órbita em gradientes, núcleo escuro, anel interno dourado, linha equatorial e monograma "B" serifado claro.
2. **Wordmark** — `BIRTH HUB 360°` em Sora 800 caixa alta, tracking `-0.02em`; o "360°" recebe Azul Neon.

Versões: horizontal completa (`viewBox 0 0 946 256`), símbolo isolado (`0 0 256 256`), ícone (`38 38 180 180`).

## 2. Anatomia do emblema (evidência MANUAL-MESTRE §4.2)

| Elemento | Especificação |
|---|---|
| Aro externo pontilhado | `#FFC107`, raio ~118, tracejado `dasharray 1.44 10.93`, stroke ~11.77 |
| 6 arcos de órbita | raio ~82, stroke ~16, gradientes ciano→rosa→ouro→azul→íris→ciano |
| Núcleo | `#0D0D0D`, raio ~74 |
| Anel interno | dourado, raio ~61.5 |
| Linha equatorial | rect ~64,126.5, 128×3 |
| Monograma "B" | serifado, `#F8F9FF`, escala ~0.074 |

SVG canônico completo reproduzido no MANUAL-MESTRE §4.2 (linhas 197–260). Versões em código: `src/components/brand/BirthHubLogo.tsx` (inline React, `useId()` para ids), `AnimatedBirthHubEmblem.tsx`, `BirthHubOrbit360.tsx`.

## 3. Assets oficiais (canônicos)

| Asset | Caminho | Uso |
|---|---|---|
| Símbolo | `identidade-visual/birthhub360/logos/birthhub360-simbolo.svg` + `public/brand/birthhub360-simbolo.svg` | ícone/avatar |
| Horizontal | `identidade-visual/birthhub360/logos/birthhub360-logo-horizontal.svg` + `public/brand/` | cabeçalhos, login |
| Ícone | `identidade-visual/birthhub360/logos/birthhub360-icone.svg` | favicon, app icons |
| Favicon | `public/brand/birthhub360-icone.svg` referenciado em `index.html` | browser/PWA |
| Variantes temáticas | `identidade-visual/v2/assets/logos/` e `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/*-{dark,light}.svg` | dark/light/animadas |
| Personagens | `public/brand/characters/` | embaixadores |

## 4. Área de proteção e mínimos — DIVERGÊNCIA PENDENTE

| Fonte | Proteção | Mínimos |
|---|---|---|
| MANUAL-MESTRE §4 | ~30% da altura do logo | completo ≥140px; emblema ≥24px (abaixo de 32px suprimir pontilhado/régua) |
| BrandConstitution §4 | X = 1/4 do raio externo | ícone ≥32px; símbolo ≥96px |
| Guia de personagens | — | 24px/32px contextos pequenos |

**Regra operacional até decisão [PROPOSTO]:** usar sempre a proteção/mínimo **mais restritivo** (1/4 do raio externo; ícone ≥32px, símbolo ≥96px, wordmark ≥140px). Registrar em `../00-GOVERNANCA/conflitos-e-decisoes.md`.

## 5. Variações de cor

- **Neon (oficial):** gradientes ciano/rosa/ouro/azul/íris sobre núcleo `#0D0D0D`; wordmark claro.
- **Versões temáticas:** `*-dark.svg` / `*-light.svg` existem na pasta de trabalho e v2 — a variante light deve manter contraste AA (não há SVG light oficial no repo — PROPOSTO gerar quando homologado).
- **Monocromática:** não há versão monocromática oficial — PROPOSTO: emblema em `currentColor` para contexts extremos (brasil? decidir).

## 6. Usos proibidos (MANUAL-MESTRE §4.3/§14 + BrandConstitution)

- Não distorcer (stretch/squeeze/rotação fora do desenho).
- Não reordenar ou trocar gradientes dos arcos.
- Não trocar a fonte do wordmark (sempre Sora).
- Não remover o "B" do núcleo.
- Não invadir a área de proteção.
- Não aplicar sobre fundos que quebrem contraste (o núcleo escuro exige fundo escuro ou isolado).
- Não usar versões legadas: `birthhub360-*.svg` raiz sem prefixo (navy/gold), `brand__*` (duplicatas legadas), `symbol.svg`/`avatar.svg`/`favicon.svg`/`logo-horizontal-*` da pasta de trabalho (símbolo divergente "Birthub" de 3 arcos `#4C82F7/#9B6BF3/#D4AF37` + Bricolage Grotesque).
- Não redesenhar o emblema — SVGs mestres são preservados por determinação do usuário.

## 7. Divergência crítica: orbit5 no código

`src/components/brand/BirthHubLogo.tsx` (na pasta de trabalho `05_TOKENS_E_TEMAS/`) usa paleta **orbit5** de 5 cores (`#D4AF37→#FF3158→#FF4FA3→#7C3AED→#1677FF→#9C5A7E`, núcleo `#0B132B`) — divergente do Neon oficial. No repo, verificar qual implementação está ativa antes de assumir; qualquer variante orbit5 é **CONFLITANTE** até decisão humana.

## 8. Em uso na plataforma

- `src/config/brand.ts` → `BRAND.logos` aponta `/brand/birthhub360-{simbolo,icone,logo-horizontal}.svg`.
- Header/sidebar/topbar consomem via componentes `src/components/brand/`.
- Landing/Login usam os mesmos assets (protegidos).

**Relacionados:** `identidade-visual.md`, `paleta-de-cores.md`, `aplicacoes.md`, `../07-ATIVOS/catalogo-de-assets.md`, `../00-GOVERNANCA/conflitos-e-decisoes.md`.
