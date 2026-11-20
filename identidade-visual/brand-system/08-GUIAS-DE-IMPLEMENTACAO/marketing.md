# Guia de Implementação — Marketing — Birth Hub 360°

**Propósito:** orientar a produção de materiais de marketing (campanhas, social, institucional, apresentações) dentro da identidade oficial.

**Escopo:** comunicação externa e institucional. Não cobre UX do produto (ver `frontend.md`/`designers.md`). Conteúdo institucional existente em `documentacao-aplicacao/` é do Agente 11.

**Estado:** regras derivadas de evidências verificadas em 2026-11-19.

**Data:** 2026-11-19 · **Fontes:** `docs/BrandConstitution.md` (§1 valores, §5 voz), `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html`, `identidade-visual/README.md`, `src/config/brand.ts`, `_FATOS-CANONICOS.md` §2/§4/§5/§13, `identidade-visual/brand-system/01-MARCA/identidade-verbal.md`.

**Documentos relacionados:** `designers.md`, `checklist-de-qualidade.md`, `contribuicao.md`, `../07-ATIVOS/catalogo-de-assets.md`, `../01-MARCA/identidade-verbal.md`, `../01-MARCA/posicionamento.md`, `../01-MARCA/brandbook.md`.

---

## 1. Identidade verbal (resumo — detalhe em `01-MARCA/identidade-verbal.md`)

- **Nome de trabalho:** `Birth Hub 360°` (grafia final PENDENTE — §19.1; proibidos: "BirthHub", "Birthub360", "360 Hub", "Birth CRM"). Em identificadores/código: `BirthHub360`, `birthub360`.
- **Posicionamento:** "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" (FONTE-DE-VERDADE §2; PRODUCT.md usa "Revenue Intelligence"). Taglines: "A Central de Comando 360° do seu Ciclo de Receita"; "Sua central de comando inteligente" (`BRAND.slogan/tagline`, `src/config/brand.ts:26-33`).
- **Tom:** Profissional · Tecnológica · Direta · Empowering (BrandConstitution §5). IA comunicada por insight/confiança/raciocínio — **nunca** "sparkles", "magic", "AI-powered" genérico.
- **Valores:** Innovation, Data Intelligence, Efficiency, Scalability. ICP: qualquer empresa com área comercial.
- **Arquitetura:** marca-mãe + 11 módulos (P01–P08 pilares + M09–M11; registro em `src/components/layout/moduleRegistry.ts`).

## 2. Paleta e gradientes permitidos

Usar os valores de `identidade-visual/birthhub360/tokens/birthhub360.json` (não amostras de SVG — contêm cores históricas):

- **Marca:** Azul Neon `#00D4FF`, Rosa Neon `#FF2D9B`, Dourado `#FFC107`, Íris IA `#8B7DFF`.
- **Superfícies dark:** `#0D0D0D/#14141A/#1C1C24`; texto `#F8F9FF/#9EADC8/#A1A1B5`.
- **Light (AA):** canvas `#F4F7FB`, surface `#FFFFFF`, tintas `#0F172A/#64748B/#475569`; marca adaptada `#0369A1/#D91B7C/#D97706/#7C3AED/#DC2626`.
- **Gradientes de assinatura:** `--grad-brand` (cyan→pink→gold, títulos), `--grad-cta` (pink→cyan, CTAs), `--grad-vancouver`, `--grad-orbit` (anel cônico 360°). Glows `0 0 24px rgba(0,212,255|255,45,155|255,193,7,.45)`.
- **Semânticos:** success `#22C55E`, warning `#FFC107`, danger `#EF4444`, info `#3B82F6`.

**Proibido:** paleta navy/gold `#0B132B/#D4AF37`, laranja `#FF5618` (aposentada 09/2026), champagne/sage/pearl (Elegance v3.0, CSS morto), `#d4af37`/zinc da landing legada, e qualquer cor fora dos tokens sem aprovação.

## 3. Logos e área de proteção

- **Arquivos corretos:** `public/brand/birthhub360-{simbolo,logo-horizontal,icone}.svg` (espelho de `identidade-visual/birthhub360/logos/`). Referência programática: `BRAND.logos` em `src/config/brand.ts:90-97`.
- **Nomenclatura de uso:** símbolo ≥96px; ícone para favicon/avatar 32–96px; horizontal para assinaturas.
- **Área de proteção:** **PENDENTE** — Manual Mestre (30%, mín. 140px/24px) vs BrandConstitution (1/4 do raio, mín. 96px/32px) divergem (§19.10). **[PROPOSTO]** adotar temporariamente a regra mais restritiva (maior das duas áreas) até decisão humana; registrar a escolha no material.
- **Variantes dark/light:** existem em `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/birthhub360-logo-horizontal-{dark,light}.svg` (fora do git); versões "Cores-Atuais" Neon animadas idem. Em caso de dúvida, usar o horizontal padrão sobre superfície `#0D0D0D` ou `#F4F7FB`.
- **Nunca:** distorcer, rotacionar fora do orbit oficial, aplicar gradiente arbitrário sobre o wordmark, usar `BirthubLogo`/`Birthub360Logo`/`BirthHubLogo` (orbit5 divergente), ou os duplicados `brand__*`/`logos__*`/`symbol.svg`/`avatar.svg` da pasta de trabalho — ver `../07-ATIVOS/catalogo-de-assets.md` §1.3.

## 4. Personagens para campanhas

- 29 personagens canônicos (9 avatares-pilar + 20 personagens-agente): `identidade-visual/birthhub360/characters/*.svg`, servidos em `/brand/characters/`, catálogo em `src/features/characters/` (9+20). Guia mestre: `identidade-visual/GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`.
- Usar nomes próprios (Orbit, Nexus, Aria…) — não tratá-los como "agentes de IA" genéricos na copy de marca.
- Contagem oficial PENDENTE (§19.2): até decisão, referir "29 personagens" conforme acervo, sem afirmar número de "agentes".
- Verificar anterioridade de nomes antes de uso publicitário externo (**NÃO VERIFICADO** — ver `licenciamento.md` §3).

## 5. Tipografia em peças

Sora para títulos/display, Inter para texto corrido, IBM Plex Mono para dados/métricas (ex.: "R$ 1.482.000"). Nunca as famílias proibidas (§3 de `designers.md`). Fontes self-hosted em `public/fonts/`; para peças externas (PDF/impressão/apresentação), exportar Sora/Inter/IBM Plex Mono — os arquivos-fonte estão em `public/fonts/` (Sora/Inter apenas WOFF2 latin+latin-ext; se a peça exigir outros subsets ou TTF, verificar disponibilidade — **NÃO VERIFICADO**).

## 6. Materiais existentes

- `documentacao-aplicacao/` — inventário, briefing, imagens, roteiros, vídeos (dono: Agente 11).
- `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4*.html` (raiz) — documentos mestres do produto.
- Playbooks/estratégia: `docs/strategy/` — **atenção:** `DESIGN-playbook.md` e playbook HTML usam gold/navy/Bodoni **obsoletos** — não usar como referência visual.
- Screenshots de referência: `docs/design/screenshots/current-redesign/`, goldens em `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/`, `public/landing/assets/hero-team.jpg`.
- Tom de voz completo: `identidade-visual/brand-system/01-MARCA/identidade-verbal.md`.

## 7. O que NÃO fazer (resumo executivo)

1. Não usar paleta legada (navy/gold, laranja, champagne) nem as fontes proibidas.
2. Não alterar logos (cor, proporção, efeitos) nem usar variantes divergentes.
3. Não prometer features inexistentes — usar nomes formais do Manual de Produto e jornadas J01–J20.
4. Não usar dados pessoais de clientes em peças sem base legal (LGPD — ver `99_FONTES_OFICIAIS.txt`, ANPD/LGPD; Agente 21).
5. Não publicar material com a identidade V2 como se fosse oficial (não homologada).
6. Não incluir segredos/credenciais em qualquer peça ou repositório público.
