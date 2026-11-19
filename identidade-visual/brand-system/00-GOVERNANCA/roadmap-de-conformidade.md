# Roadmap de Conformidade — Legado → Canônico

**Propósito:** planejar a adequação progressiva de todo material divergente/histórico à identidade canônica Neon, por frente de trabalho, com prioridade e responsável sugerido.

**Escopo:** cobre código com hardcoded colors, CSS morto, docs obsoletos, sub-apps divergentes, `landing/`/`landing-page.html`, resíduo de marca antiga, PR #368 e ponteiros de governança. Não executa mudanças — é plano.

**Estado da informação:** prioridades **[PROPOSTO]** baseadas em `_FATOS-CANONICOS.md` e `.agents/experience/05-roadmap.md` (Ondas B–F); dependências humanas marcadas **PENDENTE**.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md` §§11–13, 18–19; `.agents/experience/05-roadmap.md`; `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`; `identidade-visual/v2/01-auditoria/matriz-conformidade.md`.

**Documentos relacionados:** `conflitos-e-decisoes.md`, `../09-PLANO-DE-EVOLUCAO/backlog-priorizado.md`, `../09-PLANO-DE-EVOLUCAO/plano-de-implementacao.md`.

**Legenda de responsáveis (AGENTS.md §15):** 03 = Design/Acessibilidade + `src/styles/**`/`src/components/ui/**`; 11 = `identidade-visual/**`; 02 = App.tsx/navegação; 00 = orquestração; 24 = revisão; 15 = segredos; 08 = docs/** e workflows.

---

## Fase 0 — Destravar decisões humanas (pré-requisito de quase tudo)

| Item | Conteúdo | Prioridade | Responsável |
|---|---|---|---|
| Grafia oficial | Decidir "Birth Hub 360°" vs alternativas (C1) | **P0** | Humano |
| Destino PR #368 | Após gates verdes + QA visual + parecer 24: merge, fatiar ou abandonar; convergir com PR #310 (C2/C12) | **P0** | 00 + 03 + 24 |
| `.env` em `05_TOKENS_E_TEMAS/` | Reportar ao 15; verificar versionamento (C13) | **P0 segurança** | 15/00 |
| Ponteiros de autoridade | Decidir redirecionamento de skills/CLAUDE.md (C14) | **P0** | Humano/00 |

## Fase 1 — Saneamento documental (barato, alto retorno)

| Frente | Ação | Prioridade | Responsável sugerido |
|---|---|---|---|
| Docs navy/gold/Bodoni | Marcar `docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`, `docs/strategy/DESIGN-playbook.md` como SUPERSEDED com banner apontando para `identidade-visual/brand-system/` | **P0** | 08 (docs/**) com revisão 24 |
| `.claude/CLAUDE.md` + `.claude/skills/design-system/` | Corrigir paleta descrita (Strategic Command Center → Neon) e a afirmação de que `birthhub360/` é identidade anterior | **P0** | Alinhamento 00; edição conforme dono |
| `.agents/skills/birthhub-*` | Atualizar "autoridade visual máxima" de DESIGN-LANGUAGE para brand-system/FONTE-DE-VERDADE | **P0** | Humano (prompts) / 00 |
| CSS morto | Arquivar ou remover `src/index.css`, `src/styles/elegance.css`, `src/styles/luxury-tokens.css` após confirmar zero imports | **P1** | 03 |
| Resíduo `#FF5618` | Substituir/aposentar assets em `public/tools/social-selling/` ou remover do deploy | **P1** | 11/02 |

## Fase 2 — Canonização de superfícies divergentes

| Frente | Ação | Prioridade | Responsável sugerido | Dependência |
|---|---|---|---|---|
| `landing/` sub-app + `landing-page.html` | Definir destino: canonizar em `Landing360` (já roteada), depreciar variantes (`Landing360Impeccable` não roteada, `/landing-new`→`LandingInnovative` — handoff Agente 12) | **P1** | 02 + 11; landing exige autorização humana (Onda E) | Onda C do roadmap de experiência |
| `src/features/prospecting/outbound/` | Migrar design próprio escuro/lime para tokens canônicos ou registrar exceção justificada | **P2** | Dono do módulo + 03 | Matriz de propriedade do diff |
| `voice-hub/components/design-system/` | Convergir hex residuais (`docs/design/TOKEN-AUDIT.md`) para a cadeia canônica tokens→official-identity→globals; shim de re-export já eliminou duplicação de arquivo | **P1** | 03C | Onda C |
| Logos | Decidir `BirthHubLogo.tsx` orbit5 vs Neon (C10); deprecar `BirthubLogo.tsx`/`Birthub360Logo.tsx` | **P1** | Humano decide; 03/11 executam | Decisão §19.8 |
| `public/fonts/brand/` | Remover Nunito/Outfit/Plus Jakarta Sans legadas não referenciadas | **P3** | 11 | Confirmar zero referências |

## Fase 3 — Migração de hardcoded colors (após destino do #368)

| Frente | Ação | Prioridade | Responsável sugerido | Dependência |
|---|---|---|---|---|
| Hex→var() em massa | Se #368 for integrado: validar gates + QA visual pendente (desktop/mobile × light/dark + gráficos). Se fatiado: priorizar `Landing360.tsx` (125), `NewLoginScreen.tsx` (39), `landing/luxury Act*.tsx` (~200), `Analytics.tsx` (19) | **P0/P1** | 03 (branch #368) ou fatiamento por feature | Gates do #368; QA visual do 02 |
| Overrides frágeis | Após migração, reavaliar `official-identity.css:264-315` (só 5 hex de texto) — podem tornar-se desnecessários | **P2** | 03 | Fase 3 concluída |
| Botão/Button.tsx etc. | Migrar `bg-[#0369a1]` residuais em primitivos | **P1** | 03 | Fase 3 |

## Fase 4 — Cobertura documental e motion comercial

| Frente | Ação | Prioridade | Responsável |
|---|---|---|---|
| Brandbook markdown consolidado | Sintetizar dos HTMLs oficiais uma versão MD canônica (gap-analysis) | **P1** | 11 |
| Manual de componentes completo | Documentar os ~95 componentes de `src/components/ui/` + layout + brand | **P2** | 03 + 11 |
| Motion comercial | Só após homologação da divisão 2-níveis (C6) | **P3** | 03 |
| Homologação V2 | Decisão humana sobre `identidade-visual/v2/` (C11) — pode reordenar tudo acima | **P1 decisão** | Humano |

## Dependências cruzadas (síntese)

```
Decisões humanas (Fase 0)
   ├─► Saneamento doc (Fase 1) ──► independente de código
   ├─► PR #368 (Fase 3) ──► gates verdes → QA visual → parecer 24
   ├─► Landings (Fase 2) ──► Onda C roadmap experiência + autorização pública
   └─► V2 (Fase 4) ──► pode substituir partes de Fases 1–3 se homologado
```

- Nada na Fase 1 exige código — pode começar imediatamente após alinhamento de propriedade.
- Fase 3 **não inicia** merge antes de QA visual registrado (handoff 00→03).
- Toda remoção de arquivo segue P3/§16 do AGENTS.md: confirmar propriedade e zero referências.
