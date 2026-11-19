# Identidade Visual — Birth Hub 360°

**Propósito:** visão consolidada da identidade visual oficial.
**Estado:** CONFIRMADO — paleta/gradientes/tipografia/raios implementados em código; partes de marca dependem de homologação.
**Data:** 2026-11-19 · **Fontes:** `identidade-visual/birthhub360/tokens/*`, `src/styles/globals.css`, `src/styles/official-identity.css`, `MANUAL-MESTRE-IDENTIDADE-VISUAL-BIRTH-HUB-360.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`, `DESIGN.md`.

---

## 1. Linguagem visual

**"Neon Editorial Cinematic"** (FONTE-DE-VERDADE §5, fixado pelo usuário):

- Grafismos inspirados em órbita/360° — anel cônico, halos, linhas de dados.
- Composição editorial — hierarquia de título com acento de cor, kickers, descrições neutras.
- Profundidade — superfícies empilhadas + sombras longas + glow como iluminação.
- Cor como informação — neon sinaliza função (marca, conversão, meta, IA), nunca decora.
- Sem fotografia humana genérica como elemento de marca.

## 2. Os 5 pilares visuais

| Pilar | Regra | Implementação |
|---|---|---|
| Cor | Paleta Neon 4+semânticos, light AA | `--palette-neon-*`, `--color-*` (birthhub360.css) |
| Tipografia | Sora/Inter/IBM Plex Mono, self-hosted | `@font-face` globals.css:12-198 |
| Forma | Raios 12/16/20/pill; bordas glow sutis | `--radius-*`, `--color-border-*` |
| Luz | Gradientes de assinatura + glows oficiais | `--grad-*`, `--glow-*`, `.border-glow-*` |
| Movimento | Motion operacional rápido; comercial cinematográfico (proposta) | `src/lib/motion.ts`, `05-MOTION/` |

## 3. Temas

Dois temas oficiais: **dark** (canônico, `#0D0D0D`) e **light** (adaptado AA, `#F4F7FB`). A identidade é a mesma nos dois — muda a rampa semântica, não a linguagem. Detalhes: `../04-DESIGN-SYSTEM/temas.md`.

## 4. Elementos de assinatura

- **Anel de Órbita 360°**: `conic-gradient(from 0deg,#FFC107,#FF2D9B,#00D4FF,#FFC107)` — `.bg-orbit-conic`, `.bh-orbit-ring`.
- **Gradiente de títulos**: `linear-gradient(135deg,#00D4FF,#FF2D9B 50%,#FFC107)`.
- **Glows**: `0 0 24px rgba(...,.45)` nas 3 cores de marca.
- **Emblema orbital** do logo (ver `logotipo.md`).
- **Personagens sintéticos** como camada viva da marca (ver `ilustracoes.md`).

## 5. O que compõe a identidade no produto

- Shell: Sidebar rail + ModuleNavPanel + AppTopbar sobre canvas dark/light.
- Cards: `.bh-platform-card`/`.bh-card` com borda de acento sutil + glow no hover.
- Títulos: `bh-heading` com `data-accent` (cyan/gold/pink/iris/blue/success/danger) — nunca branco/preto puro.
- Dados: IBM Plex Mono para KPIs, valores, logs.
- Feedback: badges coolors, toasts, skeletons shimmer.

## 6. Divergências ativas (resumo — detalhe em `../00-GOVERNANCA/conflitos-e-decisoes.md`)

1. Três gerações de paleta coexistem: Neon (oficial), navy/gold "Strategic Command Center" (docs/skills/SVGs legados), orbit5 5-cores (`BirthHubLogo.tsx` variante).
2. Grafia "Birthub" vs "Birth Hub" — PENDENTE.
3. SVGs mestres contêm cores históricas navy/gold "preservadas por determinação do usuário"; versões neon existem em `v2/assets/` e na pasta de trabalho.
4. `landing/` e `prospecting/outbound/` têm identidades próprias divergentes.
5. CSS morto (`elegance.css`, `luxury-tokens.css`, `index.css`) carrega sistemas inteiros concorrentes.

## 7. Documentos desta seção

`logotipo.md` · `paleta-de-cores.md` · `tipografia.md` · `iconografia.md` · `ilustracoes.md` · `imagens.md` · `aplicacoes.md`
