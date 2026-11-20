# Iconografia — Birth Hub 360°

**Propósito:** regras de uso de ícones na plataforma.
**Estado:** CONFIRMADO (biblioteca e componentes) + PROPOSTO (regras formais de stroke/grid).
**Data:** 2026-11-19 · **Fontes:** `package.json` (lucide-react), `src/components/icons/`, `src/components/brand/`, MANUAL-MESTRE §7-8.

---

## 1. Bibliotecas

| Biblioteca | Uso | Evidência |
|---|---|---|
| `lucide-react` | ícones de UI em toda a plataforma | 393 arquivos .tsx importam |
| `src/components/icons/` | `AnimatedIcon`, `BrandIcons` (24×24 traço redondo) | componentes próprios |
| `src/components/brand/PillarIcons` | 8 ícones dos pilares | DESIGN.md catálogo |
| `src/components/brand/title-icons/*` | ícones de título por módulo | layout |
| SVGs de integração | logos Bitrix/Google/HubSpot etc. | `public/landing/assets/*.svg` |

## 2. Regras de uso

1. **UI icons:** sempre `lucide-react` — nunca emoji, nunca SVG inline avulso, nunca ícone de outra biblioteca.
2. **Brand icons:** `BrandIcons`/`PillarIcons` para elementos de marca e pilares — não substituem lucide em UI genérica.
3. **Tamanho:** seguir o tamanho do contexto (sm/md/lg do componente); alvos de toque ≥44×44px (WCAG 2.2 AA).
4. **Cor:** herdar `currentColor` ou token (`--color-text-*`, `--color-heading-*`); nunca hex hardcoded.
5. **Peso de traço:** manter o traço padrão do lucide (2px); não customizar stroke-width por componente.
6. **Estado:** ícone sozinho não comunica estado — sempre com label ou contexto (cor nunca é único indicador).

## 3. Ícones de marca vs ícones de UI

- **Marca:** emblema, wordmark, personagens, PillarIcons — têm geometria e paleta próprias, não são lucide.
- **UI:** lucide-react para ações, status, navegação, dados.
- **Personagens:** SVGs em `public/brand/characters/` — uso em catálogo `/app/characters`, widgets de agentes, materiais de marketing.

## 4. Anti-padrões

- Emoji como ícone (`🚀`, `✅`) — proibido em UI de produção.
- Ícones de marca editados/recoloridos fora dos assets oficiais.
- Misturar lucide + Material Icons + Heroicons no mesmo fluxo.
- Ícone decorativo sem função.

## 5. Personagens como "ícones vivos"

Os 29 personagens são a iconografia expressiva da marca — cada um representa um pilar/agente com paleta e nome. Regras de uso: `ilustracoes.md`. Em UI, aparecem em `ModuleAgentWidget`, catálogos e superfícies de IA — nunca como mero enfeite de card.

**Relacionados:** `identidade-visual.md`, `ilustracoes.md`, `aplicacoes.md`, `../04-DESIGN-SYSTEM/foundations.md` §iconografia.
