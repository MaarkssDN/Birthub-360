# Licenciamento — Birth Hub 360°

**Propósito:** registrar o estado de licenciamento dos ativos de terceiros consumidos pelo Brand System (fontes, ícones, bibliotecas de motion) e os deveres de atribuição, sem inventar licenças não verificadas.

**Escopo:** dependências em `package.json`, arquivos em `public/fonts/`, `node_modules/*/LICENSE` e `package.json` das libs, e a lista de referências normativas `99_FONTES_OFICIAIS.txt`. Não cobre licenciamento de imagens/fotos de terceiros (NÃO VERIFICADO se `hero-team.jpg` e PNGs da pasta de trabalho contêm pessoas/ativos licenciados — verificar antes de uso externo).

**Estado:** verificado em 2026-11-19 onde indicado; o restante marcado **NÃO VERIFICADO**.

**Data:** 2026-11-19 · **Fontes:** `public/fonts/`, `src/styles/globals.css`, `package.json`, `node_modules/{lucide-react,framer-motion,motion,@radix-ui/react-slot}`, `DOCUMENTOS/IDENTIDADE-VISUAL/02_IDENTIDADE_VISUAL/99_FONTES_OFICIAIS.txt`, `identidade-visual/brand-system/_FATOS-CANONICOS.md`.

**Documentos relacionados:** `catalogo-de-assets.md`, `../00-GOVERNANCA/inventario-de-fontes.md`, `contribuicao.md` (em `../08-GUIAS-DE-IMPLEMENTACAO/`).

---

## 1. Fontes self-hosted

As três famílias canônicas são servidas localmente de `public/fonts/` via `@font-face` em `src/styles/globals.css` — não há chamada a CDN em runtime (TAREFA-SANEAMENTO-017).

| Família | Licença | Evidência no repo | Status |
|---|---|---|---|
| IBM Plex Mono | SIL Open Font License 1.1 | `public/fonts/OFL-IBM-Plex-Mono.txt` presente ("This Font Software is licensed under the SIL Open Font License, Version 1.1") | **CONFIRMADO** — licença distribuída junto aos arquivos |
| Sora | SIL Open Font License 1.1 (upstream: google/fonts) | **Nenhum arquivo de licença em `public/fonts/` para Sora**; apenas WOFF2 | **PARCIALMENTE VERIFICADO** — a licença upstream é OFL, mas o texto da licença **não está no repositório**; recomendo copiar o OFL correspondente (**[PROPOSTO]**, handoff Agente 11/01) |
| Inter | SIL Open Font License 1.1 (upstream: rsms/inter) | Idem Sora — sem arquivo de licença no repo | **PARCIALMENTE VERIFICADO** — mesmo **[PROPOSTO]** de incluir o texto OFL |
| Nunito / Outfit / Plus Jakarta Sans (`public/fonts/brand/`) | SIL OFL (upstream) | Sem arquivos de licença; famílias legadas não referenciadas | **NÃO VERIFICADO** para efeito de conformidade — candidatas a remoção (§19.5 dos fatos) |

**Nota de conformidade OFL:** a OFL permite uso, estudo, modificação e redistribuição, inclusive em software, desde que a fonte não seja vendida sozinha e o copyright notice seja mantido. Manter os arquivos `OFL-*.txt` ao lado dos WOFF2 é a prática correta — hoje só IBM Plex Mono cumpre isso.

## 2. Bibliotecas de ícones e motion (npm)

| Pacote | Versão (`package.json`) | Licença | Evidência | Status |
|---|---|---|---|---|
| `lucide-react` | `^1.38.0` (`package.json:179`) | ISC | `node_modules/lucide-react/LICENSE` ("ISC License, Copyright (c) 2026 Lucide Icons and Contributors") + `"license": "ISC"` no package.json da lib | **CONFIRMADO** |
| `framer-motion` | `^13.1.1` (`package.json:174`) | MIT | `"license": "MIT"` em `node_modules/framer-motion/package.json` (sem arquivo LICENSE próprio no pacote) | **CONFIRMADO** |
| `motion` | `^13.4.3` (`package.json:183`) | MIT | `"license": "MIT"` em `node_modules/motion/package.json` | **CONFIRMADO** |
| `@radix-ui/react-slot` | `^1.2.4` (`package.json:133`) | MIT | `node_modules/@radix-ui/react-slot/LICENSE` ("MIT License, Copyright (c) 2022 WorkOS") | **CONFIRMADO** |
| `embla-carousel-react`, `vaul` | `^8.6.0`, `^1.1.2` | — | Sem LICENSE no pacote instalado; licença upstream **NÃO VERIFICADO** neste documento | **NÃO VERIFICADO** |

## 3. Ativos proprietários da marca

| Ativo | Titular | Observação |
|---|---|---|
| Logos SVG (`birthhub360-*.svg`), personagens (29 SVGs), tokens `birthhub360.*`/`characters.*`, ilustrações próprias | Birth Hub 360° (projeto) | Criação interna; **não há registro de marca (INPI) verificado** — **NÃO VERIFICADO** |
| Uso de nomes de agentes/personagens (Orbit, Nexus, Aria…) em campanhas | idem | Verificar anterioridade/registro antes de uso publicitário externo — **NÃO VERIFICADO** |
| Crédito institucional | `BRAND.credit` em `src/config/brand.ts:89` ("Desenvolvido pelo Coordenador Comercial Marcelo do Nascimento") | Manter em telas institucionais |

## 4. Referências normativas — `99_FONTES_OFICIAIS.txt`

Arquivo localizado em `DOCUMENTOS/IDENTIDADE-VISUAL/02_IDENTIDADE_VISUAL/99_FONTES_OFICIAIS.txt` (**fora do git** — pasta de trabalho). É uma **lista de fontes de consulta**, não um pacote de licenças. Conteúdo (verificado):

- ANPD — comunicação de incidentes, direitos dos titulares, encarregado, guia de cookies, regulamentações, Resolução CD/ANPD 15/2024, transferências internacionais (links gov.br);
- Código de Defesa do Consumidor (Lei 8.078/1990);
- LGPD atualizada 2026 e Lei de Direitos Autorais 9.610/1998 (planalto.gov.br);
- W3C WCAG 2.2 e critério 1.4.3 (contraste mínimo);
- Nota final do arquivo: "não substitui revisão jurídica".

**Relevância para este documento:** a Lei 9.610/1998 (Direitos Autorais) é a base legal para licenciamento de fontes e ícones no Brasil; LGPD/ANPD aplicam-se a dados pessoais em materiais de marketing (ver `../01-MARCA/identidade-verbal.md` e governança do Agente 21). Este arquivo **não** foi encontrado dentro do repositório — se for necessário versioná-lo, promover via handoff (**[PROPOSTO]**).

## 5. Pendências de licenciamento

1. **[PROPOSTO]** Adicionar `OFL-Sora.txt` e `OFL-Inter.txt` em `public/fonts/` (handoff Agente 11).
2. Verificar licenças upstream de `embla-carousel`, `vaul` e demais deps de UI (**NÃO VERIFICADO**).
3. Verificar se imagens de pessoas em `04_ASSETS_VISUAIS/*.png` e `public/landing/assets/hero-team.jpg` têm licença/consentimento para uso público (**NÃO VERIFICADO** — reportar ao Agente 21 se houver risco LGPD).
4. `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/.env` — possível segredo; reportado nos fatos canônicos §19.12, **não inspecionado**.
