# Guia de Implementação — Agentes de IA — Birth Hub 360°

**Propósito:** definir como agentes de IA (Jules, subagentes, skills) devem consumir esta documentação do Brand System antes de gerar ou alterar UI, tokens, assets ou copy de marca.

**Escopo:** todo agente que trabalhe em `C:\Github\Birthub-360` e precise tocar identidade visual, estilos, componentes ou textos institucionais. Complementa `AGENTS.md` (não o substitui).

**Estado:** regras operacionais derivadas de `_FATOS-CANONICOS.md` e da governança vigente em 2026-11-19.

**Data:** 2026-11-19 · **Fontes:** `AGENTS.md`, `identidade-visual/brand-system/_FATOS-CANONICOS.md`, `identidade-visual/README.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`, `src/styles/AGENTS.md`, `src/components/AGENTS.md`, `src/features/landing/AGENTS.md`.

**Documentos relacionados:** `frontend.md`, `designers.md`, `marketing.md`, `checklist-de-qualidade.md`, `contribuicao.md`, `../07-ATIVOS/rastreabilidade.md`.

---

## 1. Ordem de precedência das fontes (obrigatória)

Para questões de **identidade**, consulte nesta ordem (`_FATOS-CANONICOS.md` §1):

1. `identidade-visual/v2/FONTE-DE-VERDADE.md` — decisões pinadas 2026-11-13.
2. `identidade-visual/README.md` — Brandbook > Manual Visual > Manual de Produto > Catálogo.
3. `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` + `characters.*`.
4. `src/styles/official-identity.css` → `src/styles/globals.css` → `src/config/brand.ts` → `DESIGN.md` → `docs/BrandConstitution.md` → `PRODUCT.md` → constituições `.agents/` → jornadas/catálogo.
5. `identidade-visual/v2/` — **proposta-não-homologada**: nunca decidir com base nela.

Para **governança**, `AGENTS.md` prevalece sempre. Em conflito entre docs de design antigos e os acima, os antigos perdem (ver `inventario-de-fontes.md` §5: `docs/design/BIRTHHUB-360-DESIGN-*.md`, `DESIGN-playbook.md`, `.claude/skills/design-system`, `.agents/skills/birthhub-*` estão desatualizados — não os cite como autoridade).

## 2. Como ler `_FATOS-CANONICOS.md`

- É o pacote de evidências verificado (gerado 2026-11-19). Cada afirmação tem caminho; use-o como ponto de partida, mas **confirme no arquivo** antes de afirmar em código ou doc.
- Classificações: CONFIRMADO / PARCIALMENTE IMPLEMENTADO / DOCUMENTADO-NÃO-IMPLEMENTADO / HISTÓRICO / CONFLITANTE / PROPOSTO / NÃO VERIFICADO — preserve a classificação ao citar.
- §19 lista 12 pendências de decisão humana — **não resolva**; se sua tarefa depender de uma, escale ao Agente 00.
- §11/§12 medem a dívida real (2039 hex/150 arq; CSS morto; mini DS divergente) — não trate como "a fazer" fora de missão.

## 3. Checklist de conformidade antes de gerar UI

Antes de escrever JSX/CSS novo, verifique:

- [ ] Uso de tokens `--color-*` canônicos; zero hex `#RRGGBB` e zero `[#…]` novos
- [ ] Nenhum alias deprecated (`--bg`, `--ink`, `--surface`, `--brand`, `--gold`…) em código novo
- [ ] Fonte correta: Sora (títulos), Inter (UI), IBM Plex Mono (dados) — via tokens `--font-*`, nunca `font-family` solto ou CDN
- [ ] Raios via `--radius-*` (12/16/20/9999); espaçamento múltiplo de 4
- [ ] Componente reutilizado de `src/components/ui/` quando existir (~95 arquivos; catálogo de 30 em `DESIGN.md`)
- [ ] Motion via `src/lib/motion.ts`; `prefers-reduced-motion` respeitado
- [ ] 4 estados (loading/empty/error/stale) em telas operacionais
- [ ] Light + dark; contraste AA (texto ≥4.5:1, não-texto ≥3:1); foco visível; target ≥44px
- [ ] Assets via `public/brand/*` ou componentes `src/components/{brand,icons}/`; nunca variantes legadas/divergentes (`catalogo-de-assets.md` §1.3, §7)
- [ ] Grafia "Birth Hub 360°" em textos de marca; sem claims não verificadas
- [ ] i18n: não introduzir strings hardcoded fora do padrão existente sem missão

## 4. O que NUNCA fazer

1. **Criar token novo** (`--color-*`, `--font-*`, raio, duração) sem handoff aprovado ao dono (`src/styles/**` → Agente 03; `identidade-visual/**` → Agente 11) — ver `contribuicao.md`.
2. **Usar paleta legada/divergente:** navy/gold `#0B132B/#D4AF37`, laranja `#FF5618`, `elegance.css`/`luxury-tokens.css`/`index.css` (mortos), mini DS de voice-hub, sub-apps `landing/` e `prospecting/outbound/`.
3. **Hardcodar hex** ou classe arbitrária `[#…]` — mesmo "só desta vez".
4. **Inventar componente** quando já existe equivalente em `src/components/ui/` ou no catálogo de 30 de `DESIGN.md`; não criar DS paralelo.
5. **Tratar `identidade-visual/v2/` como oficial** — é proposta não homologada.
6. **Editar arquivos de outro dono** (`AGENTS.md` §15/§16): `prisma/**`→01, `src/App.tsx`+Sidebar→02, `.github/**`+Dockerfile→08, `android/**`+capacitor→09, `identidade-visual/**`+`documentacao-aplicacao/**`→11, `docs/**`→08, `server.ts`/`package.json`→exigem 00.
7. **Declarar pronto sem evidência:** "funciona" não é critério — rodar `npx tsc --noEmit`, `npm run lint`, testes e verificação visual quando aplicável (§28, §32).
8. **Copiar conteúdo da pasta de trabalho** `DOCUMENTOS/IDENTIDADE-VISUAL/` para o repo sem revisão — contém duplicatas divergentes e um `.env` com possível segredo (§19.12: reportar, não copiar).

## 5. Formato de handoff

Local: `.agents/handoffs/onda-<n>/<de>-para-<para>-<slug>.md`. Conteúdo mínimo (`AGENTS.md` §18):

```
De: / Para: / Onda: / Status: (aberto|em-andamento|resolvido) / Prioridade: (bloqueador|alto|normal) / Bloqueador-ref: / Sprint destino:
## Problema
## Arquivo(s) envolvido(s)
## Evidência          ← caminhos, logs, screenshots, comandos executados
## Alteração necessária
## Teste esperado
## Contexto adicional
```

Regras: handoffs são rastreáveis e ficam no repo; não dependa de memória de sessão; ao receber, o destinatário pode atualizar status e adicionar seção de resolução sem apagar o pedido.

## 6. Verdade operacional

Ao reportar, use apenas: IMPLEMENTADO / TESTADO / VALIDADO / VERIFICADO VISUALMENTE / NÃO EXECUTADO / BLOQUEADO (`AGENTS.md` §30). Nunca declare conclusão sem o comando/teste/evidência correspondente.
