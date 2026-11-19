# Decisões Pendentes — Brand System Birth Hub 360°

**Propósito:** detalhar as 12 pendências de decisão humana do §19 de `_FATOS-CANONICOS.md`, cada uma com contexto, evidências, opções, recomendação fundamentada, responsável pela decisão e impacto se adiada. **Nenhuma está decidida — todas permanecem PENDENTE.**

**Escopo:** apenas as pendências §19 + itens de segurança/governança correlatos. Não inclui decisões técnicas já delegadas a agentes.

**Estado da informação:** recomendações marcadas **[PROPOSTO]**; "quem decide" indica humano vs orquestrador vs especialista.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md` §§2,3,7,11–13,18,19; `identidade-visual/v2/FONTE-DE-VERDADE.md`; `docs/BrandConstitution.md`; MANUAL-MESTRE (pasta de trabalho); `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`.

**Documentos relacionados:** `../00-GOVERNANCA/conflitos-e-decisoes.md`, `backlog-priorizado.md`, `plano-de-implementacao.md`.

---

## D1 — Grafia oficial do nome — **PENDENTE**

- **Contexto:** três grafias vigentes simultaneamente: "Birth Hub 360°" (docs de trabalho), "Birthub 360°" (v2), `360º` em `src/config/brand.ts`. Proibidos: "BirthHub" junto, "Birthub360", "360 Hub", "Birth CRM" (MANUAL-MESTRE §1.1).
- **Evidências:** `_FATOS-CANONICOS.md` §2; `src/config/brand.ts`; `identidade-visual/v2/`.
- **Opções:** (a) "Birth Hub 360°"; (b) "Birthub 360°"; (c) manter `360º` ordinal.
- **Recomendação [PROPOSTO]:** "Birth Hub 360°" — mais legível, já é a grafia de trabalho, usa o símbolo ° da marca; unificar `brand.ts` e copy; identificadores de código (`BirthHub360`, `birthub360`) permanecem.
- **Quem decide:** **humano** (decisão de marca).
- **Impacto se adiado:** toda copy nova sai em grafia inconsistente; brandbook e i18n não podem ser congelados; SEO/compartilhamento com grafias divergentes.

## D2 — Contagem oficial de personagens/agentes — **PENDENTE**

- **Contexto:** 29 SVGs existem (9 avatares-pilar + 20 agentes no runtime), mas contagens citadas divergem: 20 / 24–26 / 29. Ratificação de "29 personagens" existe (2026-11-10/12), a contagem de "agentes" não.
- **Evidências:** `identidade-visual/birthhub360/characters/`; `src/features/characters/characterCatalogPillars.ts` + `characterCatalogAgents.ts`; handoffs `personagens-29-20261110`.
- **Opções:** (a) declarar "29 personagens visuais" e separar "agentes de IA" como conceito de produto; (b) fixar outro número.
- **Recomendação [PROPOSTO]:** (a) — distingue ativo visual de conceito de produto; evita retrabalho de catálogo.
- **Quem decide:** **humano** (marca) com validação do dono do módulo characters.
- **Impacto se adiada:** brandbook/manual de produto saem com números divergentes; confusão em material comercial.

## D3 — Mapeamento módulo→accent (`data-module`→`--module-accent`) — **PENDENTE**

- **Contexto:** proposta em `v2/06-matriz/`; `moduleThemes.ts` já existe com temas por módulo, mas o mapeamento proposto não foi homologado.
- **Evidências:** `src/components/layout/moduleRegistry.ts`, `moduleThemes.ts`; `identidade-visual/v2/06-matriz/`.
- **Opções:** (a) homologar mapeamento v2; (b) manter `moduleThemes.ts` atual e documentá-lo; (c) híbrido.
- **Recomendação [PROPOSTO]:** subordinado à decisão D9 (V2); se V2 for homologado, adotar mapeamento; senão, documentar o atual como oficial.
- **Quem decide:** **humano** (depende de D9).
- **Impacto se adiada:** superfícies de módulo sem acento consistente; impossível especificar "cor por módulo" em guias.

## D4 — Contraste do CTA gradiente em light — **PENDENTE**

- **Contexto:** `--grad-cta` (pink→cyan) medido ~3:1 em tema claro — abaixo do alvo para texto/controle AA.
- **Evidências:** `_FATOS-CANONICOS.md` §19.4; `birthhub360.css` light rampas; overrides `official-identity.css`.
- **Opções:** (a) ajustar stops do gradiente em light; (b) fallback de cor sólida AA para CTA em light; (c) aceitar e documentar exceção.
- **Recomendação [PROPOSTO]:** (b) — preservar a assinatura do gradiente em dark e usar superfície sólida AA em light para CTA com texto; decisão visual final é humana.
- **Quem decide:** **humano** para o ajuste visual; Agente 03 mede e propõe.
- **Impacto se adiada:** risco WCAG AA ativo em CTAs do tema claro; auditoria de contraste bloqueará conformidade.

## D5 — Destino de CSS morto, `landing/`, `landing-page.html`, docs navy/gold — **PENDENTE**

- **Contexto:** mortos sem import: `src/index.css`, `elegance.css`, `luxury-tokens.css`; vivos divergentes: `landing/` (Cabin/Plex Mono/zinc/`#d4af37`), `landing-page.html` (navy/gold + Google Fonts CDN); docs obsoletos sem marcação.
- **Evidências:** `_FATOS-CANONICOS.md` §12; `.agents/experience/05-roadmap.md` Onda C/E.
- **Opções:** (a) arquivar mortos + banner superseded nos docs + canonizar landings em `Landing360`; (b) remoção física de tudo; (c) status quo.
- **Recomendação [PROPOSTO]:** (a) — arquivar preserva histórico; landings seguem Onda C (canonização) e Onda E (landing exige autorização humana por ser superfície pública).
- **Quem decide:** **00** para docs/código dentro da governança; **humano** para tocar superfície pública de landing.
- **Impacto se adiada:** agentes continuam lendo autoridade errada; resíduo navy/gold e laranja servidos publicamente; dívida só cresce.

## D6 — Destino do PR #368 e convergência com PR #310 — **PENDENTE**

- **Contexto:** PR #368 (migração hex→var(), ~100 arquivos, +7768/−2238) OPEN com 5 gates vermelhos; decisão 00 de não integrar no estado atual; worktree `wt-368-rebase` em diagnóstico; PR #310 citado para convergência.
- **Evidências:** `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`; `gh pr checks 368`.
- **Opções:** (a) remediar gates → QA visual → parecer 24 → merge; (b) fatiar migração por feature/domínio; (c) abandonar #368 e refazer incrementalmente; (d) merge parcial.
- **Recomendação [PROPOSTO]:** (b) ou sequência de (a) com QA visual completo — blast radius de +7768 linhas em 100 arquivos é alto; fatiar reduz risco e permite gates por domínio. Decisão final após diagnóstico dos gates.
- **Quem decide:** **00** (integração) com **24** (parecer) e alinhamento humano se houver mudança de escopo de marca.
- **Impacto se adiada:** 2039 hex + 1275 classes arbitrárias permanecem; overrides frágeis seguem; cada novo código aumenta a dívida.

## D7 — Light canvas `#F4F7FB` vs `#F8FAFC` — **PENDENTE**

- **Contexto:** runtime e PWA usam `#F4F7FB`; `DESIGN.md` e resíduos citam `#F8FAFC`.
- **Evidências:** `globals.css`, PWA manifest `theme_color`, `birthhub360.css:119-186`.
- **Opções:** (a) ratificar `#F4F7FB`; (b) migrar para `#F8FAFC`; (c) outro valor.
- **Recomendação [PROPOSTO]:** (a) — já está em produção e no manifest; corrigir `DESIGN.md`.
- **Quem decide:** **humano** (ratificação de valor de marca).
- **Impacto se adiada:** screenshots/goldens e docs divergem do runtime; confusão em novas implementações.

## D8 — `BirthHubLogo.tsx` orbit5 vs Neon; logos legados divergentes — **PENDENTE**

- **Contexto:** componente React usa paleta orbit5 (navy/gold/orbit) divergente do Neon; `BirthubLogo.tsx`/`Birthub360Logo.tsx`/`brand (1).ts` legados divergentes; SVGs mestres navy/gold foram preservados por determinação do usuário.
- **Evidências:** `src/components/brand/BirthHubLogo.tsx`; `identidade-visual/birthhub360/logos/*.svg`; `04_ASSETS_VISUAIS/` (Neon animado).
- **Opções:** (a) confirmar orbit5 como intencional e documentar exceção; (b) migrar componente para Neon; (c) híbrido (Neon em produto, orbit5 só em contextos específicos).
- **Recomendação [PROPOSTO]:** (b) para superfícies de produto; preservar SVGs mestres navy/gold apenas se o usuário reconfirmar a determinação original — a existência de versões Neon animadas sugere transição já iniciada.
- **Quem decide:** **humano** (a preservação anterior foi determinação explícita).
- **Impacto se adiada:** logo divergente renderizado em superfícies autenticadas; risco de o usuário descobrir inconsistência em demo.

## D9 — Homologação do sistema V2 — **PENDENTE**

- **Contexto:** `identidade-visual/v2/` completo (brandbook HTML, DS tokens, motion 2-níveis, componentes, matriz) produzido em 2026-11-13/14; NÃO homologado.
- **Evidências:** `identidade-visual/v2/`; `_FATOS-CANONICOS.md` §1 item 13.
- **Opções:** (a) homologar integralmente; (b) homologar parcialmente (adotar seções); (c) rejeitar/arquivar como referência; (d) manter em observação.
- **Recomendação [PROPOSTO]:** submeter a revisão do Agente 24 + decisão humana; se homologado parcialmente, este brand-system vira camada documental sobre o V2. **Não produzir documentação paralela antes dessa decisão** — evita 4ª fonte divergente.
- **Quem decide:** **humano** (com revisão 24).
- **Impacto se adiada:** todos os gaps documentais (brandbook MD, manual de componentes, motion comercial) ficam bloqueados ou geram trabalho duplicado.

## D10 — Área de proteção/mínimos do logo — **PENDENTE**

- **Contexto:** Manual Mestre: 30% de área de proteção, mínimos 140px/24px; BrandConstitution: 1/4 do raio, 96px/32px.
- **Evidências:** MANUAL-MESTRE; `docs/BrandConstitution.md`.
- **Opções:** (a) adotar Manual Mestre; (b) adotar BrandConstitution; (c) adotar o mais restritivo dos dois.
- **Recomendação [PROPOSTO]:** (c) — maior proteção e maior mínimo; unificar em fonte única.
- **Quem decide:** **humano** (norma de marca).
- **Impacto se adiada:** aplicações de logo inconsistentes por designers/agências; sem base para checklist de revisão.

## D11 — Motion em 2 níveis (Comercial/Operacional) — **PENDENTE**

- **Contexto:** divisão proposta em `v2/04-motion/` e FONTE-DE-VERDADE §7; implementação atual só tem nível operacional (`src/lib/motion.ts`).
- **Evidências:** `_FATOS-CANONICOS.md` §7; `identidade-visual/v2/04-motion/`.
- **Opções:** (a) homologar 2 níveis; (b) manter 1 nível e documentar; (c) adiar para pós-V2.
- **Recomendação [PROPOSTO]:** (c) — depende de D9; sem homologação V2 não há base para o nível comercial.
- **Quem decide:** **humano** (junto a D9).
- **Impacto se adiada:** material comercial/landing sem linguagem de motion própria; não bloqueia produto.

## D12 — `.env` em `05_TOKENS_E_TEMAS/` (possível segredo) — **PENDENTE (segurança)**

- **Contexto:** arquivo `.env` na pasta de trabalho `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/` pode conter segredo; NÃO VERIFICADO por segurança.
- **Evidências:** `_FATOS-CANONICOS.md` §19.12.
- **Opções:** (a) verificar se está versionado e conter segredo real → rotacionar via processo do Agente 15; (b) falso positivo.
- **Recomendação [PROPOSTO]:** reportar imediatamente ao 15/00; não copiar conteúdo; verificar `.gitignore` e histórico.
- **Quem decide:** **Agente 15** (segurança) + **00**; rotação segue processo do 15.
- **Impacto se adiada:** risco de segredo exposto em repositório/pasta de trabalho; incidente LGPD-adjacente se contiver dado pessoal.

---

## Síntese

| # | Decisão | Prioridade | Quem decide | Desbloqueia |
|---|---|---|---|---|
| D12 | `.env`/segredo | **P0** | 15/00 | Segurança |
| D1 | Grafia | **P0** | Humano | Copy, brandbook, i18n |
| D5 | CSS morto/docs/landings | **P0/P1** | 00 + humano (landing) | Clareza doc, conformidade |
| D6 | PR #368 | **P0** | 00/24 | Migração de cores |
| D9 | V2 | **P1** | Humano | D3, D11, gaps documentais |
| D8 | Logo orbit5 | **P1** | Humano | Assets oficiais |
| D2 | Contagem personagens | **P1** | Humano | Brandbook/manual |
| D10 | Área de proteção | **P1** | Humano | Checklist de aplicação |
| D7 | Light canvas | **P2** | Humano | Consistência doc↔runtime |
| D4 | Contraste CTA light | **P2** | Humano (03 mede) | WCAG AA |
| D3 | Módulo→accent | **P2** | Humano (após D9) | Especificação por módulo |
| D11 | Motion 2 níveis | **P3** | Humano (após D9) | Material comercial |
