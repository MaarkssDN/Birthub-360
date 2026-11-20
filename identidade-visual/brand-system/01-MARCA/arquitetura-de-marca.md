# Arquitetura de Marca — Birth Hub 360°

**Propósito:** definir a relação entre marca-mãe, produto, módulos e personagens.
**Estado:** CONFIRMADO (estrutura de módulos em código) + PROPOSTO (regras de marca por módulo).
**Data:** 2026-11-19 · **Fontes:** `src/components/layout/moduleRegistry.ts`, `identidade-visual/v2/FONTE-DE-VERDADE.md` §6/§8, `identidade-visual/README.md`, `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`.

---

## 1. Estrutura

```
Birth Hub 360° (marca-mãe)
└── Produto: Sistema Operacional de Inteligência Comercial
    ├── Hub Central (fora da numeração — ponto de entrada)
    ├── P01–P08 — oito pilares funcionais
    ├── M09–M11 — módulos complementares
    └── 29 Personagens — embaixadores visuais (9 pilares + 20 agentes)
```

- Registro canônico de módulos: `src/components/layout/moduleRegistry.ts` — P01–P08 + M09–M11; M10 mobile-only; M11 rota top-level.
- Catálogo funcional com IDs `P##-FN-###`: `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`.
- Personas de navegação por papel (Closer/Gestor/SDR): `documentacao-aplicacao/inventario/mapa-de-navegacao.md`.

## 2. Princípio: um DS, identidade contextual

FONTE-DE-VERDADE §6 (fixado): **um único Design System com identidade contextual por módulo — nunca 11 sistemas incompatíveis.**

Implementação parcial existente:
- `.bh-platform-card[data-accent]` aceita acentos: `gold|pink|iris|success|danger|blue|neutral|brand|cyan` (official-identity.css:166-196,321-327).
- `.bh-card`/`.bh-heading`/`.bh-kicker` aceitam `data-accent`: cyan|blue|gold|pink|iris|success|danger (birthhub360.css:252-258).
- `--module-accent` / `data-module` mapping = **PROPOSTO** em v2, não homologado.

**Regra [PROPOSTO até homologação]:** módulos mantêm a mesma base (superfícies, tipografia, raios, componentes) e diferenciam-se por acento semântico e personagem — nunca por paleta própria.

## 3. Personagens como camada de marca

- **29 SVGs oficiais** em `identidade-visual/birthhub360/characters/` + espelhos `public/brand/characters/` e `identidade-visual/v2/assets/characters/`.
- Composição: **9 avatares-pilar** (Orbit, Nexus, Aria, Vanguard, Oracle, Core, Spark, Echo, Sudo) + **20 personagens-agente**.
- Vínculo em runtime: `src/features/characters/` (`characterCatalogPillars.ts`, `characterCatalogAgents.ts`, `characterRuntime.ts`).
- Guia formal cobre só os 9 pilares (`GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`) — os 20 agentes **não têm guia equivalente** (lacuna documentada na auditoria V2).
- Contagem de "agentes" diverge entre fontes (20/24–26/29) — PENDENTE.

## 4. Sub-marcas e superfícies

| Superfície | Relação com a marca | Estado |
|---|---|---|
| App `/app/*` | produto principal, modo Operate | CONFIRMADO |
| Landing `/`, `/welcome`, `/login` | mesma identidade neon; intocável por regra | CONFIRMADO |
| `landing/` sub-app | identidade divergente (Cabin+gold) | CONFLITANTE — decisão pendente |
| `landing-page.html` raiz | navy/gold legado | HISTÓRICO — candidato a remoção |
| `public/tools/*` | portais de marca antiga (atlas) | CONFLITANTE — handoffs abertos |
| VoiceHub (`/app/voice-hub`, `/landing-new`) | módulo do produto + landing própria | CONFIRMADO/PARCIAL |
| Prospecting `outbound/` | sub-app quase standalone, design escuro/lime próprio | CONFLITANTE — decisão pendente |

## 5. Marca em contextos não-digitais

- **Apresentações/vendas:** `documentacao-aplicacao/` (briefing, roteiros, imagens, vídeo) + playbooks em `03_BRAND_KB/` (fonte de trabalho) — usar paleta/gradientes oficiais.
- **E-mail/notificações:** templates devem usar `BRAND.colors` (`src/config/brand.ts`); resíduo `#FF5618` já corrigido em `meetingInvite.ts`/`executiveExport.ts` (handoff onda-c0).
- **Impressão/PDF:** `src/components/pdf/PDFExport.tsx` — verificar paleta ao gerar (PROPOSTO: auditar).

## 6. Governança

- Dono da identidade visual: **Agente 11** (`identidade-visual/**`, `documentacao-aplicacao/**`).
- Tokens/estilos: **Agente 03** (`src/styles/**`, `src/components/ui/**`) — mudanças exigem handoff 11→03.
- Navegação/shell: **Agente 02** (`src/App.tsx`, Sidebar).
- Qualquer alteração de identidade oficial exige aprovação do Orquestrador Humano + parecer do Agente 24.

**Relacionados:** `identidade-da-marca.md`, `../03-PRODUTO/mapa-de-modulos.md`, `../07-ATIVOS/catalogo-de-assets.md`, `../00-GOVERNANCA/conflitos-e-decisoes.md`.
