- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: aberto
- Prioridade: normal

## Problema

Código morto e peso desnecessário na feature landing:

**Arquivos sem nenhum importador (verificado via grep em src/):**
- `src/features/landing/pages/LandingPage.tsx` — arquivo vazio (0 linhas)
- `src/features/landing/pages/Landing360Impeccable.tsx` (384 linhas)
- `src/features/landing/pages/Landing360Impeccable.css` (160 linhas)
- `src/features/landing/pages/AuroraMotion.css` (357 linhas — só importado
  pelo LaunchLandingView morto)
- `src/features/landing/components/LaunchLandingView.tsx` (800 linhas)
- `src/features/landing/components/HeroConversionSection.tsx` (525 linhas)
- `src/features/landing/components/LoginFormCard.tsx` (82 linhas)
- `src/features/landing/components/LandingHeroScene.tsx` (82 linhas)
- `src/features/landing/components/LandingLoginSplitScreen.tsx` (30 linhas)

**11 imports lucide não usados em `Landing360.tsx`:**
`BarChart3, Check, Compass, ExternalLink, Headphones, MessageSquare, Network,
Search, Shield, Star, Users`.

**Peso da página ativa:** `Landing360.tsx` tem 3.370 linhas + 5 CSS
(~8.500 linhas: LandingAdaptive 4.314, LandingRegenerationV4 2.211,
LandingCinematic 1.315, Landing360 1.317, LandingConversionV5 524) +
Framer Motion + custom cursor "data stream" + magnetic attraction +
scroll velocity inertia + card tilt — tudo contínuo, sem orçamento de
performance definido para mobile/3G.

## Arquivo(s) envolvido(s)

- Lista acima. Antes de deletar, revalidar com `knip`/grep — o
  `features/auth/components/LandingLoginSplitScreen.tsx` (homônimo em outra
  pasta) pode ter consumidores; não confundir os dois.

## Alteração necessária

1. Deletar os arquivos mortos confirmados (ou mover para `_archive` se houver
   dúvida de produto — decisão do 00).
2. Remover os 11 imports não usados.
3. Avaliar com o Agente 23 um orçamento de performance: quantos FX contínuos
   são viáveis no mobile; considerar desligar `B360DataStreamCursor`,
   magnetic attraction e velocity inertia em `pointer: coarse`/reduced data.
4. Avaliar split do CSS por seção se o bundle inicial continuar pesado.

## Teste esperado

- `npm run build` sem erros; bundle da rota `/` menor.
- Nenhum import quebrado (`grep` pelos nomes deletados retorna zero).
- Lighthouse/mobile: LCP e INP dentro do orçamento acordado com o 23.

## Contexto adicional

- Regra P3: remover somente o que ficou órfão — não refatorar o que está vivo.
- `Landing360Impeccable.tsx` pode ser uma versão alternativa intencional;
  confirmar com o 00 antes de deletar (pode ter handoff de design associado).
