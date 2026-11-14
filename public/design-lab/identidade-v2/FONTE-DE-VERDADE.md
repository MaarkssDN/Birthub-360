# Fonte de verdade — Identidade Birthub 360° V2.1 (RASCUNHO, não homologado)
V2.1 = V2.0 preservada (baseline em `_baseline-v2.0/`) + errata do N1 + reconciliações. Última atualização: 2026-11-14.
Autor: Agente 00. Todas as frentes (auditoria, brandbook, design system, motion) DEVEM usar este arquivo e `shared/core.css`.
Divergir exige registrar na matriz de decisões e avisar o 00.

## Decisões CONFIRMADAS (vêm literalmente da missão do usuário, 2026-11-13)
| ID | Decisão |
|----|---------|
| C01 | Posicionamento: "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" |
| C02 | Paleta: Azul Neon #00D4FF · Rosa Neon #FF2D9B · Dourado #FFC107 · Íris #8B7DFF · Dark #0D0D0D · Light #F4F7FB |
| C03 | Tipografia: Sora (display) · Inter (UI) · IBM Plex Mono (dados/código) |
| C04 | Sem títulos/subtítulos em branco ou preto puro (#FFF/#000) |
| C05 | Linguagem: Neon Editorial Cinematic como referência criativa (não definição automática de regras) |
| C06 | Sem fotografia humana genérica; logotipo original NÃO é redesenhado; personagens NÃO são redesenhados |
| C07 | Arquitetura: Hub Central + Workspaces Modulares + Assistentes Globais; 11 módulos = P01–P08 (pilares) + M09–M11 |
| C08 | Dois níveis de movimento: Experiência Comercial (cinematográfica) e Operacional (discreta/rápida); prefers-reduced-motion obrigatório |
| C09 | 29 personagens ≠ 26 agentes técnicos ≠ 11 módulos (nunca confundir) |
| C10 | **N1 Final Candidate** (repo externo MaarkssDN/Land-page, `mission-06/n1-final`, commit 0d08b31) é a referência criativa da Experiência Comercial (Persuade). Não define regras para workspaces operacionais. Análise em `08-referencia-n1/` |

## Decisões PROVISÓRIAS (não apresentar como regra homologada)
| ID | Decisão provisória | Motivo / evidência |
|----|-------------------|--------------------|
| P-01 | Grafia: **"Birthub 360°"** nos novos textos (grau °, não º) | Missão usa "Birthub 360°"; fontes oficiais do repo (brand.ts, brandbook, manuais) usam "Birth Hub 360°/º". Sem evidência definitiva → PENDENTE de decisão humana. Toda página deve citar a grafia via um único ponto de troca. |
| P-02 | Variantes de texto em Light (`--c-*` em [data-theme=light]) | Neon puro mede 1.5–3.2:1 sobre #F4F7FB; derivadas medem ≥5.4:1. Valores derivados, não oficiais. |
| P-03 | Ink de texto #E8EEFF (dark) / #0F1A2E (light) | Evita branco/preto puro (C04). Derivado. |
| P-04 | Superfícies #14141A/#1C1C24/#252530 | Herdadas de `identidade-visual/birthhub360/tokens` (existentes); Light surfaces derivadas. |
| P-05 | Light oficial = #F4F7FB (missão) vs #F8F9FF (tokens atuais "neon-white") | Conflito a registrar na auditoria. |

## Conflitos de fonte já levantados pelo 00 (a auditoria detalha)
1. **[SUPERADO pela seção "Correções do 00"; Íris e Light têm origem prévia]** **Três paletas coexistem**: (a) Neon `#00D4FF/#FF2D9B/#FFC107` em `identidade-visual/` + `src/config/brand.ts`; (b) "Strategic Command Center" (Antique Gold `#D4AF37`, Deep Iris `#7C3AED`, Orbit Blue `#1677FF`, Deep Navy `#061A3A`) em `.claude/CLAUDE.md`/`src/styles/globals.css`; (c) a da missão (Neon + Íris `#8B7DFF` + Light `#F4F7FB`) — Íris #8B7DFF e Light #F4F7FB não existem nas fontes (a) e diferem de (b).
2. **Grafia**: "Birth Hub 360°/º" (27 arquivos) vs "Birthub 360" (2, só migration/schema) vs "BirthHub360" (id/arquivos) — e a missão pede "Birthub 360°". Grau: ° (brandbook) vs º (brand.ts, CLAUDE.md).
3. **[SUPERADO pela Errata V2.1: N1 localizado em repo externo]** **N1 Final Candidate / Land-Hero-Lab / "Neon Editorial Cinematic"**: busca textual no repo = 0 ocorrências. Existem `public/design-lab/` (Command Language, Components V2, neon-tokyo-buttons) e `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4_CINEMATIC.html`. Registrar como NÃO LOCALIZADO; não inventar conteúdo.
4. Personagens: tokens `characters.json` listam 9 em `characters` + camadas extras em `agentCharacters`; meta diz totalCharacters 29; SVGs em `identidade-visual/birthhub360/characters/` = 29; `BirthHub360_Personagens.html` ainda diz "9 Personagens". 
5. SVGs mestres do logo têm cores históricas ≠ tokens neon atuais (README de identidade-visual: preservado por determinação do usuário).
6. Prompt dos pilares: P01 Hub Comercial, P02 Inteligência de Mercado, P03 Orquestração de Vendas, P04 Performance, P05 Previsibilidade, P06 Enxame de IA, P08 Voice & WhatsApp, M10 Field Sales — P07, M09, M11 a confirmar na auditoria (fontes: BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.10.html, BIRTHUB360_DECISOES_PRODUTO.md, src/features/characters/characterCatalogPillars.ts).

## Estrutura da entrega (`public/design-lab/identidade-v2/`)
00 `index.html` (índice, 00) · 01 `01-auditoria/` · 02 `02-brandbook/` · 03 `03-design-system/` (+tokens) · 04 `04-motion-system/` (+tokens) · 05 `05-biblioteca/` · 06 `06-conformidade/` · 07 `07-relatorio-mestre/`.
Assets de marca: copiar (nunca mover/editar) para `assets/`. Fontes: `../../../fonts/`. Personagens: `../../../brand/characters/*.svg`.
Todas as páginas: HTML estático autocontido (CSS/JS inline ou arquivos locais), sem CDN, tema dark+light com toggle, `prefers-reduced-motion`, rótulo visível "RASCUNHO V2.0 — NÃO HOMOLOGADO" e "PROTÓTIPO" nos exemplos.

## Correções do 00 após a Frente 01 (2026-11-13)
- Conflito 1 corrigido: Íris #8B7DFF e Light #F4F7FB TÊM origem prévia (birthhub360.json, brandbook, V4_CINEMATIC, vite.config.ts); a paleta C02 coincide com a identidade Neon oficial. "Strategic Command Center" em `.claude/CLAUDE.md` está obsoleto (A-01, PENDENTE; não editado).
- Conflito 2 detalhado: "Birthub 360°" existe em 80 arquivos (não só migration/schema); contagem completa em 01-auditoria. Grafia segue PENDENTE (P-01).
- Módulos confirmados: P06 Inteligência Artificial, P07 Automação & Conectividade, P08 Engajamento Comercial, M09 Admin & Operations, M10 Mobile & Field Sales, M11 Social Selling. "Enxame de IA", "Voice & WhatsApp" e "Field Sales" são aliases de plano. Prevalecem os nomes de moduleRegistry.ts.
- "26 agentes técnicos": o repo tem 26 no roster de ENGENHARIA; o enxame de IA do produto tem 24 + Supervisor. Qual a missão chama de "agentes técnicos" é decisão do usuário (A-05) — não publicar o número 26 como fato de produto.
- Variantes Light oficiais do Brandbook anterior falham AA (#0284C7 3.81, #D91B7C 4.44, #D97706 2.96): as derivadas P-02 se justificam.
- ~~N1 / Land-Hero-Lab / Neon Editorial Cinematic: NÃO LOCALIZADOS~~ (SUPERADO pela Errata V2.1: não estão neste repo, mas existem em MaarkssDN/Land-page).

## Errata V2.1 (2026-11-14) — substitui afirmações anteriores deste arquivo
- Item 3 dos "Conflitos de fonte" e a última linha das correções acima ("N1 ... NÃO LOCALIZADOS") estão **SUPERADOS**: o N1 existe em `github.com/MaarkssDN/Land-page` (`mission-06/n1-final`, commit `0d08b31`) e foi analisado. Neste repositório continua sem ocorrências. A página publicada (GitHub Pages) é inacessível neste ambiente (proxy 403) e não foi analisada.
- N1 usa "Birth Hub 360°" (título, marca, copy, PRODUCT.md). É evidência nova para P-01; a grafia segue decisão humana (H-01 em `09-decisoes-humanas/`).
- Reconciliações aplicadas: semânticas de estado = `#22C55E/#EF4444/#FFC107/#3B82F6` (oficiais de `birthhub360.css` e do PRODUCT do N1); duas escalas tipográficas ligadas aos níveis Comercial/Operacional; nomes de tokens de motion únicos (`04-motion-system/tokens/motion.css`).
- Compatibilidade confirmada com o N1: easing `cubic-bezier(.16,1,.3,1)` = `--ease-out`; durações 0,68 a 1,2 s cabem no nível Comercial (`--dur-slow` 600 ms, `--dur-cinematic` 1200 ms).
- Decisões humanas separadas e com alternativas: `09-decisoes-humanas/index.html` (H-01 a H-14).
