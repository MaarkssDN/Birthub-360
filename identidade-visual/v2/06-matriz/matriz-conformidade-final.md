# Matriz de Conformidade Final — Brandbook V2 × Design System V2 × Motion V2 × Restrições Oficiais
**Missão:** DEM-20261113-004 · Agente 00 · 2026-10-14
**Fontes:** `FONTE-DE-VERDADE.md` (verdade compartilhada), `01-auditoria/matriz-conformidade.md` (estado do repositório), entregas 02/03/04/05 (estado da V2).
**Legenda:** CONFORME · PARCIAL · PENDENTE · NÃO APLICÁVEL (fora do escopo V2)

## A. Identidade de marca

| Item | Regra oficial (FONTE) | Repositório hoje | Entrega V2 | Estado |
|---|---|---|---|---|
| Grafia do nome | "Birthub 360°" como nome de trabalho; inconsistência real documentada | "Birth Hub 360" domina artefatos de marca; "Birthub" em engenharia/dados; V4.10 mistura | V2 usa "Birthub 360°" + selo PENDENTE em todos os documentos | **PENDENTE** — decisão do usuário |
| Símbolo de grau `360°` vs `360º` | `°` na V2 | Misturado nas fontes (`brand.ts` usa `º`) | `°` consistente na V2 | **PENDENTE** (vinculada à grafia) |
| Posicionamento | Formulação do briefing prevalece | Convergente com PRODUCT.md/strategy | Verbatim no Brandbook §01 | CONFORME |
| Personalidade / tom de voz / narrativa | Definidos na V2 | Parcialmente em manuais anteriores | Brandbook §01 e §08 | CONFORME (V2) |

## B. Logotipo e ativos

| Item | Regra | Estado |
|---|---|---|
| 3 SVGs oficiais (horizontal/símbolo/ícone) | Não redesenhar | CONFORME — copiados intactos para `v2/assets/logos/`; regras de proteção/mínimos/restrições documentadas no Brandbook §02 |
| Área de proteção / mínimos / fundos | Documentar | CONFORME (V2) — módulo x = altura do símbolo, proteção 1x/1x mínimo, fundos permitidos/proibidos |
| Variantes knockout/light do wordmark | Não existem oficialmente | **PENDENTE** — sinalizado no Brandbook §02 para homologação |
| Cores históricas dentro dos SVGs ≠ tokens neon | Asset sagrado, proibido alterar | CONFORME — preservado; V2 não altera |

## C. Paleta e cor

| Item | Regra | Estado |
|---|---|---|
| 6 cores fixas (#00D4FF/#FF2D9B/#FFC107/#8B7DFF/#0D0D0D/#F4F7FB) | Fixas | CONFORME — idênticas em tokens oficiais, DESIGN.md e V2 (JSON+CSS) |
| Não neutralizar neon / sem pastéis | Regra | CONFORME — mantido; detector Impeccable trata glows como warning inerente (documentado) |
| Gradientes de assinatura + glows | Valores oficiais | CONFORME — reproduzidos na V2 e demo |
| Contraste WCAG 2.2 AA; texto nunca branco/preto puro | Inegociável | CONFORME — rampas semânticas AA dark/light nos tokens V2; Brandbook traz tabela de ratios reais; DS documenta tokens `--color-on-brand` etc. |
| Light canvas `#F4F7FB` vs `#F8FAFC` (DESIGN.md) | `#F4F7FB` canônico | CONFORME V2 / PARCIAL repositório — reconciliado: `#F4F7FB` fundo, `#F8FAFC` superfície legada; recomenda-se corrigir DESIGN.md na homologação |
| Gradiente CTA light (~3:1 texto branco) | Borderline | **PENDENTE** — sinalizado no DS README §6 para homologação |

## D. Tipografia

| Item | Regra | Estado |
|---|---|---|
| Sora / Inter / IBM Plex Mono + escalas + tracking + font-features | Fixas | CONFORME — já implementado (self-hosted `public/fonts/`); V2 documenta escalas e uso |
| Títulos/subtítulos nunca branco/preto puro | Regra | CONFORME — tons de leitura (`#70D6FF`, `#9EADC8`…) documentados |

## E. Linguagem visual e motion

| Item | Regra | Estado |
|---|---|---|
| Neon Editorial Cinematic | Direção oficial V2 | PARCIAL→CONFORME(V2): formalizada no Brandbook §05; N1 = referência criativa pendente de merge/homologação (missão 07) |
| Grafismos 360° / órbita cônica | Elemento assinatura | CONFORME — documentado e demonstrado |
| Motion dois níveis (Comercial/Operacional) | Comercial monumental; Operacional discreto | CONFORME(V2) — `04-motion/` completo com tabela de decisão; base operacional já existia (`src/lib/motion.ts`) |
| `prefers-reduced-motion` | Obrigatório | CONFORME — em tokens CSS, demo e biblioteca |
| Sem fotos humanas genéricas | Regra | CONFORME |

## F. Design System e módulos

| Item | Regra | Estado |
|---|---|---|
| Tokens JSON (DTCG) + CSS | Entrega V2 | CONFORME — `03-design-system/tokens/` com nomenclatura canônica (`--color-*`, `--radius-*`…) reconciliada com `birthhub360.*` |
| ~30 componentes oficiais | Catálogo | PARCIAL — biblioteca V2 demonstra os padrões em HTML; adoção React = fase futura |
| 4 estados obrigatórios (Loading/Empty/Error/Stale) | Produto | CONFORME — documentado no DS; demonstrado na biblioteca |
| Hub + Workspaces + Assistentes; 11 módulos | Arquitetura | CONFORME — `moduleRegistry.ts` confirmado; V2 propõe `data-module`→`--module-accent` (mapeamento módulo→accent **PENDENTE DE HOMOLOGAÇÃO**) |
| Dark/Light themes | Ambos | CONFORME — toggle funcional nas demos |

## G. Personagens e ilustração

| Item | Regra | Estado |
|---|---|---|
| 29 SVGs oficiais preservados | Não redesenhar | CONFORME — cópias intactas em `v2/assets/characters/`; grade documentada no Brandbook §07 |
| Distinção 29 personagens ≠ agentes ≠ 11 módulos | Regra | CONFORME(V2) — documentado; **PENDENTE**: contagem oficial de agentes técnicos (20 no catálogo vs 24–26 em docs) — decisão do 00/usuário |
| GUIA-MESTRE-PERSONAGENS | Cobre só 9 pilares | PARCIAL — homologação 24 não evidenciada; pendente |

## H. Limites e governança

| Item | Regra | Estado |
|---|---|---|
| Nada aplicado à plataforma real | Limite | CONFORME — todos os artefatos em `identidade-visual/v2/`; `git status` do worktree confirma só adições na pasta v2 |
| Materiais anteriores preservados | Limite | CONFORME — nenhum arquivo fora de `v2/` tocado |
| Homologação formal | Só após usuário | PENDENTE — V2 é proposta, não oficial até aprovação |

## Pendências consolidadas para decisão do usuário (Agente 00)

1. **Grafia oficial**: "Birthub 360°" vs "Birth Hub 360°" (+ `°` vs `º`). Recomendação da auditoria: marca pública = "Birth Hub 360°"; "Birthub/BIRTHUB360" como identificador técnico legado. V2 adotou "Birthub 360°" por ser o nome de trabalho do briefing.
2. **Taxonomia de agentes**: 20 personagens-agente (catálogo) vs 24–26 citados em docs — definir número oficial.
3. **Mapeamento módulo→accent** proposto na V2 — homologar ou ajustar.
4. **Contraste do CTA gradiente em light** — homologar ajuste.
5. **Destinos fora do escopo V2** (registrar como débitos, não resolver aqui): `landing/` e `landing-page.html` com identidade divergente; `elegance.css`/`luxury-tokens.css`/`src/index.css` mortos; docs de design da era navy/gold marcados como superseded; N1 aguardando merge da missão 07; marca antiga residual `#FF5618`/`public/tools/*` (handoffs onda-c0 existentes).
