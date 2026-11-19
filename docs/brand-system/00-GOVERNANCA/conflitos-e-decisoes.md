# Conflitos e Decisões

Estado: CONFIRMADO (evidência citada) · Todas as resoluções são **PROPOSTAS** até aprovação humana.
Confiança: A (alta, código+docs concordam na leitura), M (média), B (baixa).

| ID | Conflito | Fontes | Estado atual | Resolução proposta | Conf. | Aprovação humana |
|---|---|---|---|---|---|---|
| C-01 | Cor primária do tema claro | `DESIGN.md` (`#0284C7`) × `birthhub360.css` light (`#0369A1`) × `official-identity.css` (força `#0369a1`) × `Button.tsx` (`#0369a1`) | Runtime usa `#0369A1` | Tokens canônicos vencem (precedência). Corrigir `DESIGN.md` | A | Sim (altera identidade) |
| C-02 | Fundo do tema claro | `DESIGN.md` `#F8FAFC` × tokens `#F4F7FB` | Runtime `#F4F7FB` | Idem C-01 | A | Sim |
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
