# Backlog Priorizado — Conformidade do Brand System

**Propósito:** transformar as inconsistências auditadas em um backlog priorizado (P0–P3) com justificativa, pronto para virar missões de agentes.

**Escopo:** apenas itens de marca/design/documentação/governança visual. Débitos funcionais de UX estão em `.agents/runs/audit-2026-11-18/` e no roadmap de experiência — não duplicados aqui.

**Estado da informação:** prioridades **[PROPOSTO]** derivadas de `auditoria-de-inconsistencias.md` e `conflitos-e-decisoes.md`; itens que dependem de decisão humana estão marcados **PENDENTE-DECISÃO**.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md`; `identidade-visual/v2/01-auditoria/matriz-conformidade.md`; `.agents/experience/05-roadmap.md`; handoff PR #368.

**Documentos relacionados:** `decisoes-pendentes.md`, `plano-de-implementacao.md`, `auditoria-de-inconsistencias.md`, `../00-GOVERNANCA/roadmap-de-conformidade.md`.

**Legenda:** P0 = bloqueia conformidade/segurança/decisões · P1 = alto impacto, executar em seguida · P2 = importante, após P0/P1 · P3 = melhoria contínua. Responsáveis conforme AGENTS.md §15.

---

## P0 — Bloqueadores

| ID | Item | Justificativa | Responsável | Depende de |
|---|---|---|---|---|
| P0-01 | **Reportar `.env` em `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/`** | Possível segredo exposto; não verificado | 15 + 00 | Nenhuma — executar já |
| P0-02 | **Decisão de grafia oficial** (D1) | Três grafias vigentes; todo output novo sai inconsistente | **Humano** | Nenhuma |
| P0-03 | **Decidir destino do PR #368** (D6): remediar gates no `wt-368-rebase` → QA visual → parecer 24 → merge/fatiar/abandonar | 5 gates vermelhos; decisão 00 de não integrar; 2039 hex em dívida | 00 + 03 (diagnóstico) + 24 | Diagnóstico técnico primeiro; merge depende de QA |
| P0-04 | **Marcar docs obsoletos como SUPERSEDED** (`docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`, `docs/strategy/DESIGN-playbook.md`) | Docs navy/gold/Bodoni ativos sem marcação; skills apontam para eles como autoridade | 08 (docs/**) + 24 | Alinhamento 00 |
| P0-05 | **Corrigir `.claude/CLAUDE.md` e skills desatualizadas** | Descrevem paleta navy/gold e tratam `birthhub360/` como identidade anterior — invertido; `.agents/skills/birthhub-*` apontam "autoridade máxima" para doc obsoleto | Humano (prompts) / 00 / dono dos arquivos | Decisão de autoridade visual |
| P0-06 | **Remover/aposentar resíduo laranja `#FF5618`** em `public/tools/social-selling/` | Marca aposentada em 09/2026 ainda servida em `/tools` | 11/02 | Confirmar rotas |

## P1 — Alto impacto

| ID | Item | Justificativa | Responsável | Depende de |
|---|---|---|---|---|
| P1-01 | **Arquivar CSS morto** (`src/index.css`, `elegance.css`, `luxury-tokens.css`) após confirmar zero imports | Paletas fantasma confunde buscas e novas sessões | 03 | Confirmar imports |
| P1-02 | **Migrar hardcoded colors** — se #368 integrado: QA visual completo (desktop/mobile × light/dark + gráficos); se fatiado: priorizar `Landing360.tsx` (125), `NewLoginScreen.tsx` (39), `landing/luxury Act*.tsx` (~200) | Maior dívida mensurada: 2039 hex + 1275 classes arbitrárias | 03 | P0-03 |
| P1-03 | **Convergir `voice-hub/design-system/`** hex residuais para cadeia canônica (TOKEN-AUDIT) | Segundo DS divergente | 03C | Onda C experiência |
| P1-04 | **Decidir `BirthHubLogo.tsx` orbit5 vs Neon** (D8) e depreciar `BirthubLogo.tsx`/`Birthub360Logo.tsx` | Logo divergente em superfícies autenticadas | Humano decide; 03/11 executam | Decisão humana |
| P1-05 | **Promover logos Neon oficiais** dos SVGs mestres navy/gold (se confirmado) | Mestres divergem das versões animadas Neon | 11 | P1-04 + confirmação usuário |
| P1-06 | **Decidir contagem oficial de personagens** (D2) e área de proteção do logo (D10) | Brandbook/manual não podem congelar números/normas divergentes | Humano | Nenhuma |
| P1-07 | **Submeter `identidade-visual/v2/` a revisão 24 + decisão humana** (D9) | V2 é candidato a preencher maioria dos gaps documentais; produzir docs paralelos antes disso gera 4ª fonte divergente | 24 + Humano | Nenhuma |
| P1-08 | **Canonizar landings**: `Landing360` é canônica; decidir `Landing360Impeccable` (não roteada), `/landing-new`→`LandingInnovative`, `landing/`+`landing-page.html` | Múltiplas landings divergentes vivas | 02 + 11 (+12 para LandingInnovative) | Onda C experiência; autorização humana p/ superfície pública |
| P1-09 | **Criar brandbook markdown consolidado** a partir dos HTMLs oficiais (após P1-07) | Versão MD versionada no repo não existe | 11 | P1-07 |

## P2 — Importante

| ID | Item | Justificativa | Responsável | Depende de |
|---|---|---|---|---|
| P2-01 | **Ratificar light canvas `#F4F7FB`** e corrigir `DESIGN.md` (D7) | Doc diverge do runtime/PWA | Humano ratifica; 03/11 corrigem | Decisão humana |
| P2-02 | **Medir e propor correção do contraste CTA light** (D4) | ~3:1 sinalizado; WCAG AA | 03 mede; humano decide ajuste | Nenhuma p/ medir |
| P2-03 | **Manual de componentes completo** (~95 ui + layout + brand) | Catálogo cobre 30; Storybook só 3 stories | 03 + 11 | P1-07 (v2 pode suprir) |
| P2-04 | **Governança de tokens**: documento de regras (naming, depreciação, quem cria) + avaliação de lint anti-hex | Sem regra formal; dívida volta a crescer | 03 + 23 | P0-03 |
| P2-05 | **Convergir `prospecting/outbound/`** para tokens canônicos ou registrar exceção justificada | Sub-app quase standalone com design próprio | Dono módulo + 03 | Matriz de propriedade |
| P2-06 | **Auditoria WCAG 2.2 AA atual** pós-Neon (contraste, foco, targets) | Última evidência é 2026-10-17/18; débitos UX já mapeados | 03 + 08 | P2-01, P2-02 |
| P2-07 | **Reconciliar baseline visual**: 11 snapshots divergentes `visual.spec.ts` + drift `tests/AGENTS.md` §6 | Regressão visual não verificável com baseline honesto | 08/14 | Onda F experiência |
| P2-08 | **Guia de aplicação da marca para agentes** ("como aplicar em código") consolidando DESIGN.md + brand-system + tokens | Info fragmentada; skills apontam errado | 11 + 03 | P0-05 |
| P2-09 | **Limpar `public/fonts/brand/`** (Nunito/Outfit/Plus Jakarta legadas não referenciadas) | Fontes proibidas/legadas servidas | 11 | Confirmar zero refs |
| P2-10 | **Decidir mapeamento módulo→accent** (D3) | Especificação por módulo impossível sem isso | Humano | P1-07 (D9) |

## P3 — Melhoria contínua

| ID | Item | Justificativa | Responsável |
|---|---|---|---|
| P3-01 | **Motion comercial / divisão 2 níveis** (D11) | Proposta v2; só após homologação | 03 + Humano |
| P3-02 | **Kit de aplicação completo** (og-images, social, email, docs) | Parcial hoje | 11 |
| P3-03 | **Especificações de domínio** (accent/personagens/microcopy por módulo) | Depende de D3 e glossário | 11 + donos |
| P3-04 | **i18n de microcopy de marca** | ~60 strings; resto hardcoded pt-BR | Produto/02 |
| P3-05 | **ADR de marca** (registrar decisões D1–D12 quando tomadas) | Este brand-system cobre parcialmente | 11/00 |
| P3-06 | **Gate de conformidade visual no CI** (zero hex fora de tokens) | Previne reincidência da dívida | 03/16/08 |
| P3-07 | **Storybook completo** dos componentes ui/ | Só 3 stories hoje | 03 |

## Regras de execução

1. **P0-01 e P0-05 parcial** podem iniciar imediatamente (reportar segredo; preparar correções de docs após alinhamento).
2. **P0-02, P1-04, P1-06, P2-01, P2-10** são bloqueadas por decisão humana — preparar pacotes de decisão (este documento + `decisoes-pendentes.md`) para o usuário.
3. **P0-03 → P1-02**: a migração de cores só avança após destino do #368; fatiamento por domínio segue matriz de propriedade.
4. **P1-07** é o desbloqueador maior de conteúdo: decidir V2 antes de produzir brandbook/manual paralelos.
5. Toda execução segue gates do AGENTS.md §28 (tsc/lint/testes + parecer 24 para merge).
