# Brandbook — Birth Hub 360° (edição consolidada)

**Propósito:** referência consolidada da marca em Markdown. Integra as fontes oficiais sem duplicá-las.
**Estado:** CONFIRMADO onde marcado; PENDENTE onde a decisão aguarda o Orquestrador Humano.
**Data:** 2026-11-19 · **Fontes primárias:** `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html`, `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html`, `identidade-visual/MANUAL-DE-IDENTIDADE-DO-PRODUTO.html`, `identidade-visual/CATALOGO-DE-COMPONENTES.html`, `identidade-visual/v2/02-brandbook/brandbook.html` (não homologado), `docs/BrandConstitution.md`, `MANUAL-MESTRE-IDENTIDADE-VISUAL-BIRTH-HUB-360.md` (pasta de trabalho).

> **Nota de precedência:** este documento consolida; em caso de divergência com os HTMLs oficiais de `identidade-visual/`, **os HTMLs e os tokens machine-readable prevalecem** (ver `identidade-visual/README.md`). Divergências estão em `../00-GOVERNANCA/conflitos-e-decisoes.md`.

---

## 1. Apresentação

Birth Hub 360° é o Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence — uma central de comando 360° do ciclo de receita, do primeiro sinal à forecast. Produto web + app Android (Capacitor), multi-tenant com RLS e LGPD by design.

## 2. Essência e propósito

- Essência: *"dar à inteligência uma forma em que se pode confiar"* (BrandConstitution §1).
- Propósito: operar o ciclo de receita completo com dados em movimento, IA ativa, velocidade e resiliência.
- Visão/valores formais: Innovation, Data Intelligence, Efficiency, Scalability (BrandConstitution §1). Não há missão/visão declaradas em texto formal — **[PROPOSTO]** redigir quando o Orquestrador definir.

## 3. Posicionamento

Ver `posicionamento.md`. Categoria: Revenue Intelligence operacional; diferencial: IA como agente executor supervisionado, não feature acessória.

## 4. Personalidade

Precisão · Confiança · Velocidade · Autoridade · Inovação contida · Transparência. Detalhes: `personalidade.md`.

## 5. Identidade verbal

Profissional · Tecnológica · Direta · Empowering. Glossário e microcopy: `identidade-verbal.md`, `../03-PRODUTO/ux-writing.md`.

## 6. Identidade visual — resumo

Linguagem **"Neon Editorial Cinematic"** (FONTE-DE-VERDADE §5): grafismos 360°, composição editorial, profundidade, glow — sem fotografia humana genérica.

## 7. Logotipo

- **Emblema Orbital:** aro externo pontilhado `#FFC107`, 6 arcos de órbita em gradientes (ciano→rosa→ouro→azul→íris→ciano), núcleo `#0D0D0D`, anel interno ouro, monograma "B" serifado `#F8F9FF`.
- **Wordmark:** `BIRTH HUB 360°`, Sora 800, tracking `-0.02em`, `360°` em Azul Neon; viewBox `0 0 946 256`.
- **Assets canônicos:** `identidade-visual/birthhub360/logos/{birthhub360-icone,birthhub360-logo-horizontal,birthhub360-simbolo}.svg` + `public/brand/`.
- **Área de proteção:** divergência entre fontes (Manual Mestre ~30% da altura; BrandConstitution 1/4 do raio externo) — **PENDENTE**; usar a maior até decisão.
- **Mínimos:** divergência (140px/24px vs 96px/32px) — **PENDENTE**; regra segura: ícone ≥32px, símbolo ≥96px, wordmark ≥140px de largura.
- Detalhes completos e usos proibidos: `../02-IDENTIDADE-VISUAL/logotipo.md`.

## 8. Paleta

| Papel | Dark | Light (AA) |
|---|---|---|
| Marca primária | `#00D4FF` Azul Neon | `#0369A1`/`#0284C7` |
| Marca secundária | `#FF2D9B` Rosa Neon | `#D91B7C`/`#BE185D` |
| Marca acento | `#FFC107` Dourado | `#D97706`/`#92400E` |
| IA | `#8B7DFF` Íris | `#7C3AED`/`#6D28D9` |
| Fundo | `#0D0D0D` | `#F4F7FB` (canônico V2; `#F8FAFC` legado — PENDENTE) |
| Superfície | `#14141A` | `#FFFFFF` |\n| Texto | `#F8F9FF` / `#9EADC8` / `#A1A1B5` | `#0F172A` / `#64748B` / `#475569` |
| Sucesso/Atenção/Crítico/Info | `#22C55E`/`#FFC107`/`#EF4444`/`#3B82F6` | idem com variantes AA |

Tabela completa e tokens: `../02-IDENTIDADE-VISUAL/paleta-de-cores.md`, `../04-DESIGN-SYSTEM/design-tokens.md`.

## 9. Gradientes e efeitos de assinatura

- Títulos: `linear-gradient(135deg,#00D4FF,#FF2D9B 50%,#FFC107)`.
- CTA: `linear-gradient(135deg,#FF2D9B,#00D4FF)`.
- Órbita: `conic-gradient(from 0deg,#FFC107,#FF2D9B,#00D4FF,#FFC107)`.
- Glows: `0 0 24px rgba(0,212,255,.45)` / `rgba(255,45,155,.45)` / `rgba(255,193,7,.45)`.

## 10. Tipografia

Trinca exclusiva self-hosted (`public/fonts/`): **Sora** (display), **Inter** (interface, `cv05/cv11/ss01`, tracking `-0.012em`), **IBM Plex Mono** (dados). Proibidas: Bodoni Moda, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque. Detalhes: `../02-IDENTIDADE-VISUAL/tipografia.md`.

## 11. Grafismos e iconografia

- Elemento de assinatura: anel/órbita 360° (`.bg-orbit-conic`, `.bh-orbit-ring`), padrões `.bh-pattern-diagonal-60`/`.bh-pattern-grid`.
- Ícones de UI: `lucide-react` (traço consistente); ícones de marca: `BrandIcons`, `PillarIcons`, `AnimatedIcon` em `src/components/icons|brand/`.
- Regras: `../02-IDENTIDADE-VISUAL/iconografia.md`.

## 12. Ilustração e imagem

- 29 personagens SVG oficiais (9 pilares + 20 agentes) — sintéticos, não-humanos; guia mestre cobre os 9 pilares. `../02-IDENTIDADE-VISUAL/ilustracoes.md`.
- Fotografia: sem direção formal de fotografia de marca encontrada — **NÃO VERIFICADO/PROPOSTO**: usar imagens reais de operação (telas, dados) em vez de stock humano genérico, coerente com "Neon Editorial Cinematic".

## 13. Aplicações digitais

- Web app `/app/*` (Operate, dark/light) — `DESIGN.md` é a autoridade.
- Landing/Login públicas — protegidas, intocáveis.
- PWA Android (Capacitor) — ícones, splash, theme_color `#F4F7FB`.
- HTMLs de referência navegáveis: `identidade-visual/birthhub360/*.html`.

## 14. Usos incorretos do logo

- Não distorcer, não reordenar gradientes dos arcos, não trocar Sora do wordmark, respeitar área de proteção, nunca remover o "B", não aplicar sobre fundos que comprometam contraste, não usar versões legadas navy/gold nem o símbolo divergente "Birthub" (3 arcos).
- Lista completa: `../02-IDENTIDADE-VISUAL/logotipo.md` §usos proibidos.

## 15. Regras de consistência

1. Tokens `--color-*` canônicos — nunca `--bg/--ink` deprecated, nunca hex hardcoded.
2. Trinca tipográfica — nunca fontes fora da lista.
3. Raios 12/16/20/pill — nunca outros.
4. Gradientes de assinatura apenas nos papéis definidos.
5. 4 estados obrigatórios em toda tela de dados.
6. `prefers-reduced-motion` sempre respeitado.
7. Dark e light validados em todo componente novo.

## 16. Relação marca ↔ produto

Ver `arquitetura-de-marca.md`: um DS, identidade contextual por módulo via acentos — nunca identidades paralelas por módulo.

## 17. Governança e fontes oficiais

- **Fontes de verdade (ordem):** `identidade-visual/v2/FONTE-DE-VERDADE.md` → `identidade-visual/README.md` (Brandbook > Manual Visual > Manual Produto > Catálogo) → tokens `birthhub360/*` → `official-identity.css`/`globals.css` → `src/config/brand.ts`.
- **Dono:** Agente 11 (`identidade-visual/**`); tokens/estilos Agente 03; navegação Agente 02.
- **Aprovação:** Orquestrador Humano para mudanças de identidade; Agente 24 para revisão independente.
- **Esta biblioteca:** `identidade-visual/brand-system/` — camada de consolidação; em divergência, as fontes acima prevalecem.

**Documentos relacionados:** todos os arquivos desta pasta + `../00-GOVERNANCA/` + `../09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md`.
