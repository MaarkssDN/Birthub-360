# Relatório de Execução — Agente 36 · Léo

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 3 — Experiência
**Branch:** `agente/36-leo-landing-v2` (base: `agente/32-ema-ui-states-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. `Landing360.tsx` (3.190 linhas, cinematic engine própria) não foi alterada — v2 é página nova em `src/features/landing/v2/` adotável por flag, conforme a estratégia incremental aprovada.
2. A landing v2 é **dark-only por design** (navy-900 fixo) — por isso usa cores fixas (`text-white`, `text-slate-*`) e NÃO a escala `--offwhite-*`, que inverte no `.dark`. Bug pego e corrigido durante a execução (offwhite-50/300 ficariam invisíveis/insuficientes no dark).
3. SEO: página semântica (h1 único, nav/footer com aria-label, seções com heading); meta/OG continuam centralizados no `index.html` — sem regressão.
4. Claims: apenas capacidades reais do produto (CRM, prospecção, voz, IA com guardrails, dashboards, multi-tenancy/LGPD) — nenhum número de conversão inventado (regra do AGENTS local).

## Plano executado

- **Etapa 1 — Auditoria:** mapeadas as variantes existentes (Landing360, Landing360Impeccable, LandingAdaptive, LandingCinematic, LandingConversionV5, LandingRegenerationV4) e componentes cinematográficos.
- **Etapa 2 — Página v2:** `Landing360V2.tsx` — hero com Badge + headline serifada de marca + CTAs, seção de 6 pilares, CTA final, footer. Motion via `<Reveal>` (respeita `design.newMotion` + reduced-motion). Botões `Button`/`Badge` v2.
- **Etapa 3 — Adoção:** componente pronto para swap atrás de `design.newLanding`; **wiring da rota `/` é handoff do Agente 31** (App.tsx é propriedade dele).
- **Etapa 4 — Acessibilidade:** landmarks (header/nav/main implícito/footer), h1 único, `aria-label` em navs, `aria-hidden` em ícones, `sr-only` em numeração de cards, foco visível via Button v2.
- **Etapa 5 — Performance:** página leve (~9KB), zero libs pesadas novas, fontes já self-hosted; `Reveal` é no-op quando flag off.

## Arquivos alterados

- `src/features/landing/v2/Landing360V2.tsx` (novo)
- `.agents/runs/36-leo-landing-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo.
- `npx biome lint src/features/landing/v2/` → limpo.

## Testes

- Typecheck/lint verdes. Validação visual/Lighthouse fica para Fase 5 (requer flag ativa + build de preview).

## Evidências

- Paleta: navy-900/800 backgrounds, gold-400/500 accents, slate text — contraste AA sobre fundo escuro fixo.
- Componentes v2 reutilizados: Button, Badge, Reveal.

## Problemas fora do escopo

- Migração do conteúdo completo do Landing360 (3.190 linhas, cinematic engine, simulador de ROI, pillars detalhados) — a v2 atual é a espinha premium; enriquecimento progressivo é iteração futura.

## Handoffs abertos

- Para Agente 31 (Noa): trocar `<Landing360 />` por componente flag-aware (`isDesignV2Enabled(design.newLanding) ? <Landing360V2/> : <Landing360/>`) nas rotas `/`, `/welcome`, `/login`.
- Para Agente 39 (Tina): assets de marca oficiais para hero/logo quando prontos.

## Aprendizados reutilizáveis

- **Escala offwhite é tema-dependente**: nunca usá-la em superfícies de cor fixa — usar `slate`/`white` para páginas dark-only.
- Padrão de landing v2: página nova em `feature/v2/` + swap por flag > reescrever a página de 3k linhas de uma vez.

## Pendências

- Wiring da rota (handoff 31).
- Versão com captura de lead real (depende do formulário de captura — Agente 18/01).
- Lighthouse CI na página v2 quando roteada.

## Riscos

- Baixo: componente isolado, zero impacto até o wiring.
