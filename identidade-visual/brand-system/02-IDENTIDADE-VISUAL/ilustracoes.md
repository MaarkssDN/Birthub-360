# Ilustrações e Personagens — Birth Hub 360°

**Propósito:** documentar o sistema de personagens/ilustrações oficiais.
**Estado:** CONFIRMADO (29 SVGs ratificados) + PENDENTE (contagem e guia dos agentes).
**Data:** 2026-11-19 · **Fontes:** `identidade-visual/birthhub360/characters/` (29 SVGs), `public/brand/characters/` (25 servidos), `src/features/characters/` (catalogs + runtime), `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`, `FONTE-DE-VERDADE` §8, handoff `personagens-29-20261110/00-para-11-ratificacao-identidade-visual.md`.

---

## 1. O que são

29 personagens SVG **sintéticos, não-humanos** — embaixadores visuais da marca e dos agentes do enxame. Cada um tem nome próprio, paleta e identidade. Não são mascotes fofo-funcionais nem fotografia; são figuras geométricas/tecnológicas coerentes com "Neon Editorial Cinematic".

## 2. Composição

| Grupo | Quantidade | Exemplos | Guia formal |
|---|---|---|---|
| Avatares-pilar | 9 | Orbit, Nexus, Aria, Vanguard, Oracle, Core, Spark, Echo, Sudo | `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md` (cobre os 9, status homologação Agente 24) |
| Personagens-agente | 20 | aegis, anchor, apex, axiom, beacon, cipher, forge, harbinger, helm, ledger, meridian, pledge, relay, scope, scout, seal, sudo*, tempo, tracker, tribunal, vanguard*, vox (*sobreposição de nomes com pilares — ver nota) | **NÃO ENCONTRADO** |

**Nota:** a lista de 20 agentes inclui nomes que também aparecem entre os 9 pilares (vanguard, sudo) — a taxonomia exata pilar↔agente↔módulo está em `characterCatalogPillars.ts`/`characterCatalogAgents.ts`/`characterRuntime.ts`. Contagem total 29 = 9 + 20.

## 3. Assets

- Fonte: `identidade-visual/birthhub360/characters/*.svg` (29 arquivos).
- Espelhos: `public/brand/characters/` (25 servidos — verificar os 4 faltantes), `identidade-visual/v2/assets/characters/` (29).
- Runtime: `src/features/characters/` resolve personagem↔módulo↔agente.

## 4. Regras de uso

1. **Não redesenhar** — SVGs são oficiais e preservados.
2. Personagem representa capacidade/agente — nunca usar como decoração genérica.
3. Cada personagem tem paleta própria dentro da família neon — não recolorir para outra cor de módulo.
4. Em contextos pequenos, usar o avatar simplificado (ver guia mestre para 6 estados de motion dos 9 pilares).
5. Tom: bots não-humanos, profissionais — não infantilizar.

## 5. Motion dos personagens

O guia mestre documenta **6 estados de motion** para os avatares-pilar (idle, hover, active etc.) — referência para microinterações de agentes. Motion system: `../05-MOTION/`.

## 6. Lacunas

- **L1:** guia formal só cobre 9/29 — PROPOSTO estender aos 20 agentes.
- **L2:** contagem de "agentes" diverge (20 personagens vs 24–26 citados em contratos/docs) — PENDENTE.
- **L3:** `public/brand/characters/` serve 25 — verificar se 4 faltantes são intencionais.
- **L4:** tokens `characters.{css,json,ts}` existem — documentar paleta por personagem quando guia for estendido.

**Relacionados:** `iconografia.md`, `imagens.md`, `aplicacoes.md`, `../01-MARCA/arquitetura-de-marca.md` §3.
