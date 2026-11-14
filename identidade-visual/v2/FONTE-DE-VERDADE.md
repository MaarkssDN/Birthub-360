# FONTE DE VERDADE — Identidade Visual Birthub 360° V2.0
**Status:** decisões pinadas pelo usuário em 2026-11-13 (missão mestre). Itens marcados **[PENDENTE]** aguardam homologação — nenhum documento pode apresentá-los como regra oficial.
**Escopo:** somente documentação e demonstração em `identidade-visual/v2/`. Nada aqui altera a plataforma real.

## 1. Nome e grafia
- Nome oficial de trabalho: **Birthub 360°** (conforme briefing do usuário).
- **[PENDENTE]** Inconsistência documental entre "Birthub 360°" e "Birth Hub 360°": a Frente 01 deve levantar as evidências; se não houver fonte definitiva, a decisão permanece PENDENTE e os documentos V2 devem usar "Birthub 360°" com nota de pendência.

## 2. Posicionamento (fixado pelo usuário)
> **Birthub 360° — Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence.**

PRODUCT.md descreve "Sistema Operacional de Revenue Intelligence" — convergente; a formulação do briefing prevalece nos documentos V2.

## 3. Paleta Neon Oficial (fixada)
| Token | Hex | Papel |
|---|---|---|
| Azul Neon | `#00D4FF` | marca primária, halos, CTAs frios |
| Rosa Neon | `#FF2D9B` | energia, conversão, gradientes |
| Dourado | `#FFC107` | métricas, metas, avisos quentes, elemento 360° |
| Íris | `#8B7DFF` | IA, copiloto, agentes |
| Dark | `#0D0D0D` | fundo canônico dark |
| Light | `#F4F7FB` | fundo canônico light |

Regras fixadas: não neutralizar neon; não substituir por pastéis; gradientes de assinatura conforme DESIGN.md (`135deg #00D4FF→#FF2D9B→#FFC107`; CTA `#FF2D9B→#00D4FF`; anel cônico 360°; glows `0 0 24px rgba(...,0.45)`); contraste WCAG 2.2 AA inegociável (texto nunca branco/preto puro — usar os tons de superfície/texto dos tokens existentes); dark/light mode documentados.

**Atenção:** DESIGN.md lista `#F8FAFC` como canvas light e tons adaptados AA para light mode (`#0284C7`, `#D91B7C`, `#D97706`, `#7C3AED`). A V2 deve reconciliar: paleta de marca fixa + rampas semânticas adaptadas para AA — documentar explicitamente essa camada semântica.

## 4. Tipografia (fixada)
- **Sora** — display/títulos (pesos 400/600/700/800, tracking -0.02em)
- **Inter** — interface (font-feature-settings "cv05","cv11","ss01", tracking -0.012em)
- **IBM Plex Mono** — dados, métricas, logs, código

## 5. Linguagem visual
"Neon Editorial Cinematic": grafismos 360°, composição editorial, profundidade, glow, sem fotografias humanas genéricas. N1 Final Candidate é referência criativa, não fonte automática de regras.

## 6. Arquitetura de produto
Hub Central + Workspaces Modulares + Assistentes Globais. 11 módulos: P01–P08 (oito pilares) + M09–M11 (complementares). Um único Design System com identidade contextual por módulo — nunca 11 sistemas incompatíveis.

## 7. Motion System
Dois níveis: **Comercial** (monumental, cinematográfico — landing/marketing) e **Operacional** (sofisticada, funcional, rápida, discreta — workspaces). `prefers-reduced-motion` obrigatório. Framer Motion é a lib padrão do produto (`src/lib/motion.ts`).

## 8. Personagens
29 personagens visuais oficiais em `identidade-visual/birthhub360/characters/` e copiados em `v2/assets/characters/` (aegis, anchor, apex, aria, axiom, beacon, cipher, core, echo, forge, harbinger, helm, ledger, meridian, nexus, oracle, orbit, pledge, relay, scope, scout, seal, spark, sudo, tempo, tracker, tribunal, vanguard, vox — SVGs). NÃO confundir com os agentes técnicos nem com os 11 módulos (a contagem de agentes diverge entre fontes: 20 personagens-agente no catálogo, 24–26 citados em docs — decisão pendente do 00). Assets preservados; sem redesenho.

## 9. Logo
Assets oficiais em `identidade-visual/birthhub360/logos/` (icone, horizontal, simbolo — SVG). Não redesenhar, não alterar o logotipo original.

## 10. Limites
Não aplicar nada à plataforma real (landing, login, workspaces, auth, DB, integrações intocados). Sem migrations, merges, pushes, deploys. Materiais anteriores preservados.
