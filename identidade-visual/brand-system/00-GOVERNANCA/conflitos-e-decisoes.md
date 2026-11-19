# Conflitos e Decisões — Brand System Birth Hub 360°

**Propósito:** consolidar em uma única matriz todos os conflitos de identidade/design encontrados na auditoria, com fontes envolvidas, impacto de cada alternativa e recomendação — separando o que já tem decisão oficial do que depende de aprovação humana.

**Escopo:** conflitos entre documentos, código, tokens, ativos e propostas; inclui as 12 pendências do §19 de `_FATOS-CANONICOS.md` e conflitos adicionais identificados nesta onda. Não resolve nenhuma pendência — apenas estrutura a decisão.

**Estado da informação:** itens marcados **PENDENTE** exigem decisão humana/orquestrador; itens **DECIDIDO** citam a decisão oficial existente. Recomendações são **[PROPOSTO]**.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md` §§12, 18, 19; `identidade-visual/v2/FONTE-DE-VERDADE.md`; `identidade-visual/README.md`; `docs/BrandConstitution.md`; `MANUAL-MESTRE` (pasta de trabalho); `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`; `.agents/experience/05-roadmap.md`.

**Documentos relacionados:** `matriz-de-evidencias.md`, `inventario-de-fontes.md`, `../09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md`, `../09-PLANO-DE-EVOLUCAO/backlog-priorizado.md`.

---

## Legenda

- **Fontes:** identificadores curtos — ver `inventario-de-fontes.md` para caminhos completos.
- **Decisão oficial?** EXISTE (cite) / NÃO EXISTE.
- **Depende de aprovação humana?** SIM = bloqueia até decisão; NÃO = pode ser tratado por agente dentro da governança.

---

## Matriz de conflitos

### C1 — Grafia oficial do nome — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | "Birth Hub 360°" (trabalho/docs), "Birthub 360°" (v2), `360º` em `src/config/brand.ts`, proibidos "BirthHub"/"Birthub360"/"360 Hub"/"Birth CRM" (MANUAL-MESTRE §1.1) |
| Implementação atual | `brand.ts` usa `Birthub 360º`; código usa `BirthHub360`/`birthub360` em identificadores |
| Decisão oficial? | **NÃO EXISTE** — três grafias vigentes simultaneamente |
| Impacto alternativa A ("Birth Hub 360°") | Alinha docs de trabalho e legibilidade; exige varrer copy/`brand.ts`/i18n |
| Impacto alternativa B ("Birthub 360°") | Alinha com v2; mas "Birthub" já é grafia proibida como nome junto — risco de confusão |
| Impacto alternativa C (manter `360º`) | Diverge do símbolo ° usado na marca; inconsistente com `360°` dos manuais |
| Recomendação **[PROPOSTO]** | "Birth Hub 360°" com símbolo °; unificar `brand.ts` e copy; manter identificadores de código intactos |
| Confiança | Alta na divergência; média na recomendação (decisão de marca é humana) |
| Depende de aprovação humana? | **SIM** — decisão de marca (§19.1) |

### C2 — Paleta oficial: Neon (vigente) vs PR #368 vs paletas históricas — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | Neon homologada 2026-10-11 (`MODERNIZACAO-UI-ONDA-A.md` §8, handoff `00-para-11-decisao-paleta-oficial.md`, merge `36d097a17`); PR #368 `agente/00-paleta-oficial-migração`; navy/gold (`docs/design/*`, `landing-page.html`); laranja `#FF5618` (aposentado 09/2026); orbit5 (`BirthHubLogo.tsx`); elegância champagne (`elegance.css`) |
| Implementação atual | Neon é a paleta de runtime (`globals.css`, tokens). #368 propõe migrar 2039 hex→var() mas está OPEN com 5 gates vermelhos; decisão 00: **não integra** até remediação (handoff `00-para-03-paleta-pr368-gates-vermelhos.md`) |
| Decisão oficial? | **EXISTE** — Neon homologada. O que falta é decidir o destino do #368 e dos resíduos |
| Impacto alternativa A (integrar #368 após gates verdes) | Converge dívida hex→tokens; risco de regressão visual em massa (+7768/−2238) |
| Impacto alternativa B (rejeitar #368 e fatiar migração por feature) | Menor blast radius; mais lento; compatível com Onda C do roadmap de experiência |
| Impacto alternativa C (manter status quo) | Dívida de hardcoded colors permanece; overrides parciais em `official-identity.css:264-315` seguem sendo mitigação frágil |
| Recomendação **[PROPOSTO]** | Não integrar #368 no estado atual (já decidido pelo 00); após gates verdes + QA visual + parecer 24, avaliar merge ou fatiamento; convergir com PR #310 |
| Confiança | Alta |
| Depende de aprovação humana? | **SIM** para merge do PR (§19.6); a remediação dos gates é técnica (Agente 03/00) |

### C3 — Contagem oficial de personagens/agentes — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | 29 SVGs em `identidade-visual/birthhub360/characters/`; runtime `characterCatalogPillars.ts` (9) + `characterCatalogAgents.ts` (20) = 29; contagens divergentes citadas: 20 / 24–26 / 29 |
| Implementação atual | 29 personagens implementados; docs divergem sobre o número "oficial de agentes" |
| Decisão oficial? | **NÃO EXISTE** — ratificação de 29 personagens existe (2026-11-10/12), mas a contagem de "agentes" não foi unificada |
| Impacto | Afeta copy institucional, brandbook, catálogo de personas e eventuais contagens em marketing |
| Recomendação **[PROPOSTO]** | Distinguir "29 personagens visuais" (9 avatares-pilar + 20 agentes) de "N agentes de IA" (conceito de produto, não de marca) |
| Confiança | Média-alta |
| Depende de aprovação humana? | **SIM** (§19.2) |

### C4 — Grafia/área de proteção do logo — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | MANUAL-MESTRE: área de proteção 30%, mínimos 140px/24px; `docs/BrandConstitution.md`: 1/4 do raio, 96px/32px |
| Implementação atual | Nenhum dos dois é enforcement em código; ambos são norma escrita divergente |
| Decisão oficial? | **NÃO EXISTE** — duas normas vigentes |
| Impacto | Guideline de aplicação do logo; risco de aplicação inconsistente por designers/agências |
| Recomendação **[PROPOSTO]** | Adotar o mais restritivo (maior área de proteção) até homologação; unificar em um único documento-fonte |
| Confiança | Média |
| Depende de aprovação humana? | **SIM** (§19.10) |

### C5 — Light canvas `#F4F7FB` vs `#F8FAFC` — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `birthhub360.css`/`globals.css` (canônico V2 `#F4F7FB`); `DESIGN.md` e resíduos legados (`#F8FAFC`) |
| Implementação atual | PWA manifest usa `theme_color #F4F7FB`; `globals.css` é runtime real |
| Decisão oficial? | **PARCIAL** — `#F4F7FB` é o valor em produção, mas consta como divergência registrada |
| Impacto | Baixo funcionalmente; relevante para consistência doc↔código e screenshots de referência |
| Recomendação **[PROPOSTO]** | Ratificar `#F4F7FB` (já em runtime e PWA) e corrigir `DESIGN.md` |
| Confiança | Alta |
| Depende de aprovação humana? | **SIM** (§19.7) — embora a evidência operacional favoreça um lado |

### C6 — Motion em 2 níveis (Comercial/Operacional) — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `identidade-visual/v2/04-motion/` + FONTE-DE-VERDADE §7 (proposta); `src/lib/motion.ts` (implementação atual = só operacional) |
| Implementação atual | Nível operacional CONFIRMADO; comercial não existe em código |
| Decisão oficial? | **NÃO EXISTE** — proposta v2 não homologada |
| Impacto | Se homologado, exige novas variants, guia de uso e possivelmente tokens adicionais |
| Recomendação **[PROPOSTO]** | Tratar como pós-v2; não bloqueia conformidade atual |
| Confiança | Alta |
| Depende de aprovação humana? | **SIM** (§19.11, junto à homologação v2 §19.9) |

### C7 — Mapeamento módulo→accent (`data-module`→`--module-accent`) — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | Proposta em `v2/06-matriz/`; `moduleRegistry.ts` + `moduleThemes.ts` atuais |
| Implementação atual | `moduleThemes.ts` existe; o mapeamento proposto em v2 não está homologado |
| Decisão oficial? | **NÃO EXISTE** |
| Impacto | Afeta cor de acento por módulo nas superfícies; depende da homologação v2 |
| Recomendação **[PROPOSTO]** | Subordinado à decisão C-v2 (homologar ou não o sistema V2) |
| Confiança | Média |
| Depende de aprovação humana? | **SIM** (§19.3) |

### C8 — Contraste do CTA gradiente em light (~3:1) — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `--grad-cta` (pink→cyan) implementado; avaliação de contraste em light aponta ~3:1 |
| Implementação atual | Gradiente em produção; ajustes propostos em v2 |
| Decisão oficial? | **NÃO EXISTE** para o ajuste |
| Impacto | Risco WCAG AA em botões CTA no tema claro |
| Recomendação **[PROPOSTO]** | Avaliar ajuste de stops ou fallback de cor sólida para texto/CTA em light; validar com auditoria de contraste |
| Confiança | Média-alta |
| Depende de aprovação humana? | **SIM** para mudar a assinatura visual (§19.4); a medição pode ser feita por agente |

### C9 — CSS morto e identidades concorrentes — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | Mortos sem import: `src/index.css`, `src/styles/elegance.css`, `src/styles/luxury-tokens.css`; vivos divergentes: `landing/`, `landing-page.html`, `src/features/prospecting/outbound/`, `voice-hub/design-system/`, `docs/design/*`, `docs/DESIGN_SYSTEM.md`, `docs/strategy/DESIGN-playbook.md`, `.claude/CLAUDE.md`, `.claude/skills/design-system/SKILL.md`, `.agents/skills/birthhub-*` |
| Implementação atual | Mortos confirmados por ausência de import; divergentes ainda servidos/rotados |
| Decisão oficial? | **NÃO EXISTE** — nenhuma marcação de superseded foi feita |
| Impacto alternativas | (a) Remover/arquivar mortos: baixo risco, alto ganho de clareza. (b) Marcar docs obsoletos com banner "SUPERSEDED → ver brand-system": preserva histórico. (c) Status quo: novas sessões/agentes continuam lendo autoridade errada (já observado: skills apontam para DESIGN-LANGUAGE obsoleto) |
| Recomendação **[PROPOSTO]** | Arquivar CSS morto; banner superseded nos docs navy/gold; corrigir ponteiros em `.claude/CLAUDE.md`, skills e `.agents/skills/birthhub-*` para este brand-system; destino de `landing/`/`landing-page.html` segue Onda C/E do roadmap de experiência |
| Confiança | Alta |
| Depende de aprovação humana? | **PARCIAL** — remoção de arquivos e edição de `.claude/`/`.agents/skills/` exigem alinhamento com donos (§15 AGENTS.md); decisão de destino das landings é do 00/02 |

### C10 — `BirthHubLogo.tsx` orbit5 vs Neon; logos legados divergentes — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `src/components/brand/BirthHubLogo.tsx` (orbit5 `#D4AF37→#FF3158→#FF4FA3→#7C3AED→#1677FF→#9C5A7E`, núcleo `#0B132B`); `BirthubLogo.tsx`/`Birthub360Logo.tsx`/`brand (1).ts` (paleta divergente); SVGs mestres navy/gold "preservados por determinação do usuário" |
| Implementação atual | Componente em uso renderiza paleta divergente do Neon |
| Decisão oficial? | **PARCIAL** — SVGs mestres navy/gold foram preservados por determinação do usuário; não há decisão sobre o componente React |
| Impacto | Logo divergente em superfícies autenticadas e possivelmente públicas |
| Recomendação **[PROPOSTO]** | Confirmar com o usuário se orbit5 é intencional; se não, migrar `BirthHubLogo.tsx` para tokens Neon e depreciar `BirthubLogo.tsx`/`Birthub360Logo.tsx` |
| Confiança | Média |
| Depende de aprovação humana? | **SIM** (§19.8) — a preservação navy/gold foi determinação explícita do usuário |

### C11 — Homologação do sistema V2 — **PENDENTE**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `identidade-visual/v2/` completo (brandbook HTML, DS tokens, motion, componentes, matriz); `_FATOS-CANONICOS.md` classifica como proposta avançada |
| Implementação atual | V2 não homologado; produção segue tokens birthhub360 + globals.css |
| Decisão oficial? | **NÃO EXISTE** |
| Impacto | Se homologado, pode substituir/subsidiar partes deste brand-system e da implementação; se rejeitado, vira arquivo histórico |
| Recomendação **[PROPOSTO]** | Submeter v2 a revisão do Agente 24 + decisão humana antes de qualquer adoção; até lá, citar como proposta |
| Confiança | Alta |
| Depende de aprovação humana? | **SIM** (§19.9) |

### C12 — Destino do PR #368 — **PENDENTE** (detalhado em C2; registrado aqui por ser decisão de integração)

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | PR #368 OPEN, 5 gates vermelhos; decisão 00 de não integrar; worktree `wt-368-rebase`; convergência com PR #310 citada |
| Decisão oficial? | **EXISTE parcial** — 00 decidiu não integrar no estado atual; destino final (merge após remediação vs fatiar vs abandonar) aberto |
| Depende de aprovação humana? | Merge exige parecer 24 + alinhamento 00; **SIM** para fechamento (§19.6) |

### C13 — `.env` com possível segredo em `05_TOKENS_E_TEMAS/` — **PENDENTE (segurança)**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/.env` |
| Implementação atual | NÃO VERIFICADO — não lido por segurança |
| Decisão oficial? | **NÃO EXISTE** |
| Impacto | Se contiver segredo real, é incidente de segurança/LGPD-adjacente a reportar |
| Recomendação **[PROPOSTO]** | Reportar ao Agente 15 (rotação de segredos) e ao 00; não copiar conteúdo para docs; verificar se a pasta está sob versionamento |
| Confiança | Alta quanto ao risco; conteúdo desconhecido |
| Depende de aprovação humana? | Não para reportar; rotação depende do processo do 15 |

### C14 — Governança: docs/skills apontando para autoridade errada — **CONFLITO ATIVO**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `.agents/skills/birthhub-*` declaram `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` como "autoridade visual máxima"; `.claude/CLAUDE.md` descreve paleta navy/gold e trata `birthhub360/` como identidade anterior; este brand-system é a nova referência documental |
| Implementação atual | Skills ativas apontam para doc obsoleto — risco de agentes gerarem UI fora da marca |
| Decisão oficial? | **NÃO EXISTE** para redirecionar os ponteiros |
| Impacto | Alto — cada sessão de agente pode ler a autoridade errada (P1/P7 do AGENTS.md) |
| Recomendação **[PROPOSTO]** | Atualizar ponteiros em skills/CLAUDE.md para `identidade-visual/brand-system/` + `v2/FONTE-DE-VERDADE.md`; marcar DESIGN-LANGUAGE como superseded |
| Confiança | Alta |
| Depende de aprovação humana? | Edição de `.agents/prompts/**` é decisão humana; skills em `.agents/skills/` e `.claude/` precisam de alinhamento com o 00 — **SIM** |

### C15 — i18n parcial vs marca monolíngue — **PENDENTE (baixo)**

| Campo | Conteúdo |
|---|---|
| Fontes envolvidas | `src/i18n/index.tsx` ~60 strings; restante da UI hardcoded pt-BR |
| Implementação atual | i18n mínimo operacional |
| Decisão oficial? | **NÃO EXISTE** sobre escopo de i18n da marca |
| Impacto | Baixo para identidade; relevante para expansão de mercado |
| Recomendação **[PROPOSTO]** | Fora do escopo do brand-system; registrar como dívida de produto |
| Confiança | Alta |
| Depende de aprovação humana? | **SIM** se priorizado |

---

## Resumo de prioridade de decisão

| # | Conflito | Prioridade sugerida | Dono da decisão |
|---|---|---|---|
| C1 | Grafia oficial | **P0** | Humano (marca) |
| C2/C12 | Paleta Neon × PR #368 × resíduos | **P0** | 00/03/24 + humano para merge |
| C9 | CSS morto + docs obsoletos + ponteiros de skills | **P0/P1** | 00 + donos de arquivo |
| C14 | Autoridade visual apontada por skills | **P0** | Humano (prompts) / 00 |
| C11 | Homologação V2 | **P1** | Humano |
| C10 | Logo orbit5 vs Neon | **P1** | Humano |
| C3 | Contagem de personagens | **P1** | Humano |
| C4 | Área de proteção do logo | **P1** | Humano |
| C5 | Light canvas | **P2** | Humano (ratificação) |
| C6/C7 | Motion 2 níveis / módulo→accent | **P2** | Humano (v2) |
| C8 | Contraste CTA light | **P2** | 03 mede; humano decide ajuste visual |
| C13 | `.env` possível segredo | **P0 (segurança)** | 15/00 — reportar imediatamente |
| C15 | i18n | **P3** | Produto |
