De: Agente 11 — Marca e Ativos Institucionais
Para: Agente 03 — Design e Acessibilidade
Onda: Onda 5 (Plano Mestre de Saneamento — decorrente de TAREFA-SANEAMENTO-051 / BT360-DT-0060)
Status: aberto
Prioridade: normal
Bloqueador-ref: BT360-DT-0060
Sprint destino: Onda 5

## Problema

Divergências residuais entre os tokens canônicos de marca
(`identidade-visual/birthhub360/tokens/` e `src/config/brand.ts`) e as variáveis
CSS/Tailwind em `src/styles/**` (propriedade do Agente 03). O Agente 11 corrigiu
a documentação (`docs/BrandConstitution.md`), mas os valores em código exigem
decisão do dono do design system.

## Arquivo(s) envolvido(s)

- `src/styles/globals.css` (`:root` ~L100-130 e `@theme` ~L621-634)
- `src/styles/official-identity.css` (`--font-brand-sans`/`--font-brand-display`, ~L40-42)
- `src/styles/globals.css` L1 (import Google Fonts: Nunito/Outfit/Plus Jakarta Sans)

## Evidência

1. **`--color-neon-white` / `--neon-white` = `#70D6FF`** (globals.css L115-116, L626-627),
   mas o token canônico `--palette-neon-white` = `#F8F9FF`
   (`identidade-visual/birthhub360/tokens/birthhub360.css` L50) e
   `BRAND.colors.neonWhite` = `#F8F9FF` (`src/config/brand.ts` L55).
   O próprio `globals.css` documenta `#70D6FF` como "Azul Leitura" para texto
   corrido — se a intenção é manter `#70D6FF` como tinta de leitura, o nome
   `neon-white` está semanticamente errado e induz erro em novos componentes.
2. **`--light-pink` = `#E6007A`** (globals.css L124) vs canônico `#D91B7C`
   (`--palette-pink`/`--color-heading-pink` no tema claro, `BRAND.colors.lightPink`).
3. **`--light-blue` = `#0369A1`** (globals.css L125) vs canônico `#0284C7`
   (`--palette-cyan` no tema claro, `BRAND.colors.lightBlue`). Nota: `#0369A1`
   corresponde a `--color-brand-primary`/`--color-interactive-primary` do tema
   claro nos tokens — pode ser deliberado para interativo, mas diverge do tom
   "light blue" documentado.
4. **Tipografia**: tokens canônicos e `@font-face` self-hosted declaram
   Sora (display) + Inter (interface) + IBM Plex Mono (dados). Já
   `official-identity.css` L40-41 prefere "Plus Jakarta Sans"/"Outfit"/"Nunito"
   via import Google Fonts (globals.css L1) — famílias que não constam nos
   tokens nem têm `@font-face` self-hosted em `public/fonts/`.

## Alteração necessária

Decidir e, se necessário, alinhar os tokens acima à fonte canônica
(`identidade-visual/birthhub360/tokens/` + `src/config/brand.ts`), ou registrar
decisão formal de que `#70D6FF`/`#E6007A`/`#0369A1` e a pilha
Plus Jakarta/Outfit/Nunito são os valores oficiais de implementação — nesse caso
o Agente 11 atualizará `docs/BrandConstitution.md` e os tokens de
`identidade-visual/` para refletir.

## Teste esperado

- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Verificação visual de contraste (axe-core/e2e de acessibilidade existentes)
  após qualquer mudança de valor de cor.

## Contexto adicional

- `docs/BrandConstitution.md` já foi atualizado nesta onda para documentar os
  nomes canônicos de token e apontar explicitamente estas divergências.
- Nenhum arquivo de `src/**` foi alterado pelo Agente 11.
