# Gap Analysis — Brand System Birth Hub 360°

**Propósito:** mapear o que a documentação e a marca já possuem versus o que falta para um brand system completo, verificável e governado.

**Escopo:** cobertura documental (brandbook, manuais, guias, tokens, motion, componentes), governança de tokens, acessibilidade e evidências de conformidade. Não mede qualidade estética — mede **existência e completude**.

**Estado da informação:** gaps marcados **[PROPOSTO]** quando a necessidade é recomendação; "existe" sempre cita evidência.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md` §§1–16; `identidade-visual/README.md`; `identidade-visual/v2/` (proposta); `docs/BrandConstitution.md`; `DESIGN.md`; `.agents/experience/05-roadmap.md`.

**Documentos relacionados:** `auditoria-de-inconsistencias.md`, `decisoes-pendentes.md`, `backlog-priorizado.md`, `plano-de-implementacao.md`, `../00-GOVERNANCA/matriz-de-evidencias.md`.

---

## 1. O que já existe (coberto)

| Área | Cobertura atual | Evidência |
|---|---|---|
| Paleta Neon dark/light | Tokens completos + runtime | `birthhub360.css:9-186`, `globals.css`, `official-identity.css` |
| Gradientes/efeitos de assinatura | Tokens + utilitários CSS | `--grad-brand/cta/vancouver/orbit`, `.bh-*`, `.vancouver-*` |
| Geometria (raios, espaçamento, sombras, foco) | Documentada e implementada | `_FATOS-CANONICOS.md` §6; tokens |
| Tipografia trinca | Fontes self-hosted + regras de uso e proibições | `globals.css:12-198`, `public/fonts/`, MANUAL-MESTRE §3.1 |
| Motion operacional | Implementação rica + tokens | `src/lib/motion.ts`, variants, hooks a11y |
| Posicionamento/voz/valores | Documentados | FONTE-DE-VERDADE §2, BrandConstitution, PRODUCT.md |
| Arquitetura de módulos | Registro canônico | `moduleRegistry.ts`, catálogo CSV, jornadas J01–J20 |
| Ativos (logos, personagens, ícones) | SVGs + espelhos public/ + runtime | `identidade-visual/birthhub360/`, `public/brand/`, `src/features/characters/` |
| HTMLs oficiais de marca | Brandbook + manuais entregues | `DOCUMENTOS/IDENTIDADE-VISUAL/` (ordem em `identidade-visual/README.md`) |
| Tokens machine-readable | CSS + JSON + TS | `birthhub360.{css,json,ts}`, `characters.{css,json,ts}` |
| Governança de agentes | Completa | `AGENTS.md`, handoffs, gates |
| Proposta V2 completa | brandbook, DS, motion, componentes, matriz | `identidade-visual/v2/` — **não homologada** |

## 2. Gaps — o que falta

### G1. Consolidação documental (prioridade alta)

| Gap | Situação | Evidência da falta |
|---|---|---|
| Brandbook em markdown canônico | Existe em HTML oficial + proposta v2; **não há versão MD consolidada e versionada no repo** | `DOCUMENTOS/…` é HTML fora do repo; `v2/02-brandbook/` é proposta não homologada |
| Manual de componentes completo | Catálogo cobre 30 de ~95+ componentes; sem especificação de props/estados/anatomia por componente | §8 dos fatos; só 3 stories Storybook |
| Manual de motion | Implementação existe; **não há guia de uso por contexto** (quando usar cada variant/easing); divisão comercial é proposta | §7; `v2/04-motion/` não homologado |
| Guia para agentes ("20 agentes" ou equivalente) | Não existe um guia único "como aplicar a marca em código" para agentes — hoje a informação está fragmentada entre DESIGN.md, skills desatualizadas e este brand-system | `.claude/CLAUDE.md` desatualizado; skills apontam para doc obsoleto |
| Especificações de domínio | Não há specs por módulo (cores de acento por `data-module`, personagens por pilar, microcopy de jornada) ligadas aos tokens | `moduleThemes.ts` existe; mapeamento v2 é proposta (§19.3) |
| Glossário/ux-writing oficial | Voz documentada na BrandConstitution; **microcopy por jornada/componente não catalogada** (i18n tem ~60 strings) | §14, §16 |

### G2. Governança de tokens

| Gap | Situação |
|---|---|
| Fonte única de verdade para tokens | Existem 3 camadas (birthhub360 tokens → official-identity → globals) + aliases deprecated + overrides frágeis — funciona, mas **não há documento de governança de tokens** (quem pode criar token, naming, depreciação) **[PROPOSTO]** |
| Tooling de verificação | Sem lint/regra automatizada impedindo hex hardcoded fora dos tokens; mitigação é manual (overrides CSS) **[PROPOSTO: stylelint/custom rule]** |
| Versionamento de tokens | Tokens mudam com o código; sem changelog semântico de design tokens **[PROPOSTO]** |

### G3. Acessibilidade e evidência

| Gap | Situação |
|---|---|
| Auditoria WCAG 2.2 AA completa e atual | Norma CONFIRMADA; última evidência de auditoria é 2026-10-17/18 + débitos UX de 2026-11-18 — **não há auditoria de contraste/cor sistemática pós-Neon** **[PROPOSTO]** |
| Contraste do CTA gradiente em light | Medição ~3:1 sinalizada; sem correção decidida (§19.4) |
| Baseline de regressão visual confiável | 11 snapshots divergentes de `visual.spec.ts` (DEBT-0041/#201); drift em `tests/AGENTS.md` §6 — goldens existem em `04_ASSETS_VISUAIS/` mas suíte não é baseline honesto |
| i18n de marca | Strings de marca/voz não traduzidas; i18n cobre só setup/firstSteps/common |

### G4. Ativos e aplicação

| Gap | Situação |
|---|---|
| Versão Neon oficial dos SVGs mestres | Mestres em `birthhub360/logos/` são navy/gold preservados; Neon animado existe mas em pasta de trabalho/`v2/assets/` — **falta promoção oficial** **[PROPOSTO]**, condicionada à confirmação do usuário |
| Kits de aplicação (favicon, social, app icon, email signature) | Parcial: favicon + PWA icons existem; **não há kit completo documentado** (og-images, banners, templates de documento) **[PROPOSTO]** |
| Favicon/PWA coerência | `theme_color #F4F7FB` ok; verificar consistência após decisão do light canvas |
| Área de proteção enforced | Norma escrita divergente; sem verificação automatizada |

### G5. Processo e conformidade contínua

| Gap | Situação |
|---|---|
| Gate de conformidade visual no CI | Existe Visual Regression gate no PR #368 (vermelho); não há gate de "zero hex fora de tokens" **[PROPOSTO]** |
| Processo de depreciação de identidade | Não existe protocolo formal para aposentar paleta/doc/ativo (o que aconteceu com laranja `#FF5618` deixou resíduos em `/tools`) |
| Registro de decisões de marca | Decisões estão em handoffs/commits dispersos; **não há ADR (architecture decision record) de marca** consolidado — este brand-system cobre parcialmente via `conflitos-e-decisoes.md` |
| Homologação V2 | `identidade-visual/v2/` é o candidato natural a preencher vários gaps (brandbook, DS, motion, componentes) — **tudo depende da decisão §19.9** |

## 3. Síntese — prioridade dos gaps

| Prioridade | Gaps |
|---|---|
| **Imediato** | G5-processo (depreciação), G3-baseline visual, decisão V2 |
| **Curto prazo** | G1-consolidação (brandbook MD, guia de agentes), G2-governança de tokens, G4-logos Neon oficiais |
| **Médio prazo** | G1-manual de componentes + motion comercial, G3-WCAG audit atual, G4-kits de aplicação |
| **Longo prazo / condicionado** | Especificações de domínio completas, i18n de marca, motion comercial 2-níveis |

**Observação central:** a maioria dos gaps de conteúdo já tem candidato pronto em `identidade-visual/v2/` — a alavanca maior não é produzir material novo, é **homologar ou rejeitar o V2** e saneá-lo. Produzir documentação paralela sem essa decisão gera a 4ª fonte divergente.
