De: 00 — Coordenador
Para: 11 — Marca e Ativos Institucionais
Onda: personagens-29-20261110
Status: resolvido
Prioridade: normal
Bloqueador-ref: .agents/reviews/2026-11-10-expansao-personagens-9-29-24.md
Sprint destino: expansão visual 9→29

## Problema

`identidade-visual/**` (propriedade do Agente 11) foi alterado sem handoff prévio:

1. 20 novos SVGs em `identidade-visual/birthhub360/characters/` (espelho dos
   assets de `public/brand/characters/`).
2. `tokens/characters.css`: +~220 linhas de variáveis `--char-<id>-*` (dark+light)
   para os 20 novos personagens.
3. `tokens/characters.json` e `tokens/characters.ts`: seção `agentCharacters` /
   `BIRTHHUB_AGENT_CHARACTERS` gerada por `scripts/sync-character-brand-tokens.ts`.

## Arquivo(s) envolvido(s)

- `identidade-visual/birthhub360/characters/*.svg` (20 novos)
- `identidade-visual/birthhub360/tokens/characters.{css,json,ts}`

## Evidência

- Os 9 personagens-pilar originais NÃO foram tocados (IDs, nomes, tokens,
  expressões preservados).
- Paleta derivada dos tokens oficiais (neon blue/pink/gold, iris, success, error).
- viewBox 128×128, `<title>`/`<desc>` acessíveis, sem URLs externas.
- `BirthHub360_Personagens.html` (protótipo) ainda ilustra apenas os 9 —
  atualização opcional fica a critério do dono.

## Alteração necessária

Ratificar os novos assets/tokens ou apontar ajustes de identidade visual.
Avaliar se o guia mestre (`GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`) deve ser
atualizado para documentar os 29.

## Teste esperado

XML válido nos 29 SVGs; variáveis CSS consistentes com o catálogo
`src/features/characters/characterCatalog.ts`.

## Contexto adicional

Ver parecer do Agente 24 em `.agents/reviews/2026-11-10-expansao-personagens-9-29-24.md`.

## Resolução

**Parecer do Agente 11 (Marca e Ativos Institucionais): RATIFICADO — sem ajustes obrigatórios.**

Evidências verificadas no commit `aac2839fd`:

1. **9 pilares intactos.** `git show aac2839fd -- identidade-visual/birthhub360/tokens/characters.css`
   contém apenas adições (+211 linhas, zero deleções). Em `characters.json`/`characters.ts` as
   únicas linhas removidas são normalização de ponto flutuante (`0.70`→`0.7`, `1.10`→`1.1`) gerada
   pelo script de sync — valores semanticamente idênticos. IDs, nomes e tokens dos 9 originais
   preservados.
2. **20 SVGs conformes.** Todos com `viewBox="0 0 128 128"`, `<title>`/`<desc>` únicos e
   descritivos (ex.: aegis = "escudo de orquestração", seal = "selo de cera digital", vox =
   "diamante emissor de voz"), `role="img"` + `aria-labelledby`, zero URLs externas (única
   ocorrência de `http` é o `xmlns`). Geometrias abstratas não-humanas e distintas entre si
   (escudo, selo, emissor de voz, etc.), alinhadas ao princípio "Dots não-humanos" do guia.
3. **Paleta derivada dos tokens oficiais.** Cores dominantes: `#00D4FF` (82×), `#FFC107` (49×),
   `#FF2D9B` (38×), `#0D0D0D` (42×), `#8B7DFF` (18×), com variantes/tints de `#F8F9FF`/iris —
   coerente com a marca neon luxury.
4. **Tokens consistentes.** `characters.css` traz `--char-<id>-{primary,secondary,accent,halo,
   card-grad}` para os 20 novos em tema escuro (`:root`) e claro (`[data-theme="light"]`,
   ~linhas 217–329). `characters.json` expõe exatamente 20 chaves em `agentCharacters`
   (axiom…aegis), espelhando `src/features/characters/characterCatalog.ts` via
   `scripts/sync-character-brand-tokens.ts`. `BIRTHHUB_AGENT_CHARACTERS` exportado em
   `characters.ts` (linha 710).
5. **Coerência com o guia mestre.** Os 20 novos são personagens de **agente** (camada
   `agentCharacters`, arquétipos "Non-Human … Cell"), não pilares funcionais — camada distinta
   da matriz dos 9 documentada em `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`.

### Recomendações (não bloqueantes)

- **Guia mestre:** o documento hoje cobre apenas os 9 pilares. Recomendo, em onda futura, um
  adendo/seção "Personagens de Agente (camada `agentCharacters`)" documentando os 20 novos —
  arquétipos, paletas e regra de que não representam pilares. Fica a critério do 00/11.
- **Protótipo `BirthHub360_Personagens.html`:** ainda ilustra apenas os 9. Atualização opcional;
  sugiro incluir os 20 agentes em seção separada quando houver demanda de demo.
- **Processo:** a alteração em `identidade-visual/**` ocorreu sem handoff prévio. Recomendo que
  futuras expansões de catálogo gerem handoff para o 11 antes do commit, mesmo quando o diff for
  puramente aditivo.
