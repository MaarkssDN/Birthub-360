# Conflitos e Decisões

Estado: CONFIRMADO (evidência citada) · Todas as resoluções são **PROPOSTAS** até aprovação humana.
Confiança: A (alta, código+docs concordam na leitura), M (média), B (baixa).

| ID | Conflito | Fontes | Estado atual | Resolução proposta | Conf. | Aprovação humana |
|---|---|---|---|---|---|---|
| C-01 | Cor primária do tema claro | `DESIGN.md` (`#0284C7`) × `birthhub360.css` light (`#0369A1`) × `official-identity.css` (força `#0369a1`) × `Button.tsx` (`#0369a1`) | Runtime usa `#0369A1` | Tokens canônicos vencem (precedência). Corrigir `DESIGN.md` | A | Sim (altera identidade) |
| C-02 | Fundo do tema claro | `DESIGN.md` `#F8FAFC` × tokens `#F4F7FB` | Runtime `#F4F7FB` | **RESOLVIDO por decisão humana** (Desktop `v2/FONTE-DE-VERDADE.md §3`, 2026-11-13: Light `#F4F7FB`); corrigir `DESIGN.md` | A | Já decidido |
| C-03 | Texto secundário × mudo no claro | tokens: secondary `#64748B`, muted `#475569` (mudo mais escuro que secundário); `official-identity.css` sobrescreve secundário para `#475569` | Dois tons coexistem; semântica invertida | Definir `text-secondary = #475569` e remover `#64748B` do light, ou renomear | M | Sim |
| C-04 | CTA primário | `DESIGN.md`: CTA = gradiente rosa→ciano (`--grad-cta`); `Button.tsx`: `default/primary` = azul; `brand/electric/lime` = lime `#D4F434` | Lime não existe na paleta oficial (55 ocorrências) | Decidir se lime é cor oficial ou legado; se legado, migrar `brand/electric/lime` | M | Sim |
| C-05 | Raio de controles | tokens `--radius-control: 12px`; `Button` usa `rounded-2xl` (16px) e `rounded-full` | Divergência | Alinhar ao token ou formalizar exceção | M | Não (técnico) se seguir token |
| C-06 | Cores fora da paleta | 622 hex distintos em `src/`; top fora-da-paleta: `#0284C7` (102), `#F59E0B` (84), `#94A3B8` (82), `#38BDF8` (55), `#D4F434` (55), `#00E5FF` (45) — [CSV](../_inventarios/cores-hex-hardcoded.csv) | Tokens órfãos/duplicados | Mapear cada valor a token ou removê-lo (backlog P1) | A | Parcial |
| C-07 | Escalas de motion duplicadas | CSS: 100/150/250/350/500 ms; `motion.ts`: 0.1/0.15/0.25/0.35/0.6/0.8 s; springs `ELASTIC=BOUNCY=SOFT` idênticos; `EASE_BOUNCE` comentado como "replaced" | Redundância | Unificar em tabela única ([manual](../05-MOTION/manual-de-animacoes.md)) | A | Não |
| C-08 | Taxonomia de módulos | `PRODUCT.md`: 8 pilares (Hub Central, Intelligence & Scoring…) × `moduleRegistry.ts`: Hub + 11 módulos P01–P08, M09–M11 com outros nomes | Divergência de nomenclatura | Adotar `moduleRegistry.ts` (implementado) e atualizar `PRODUCT.md` | M | Sim (naming de produto) |
| C-09 | Ouro no tema claro | tokens `--color-brand-accent #D97706`; `official-identity.css` heading-gold `#92400E`; `DESIGN.md` `#D97706` | Dois ouros | Documentar ouro-texto (`#92400E`) × ouro-acento (`#D97706`) como papéis distintos | M | Não |
| C-10 | Documentação anterior | Branch `docs/brand-system-e-onda-review-20261119` já contém `docs/brand-system/` | Não integrada; refeita por decisão humana | Reconciliar/descartar uma das versões antes do merge | A | **Sim** |
| C-11 | Caminho da fonte A | Prompt: `Desktop\DOCUMENTOS\IDENTIDADE-VISUAL`; real: `Desktop\IDENTIDADE-VISUAL` | Resolvido | Usado o real | A | Não |
| C-12 | "100 agentes especializados" | `AGENTS.md` lista ~30 agentes numerados; 29 "personagens" em `identidade-visual/.../characters` | Não encontrada formalização de 100 | Tratar como NÃO VERIFICADO | B | Informar |
| C-13 | Landing/Login intocáveis | `DESIGN.md`/`PRODUCT.md` proíbem alterá-las; `src/features/landing` pertence ao Agente 02 | Esta missão é só documental | Nenhuma alteração feita | A | Não |

## Adendo v0.2 — decisões humanas encontradas no Desktop (`TUDO/v2/FONTE-DE-VERDADE.md`, 2026-11-13)

Fonte: [Desktop `TUDO/v2/FONTE-DE-VERDADE.md`] lida integralmente + trechos de `01-auditoria/matriz-decisoes.md`. Estado: **decisões do usuário (CONFIRMADO como declaradas)**; itens `[PENDENTE]` seguem pendentes.

| ID | Decisão registrada | Efeito neste brand-system |
|---|---|---|
| D-01 | Posicionamento fixado: "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" | Substitui a formulação de `PRODUCT.md` onde divergir ([brandbook](../01-MARCA/brandbook.md)) |
| D-02 | Light canônico `#F4F7FB`; paleta de marca fixa + **rampa semântica AA** para o claro (`#0284C7`, `#D91B7C`, `#D97706`, `#7C3AED`) | Resolve C-02; reenquadra C-01: `#0284C7` é rampa AA de ciano e `#0369A1` é o valor efetivo de texto/botão no runtime — documentar as duas camadas, não eliminar uma |
| D-03 | Grafia "Birthub 360°" × "Birth Hub 360°" e símbolo `°` × `º`: **PENDENTE** (recomendação não decisória: público = "Birth Hub 360°") | Novo conflito C-14; ver abaixo |
| D-04 | Linguagem "Neon Editorial Cinematic" — provisória; N1 é referência criativa | Registrada como PROVISÓRIA |
| D-05 | Motion em dois níveis: **Comercial** (cinematográfico; landing) e **Operacional** (discreto, rápido; workspaces) | Incorporado ao [manual de motion](../05-MOTION/manual-de-animacoes.md) |
| D-06 | Um Design System com identidade contextual por módulo | Já refletido em `NavAccent` |
| D-07 | Contagem de personagens/agentes diverge (29 SVG; 20 no catálogo; 24–26 em docs) — decisão pendente do 00 | Reclassifica C-12 |

| ID | Novo conflito | Resolução proposta |
|---|---|---|
| C-14 | Grafia do nome: "Birthub" (engenharia/infra/dados) × "Birth Hub" (marca/UX/tokens); `360°` × `360º` (`brand.ts`, BrandConstitution usam `º`) | Aguardar decisão; adotar `Birth Hub 360°` em UI até lá (já dominante). Aprovação humana: sim |
| C-15 | `globals.css` mantém tokens legados (`--midnight`, `--sunset`, `--red-violet`) | Limpeza P3 (informado em `matriz-decisoes` do Desktop) |
| C-16 | `AUDITORIA-COMPLETA…html` usa semânticos `#10B981/#FF3B5C` | HISTÓRICO; não usar |
