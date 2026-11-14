# Matriz de Conformidade Inicial — FONTE-DE-VERDADE vs. Repositório
**Frente:** 01 · DEM-20261113-004 · 2026-11-13
**Uso:** insumo para a matriz final de conformidade do Agente 00.
**Legenda:** CONFORME · PARCIAL · NÃO CONFORME · AUSENTE · PENDENTE

| # | Item da FONTE-DE-VERDADE | Estado hoje | Evidência | Classe |
|---|---|---|---|---|
| §1 | Nome oficial de trabalho "Birthub 360°" | Usado em V4.x, moduleRegistry, design-lab, dados de negócio; mas marca pública usa "Birth Hub 360" | `moduleRegistry.ts:16`, V4.x docs, brand.ts | **PENDENTE** (grafia) |
| §1 | [PENDENTE] inconsistência de grafia a levantar | Levantada — ver `matriz-decisoes.md` §1 | múltiplas fontes | **PENDENTE** |
| §2 | Posicionamento "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" | Convergente com PRODUCT.md ("Sistema Operacional de Revenue Intelligence") e strategy JSON | `PRODUCT.md:15`, `docs/strategy/birth-hub-360-strategy.json` | CONFORME (formulação V2 = briefing) |
| §3 | Paleta Neon (6 tokens) | Implementada em tokens oficiais + app | `birthhub360.css`, `birthhub360.json`, `brand.ts`, `globals.css` | CONFORME |
| §3 | Não neutralizar neon / não pastéis / gradientes de assinatura / glows | Gradientes e glows idênticos em tokens e CSS | `birthhub360.css` (`--grad-brand`, `--grad-cta`, `--grad-orbit`, `--glow-*`), `official-identity.css:341-365` | CONFORME |
| §3 | Contraste WCAG 2.2 AA; texto nunca branco/preto puro | Overrides AA por tema existem; nota "Azul Leitura #70D6FF" | `official-identity.css:264-315`, `birthhub360.css` light, `BrandConstitution.md` §2 | CONFORME (manter monitoramento — `docs/audits/onda-42/09-relatorio-contraste-wcag.md`) |
| §3 | Dark/light documentados | Dark+light em `birthhub360.css`; light tem variantes AA | `birthhub360.css` blocos `:root`/`[data-theme="light"]`/`[data-theme="dark"]` | CONFORME |
| §3 | Reconciliar `#F8FAFC` vs `#F4F7FB` + camada semântica | `#F4F7FB` já é o `--color-background` light canônico; `#F8FAFC` aparece como code-bg/surface legado e no DESIGN.md | `birthhub360.css` light, `DESIGN.md:19` | PARCIAL — documentar na V2 (recomendação: `#F4F7FB` fundo; `#F8FAFC` superfície) |
| §4 | Sora display / Inter interface / IBM Plex Mono dados | Self-hosted, `@font-face` em globals.css, tokens `--font-display/interface/mono` | `globals.css:12-198`, `birthhub360.css` fonts, `brand.ts` | CONFORME |
| §4 | Tracking/font-features Inter | `"cv05","cv11","ss01"`, `-0.012em`; display `-0.02em` | `birthhub360.css`, `globals.css:383-385`, manuais | CONFORME |
| §5 | "Neon Editorial Cinematic"; N1 = referência criativa | N1 existe só no worktree irmão (não mergeado); landing atual usa neon sem formalização editorial | `missao-07-hero-n1/.../hero-n1/`, `docs/landing-v2/prototype/` | PARCIAL — formalizar na Frente 02/04 |
| §6 | Hub + Workspaces + 11 módulos (P01–P08, M09–M11) | `moduleRegistry.ts` canônico; workspace modular implementado | `src/components/layout/moduleRegistry.ts` | CONFORME |
| §6 | Um único DS com identidade contextual por módulo | Esboço: `data-accent` em `bh-platform-card` (8 acentos) | `official-identity.css:166-196,321-327` | PARCIAL — falta taxonomia de acentos por módulo (Frente 03/05) |
| §7 | Motion dois níveis (Comercial/Operacional) | Operacional existe (`motion.ts` + tokens); Comercial = só referência N1 | `src/lib/motion.ts`, `globals.css:387-399`, `LandingHeroN1.css` | PARCIAL |
| §7 | `prefers-reduced-motion` obrigatório | Implementado em variants, hooks e CSS | `motion.ts` (`useReducedMotion`), `official-identity.css:212-219`, `elegance.css:654` (morto), `luxury-tokens.css:267` (morto) | CONFORME |
| §7 | Framer Motion lib padrão | Confirmado | imports em `src/lib/motion.ts`, `Landing360.tsx` | CONFORME |
| §8 | 29 personagens oficiais preservados | 29 SVGs em `birthhub360/characters/` + `public/brand/characters/`; catálogo 9+20 | listing de diretórios, `characterCatalog*.ts` | CONFORME (asset) / PENDENTE (lista nominal da FONTE tem 28 nomes — falta `oracle` na lista; ver matriz-decisoes §7) |
| §8 | Não confundir com 26 agentes / 11 módulos | Personagens-agente = 20 no catálogo; contagens divergem nas fontes | `characterCatalogAgents.ts` (20), FONTE (26), CONTRATOS_AGENTES (24) | PENDENTE (taxonomia 00) |
| §9 | Logos oficiais, sem redesenho | 3 SVGs + regras de uso documentadas | `birthhub360/logos/`, `public/brand/`, `BrandConstitution.md` §4 | CONFORME |
| §10 | Limites (só docs/demo em v2/, nada na plataforma) | Esta auditoria escreveu somente em `01-auditoria/` | este relatório | CONFORME |

## Itens fora da FONTE mas relevantes para a matriz do 00

| Item | Estado | Nota |
|---|---|---|
| `elegance.css` / `luxury-tokens.css` / `src/index.css` | AUSENTE do app (mortos) | Não conformes com a identidade oficial por definição, mas inertes — decisão de remoção pendente |
| `landing/` sub-app + `landing-page.html` | NÃO CONFORME (identidade divergente) | Cabin+gold / navy+gold; decisão de destino pendente |
| `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` | OBSOLETO | Navy/gold/Playfair — diverge do neon; marcar superseded? |
| `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` | PARCIAL | Cores ok; tipografia desatualizada (Jakarta/JetBrains) |
| `docs/strategy/DESIGN-playbook.md` + playbook HTML | PARCIAL/visual obsoleto | Conteúdo estratégico ok; paleta gold/navy/Bodoni desatualizada |
| `GUIA-MESTRE-PERSONAGENS` | PARCIAL | Cobre 9/29 personagens; status "pronto p/ homologação 24" sem evidência de homologação |
| `#FF5618` residual + `public/tools/*` marca antiga | NÃO CONFORME (débito conhecido) | Hand-offs já abertos (LEGACY_BRAND_CONTENT_MAP §2.2/§2.5) — fora do escopo V2, mas a V2 não deve citá-los como identidade |
| Tokens voice-hub duplicados/ divergentes | NÃO CONFORME (conhecido) | `TOKEN-AUDIT.md` — Montserrat, cores hardcoded; handoffs existentes |
| Documentos mestres V4.x com grafia mista | NÃO CONFORME (documental) | V4.10 mistura "Birth Hub 360°" e "Birthub 360°" — evidência central do PENDENTE de grafia |
| `birthhub360.json → notes.conflicts` | Divergências oficiais registradas | Light surfaces/muted/borders/code-bg divergem entre os 4 docs mestres; resolução já implementada em `birthhub360.css` deve ser citada como canônica na V2 |

## Síntese para o Agente 00

- **Conformes e sólidos:** paleta, gradientes, tipografia, tokens, logos, personagens (assets), arquitetura de módulos, motion operacional, limites.
- **Parciais a fechar na V2:** camada semântica light (`#F4F7FB` vs `#F8FAFC`), motion comercial, identidade contextual por módulo, guia de personagens completo, linguagem "Neon Editorial Cinematic" formalizada.
- **Pendentes críticos:** grafia do nome (+ símbolo de grau), contagem/taxonomia de agentes vs. personagens, destino de arquivos mortos e superfícies divergentes (`landing/`, `landing-page.html`, docs obsoletos), status do N1.
- **Não conformidades já mapeadas fora do escopo:** marca antiga residual (`#FF5618`, `public/tools/*`, GHCR/argocd) — handoffs existentes em `.agents/handoffs/onda-c0/`.
