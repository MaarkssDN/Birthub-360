De: Agente 00 — Coordenador
Para: Agente 11 (Marca e Ativos Institucionais)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-051)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Divergência de nomenclatura entre tokens de cores na BrandConstitution e variáveis Tailwind**

- **Dívida técnica:** BT360-DT-0060
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Evolução da identidade visual documentada na Brand Constitution que foi apenas parcialmente refletida na hierarquia das variáveis CSS globais.

**Impacto:** Dificuldade de manter fidelidade estrita ao manual de marca em novas páginas e componentes.

## Arquivo(s) envolvido(s)

`docs/BrandConstitution.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-051`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-051` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 11 — 2026-11-10)

`docs/BrandConstitution.md` atualizado:

- Tabela de paleta agora mapeia cada cor oficial ao token canônico
  (`--palette-neon-*` dos tokens de `identidade-visual/birthhub360/tokens/` e
  `--color-neon-*` do `@theme` Tailwind v4), eliminando a divergência de
  nomenclatura documentada.
- "Branco Neon (Texto)" corrigido: `#F8F9FF` permanece como branco institucional
  (`--palette-neon-white`); texto corrido documentado como **Azul Leitura**
  `#70D6FF` (`--color-text-primary`/`--ink`), refletindo a decisão de contraste
  já implementada em `globals.css`.
- Tons Light corrigidos para os valores canônicos: Rosa claro `#D91B7C`
  (era `#E6007A`), Azul claro `#0284C7`, Dourado `#D97706`.
- Gradientes agora citam os tokens `--grad-brand`/`--grad-cta`.
- §3 Tipografia alinhada aos tokens canônicos (Sora display, Inter interface,
  IBM Plex Mono dados — self-hosted em `public/fonts/`); a divergência residual
  em `src/styles/official-identity.css` (Plus Jakarta Sans/Outfit/Nunito) foi
  registrada como nota e aberta em handoff para o Agente 03.
- Referência a `preview.html` inexistente substituída pelos arquivos reais
  `BirthHub360_*.html`.
- §6 passou a listar os utilitários neon do `@theme` (`neon-blue`, `neon-pink`,
  `neon-gold`, `neon-card`, `neon-border`, tons `light-*`).

**Pendência fora da propriedade do Agente 11:** valores divergentes em
`src/styles/globals.css` (`--color-neon-white`/`--light-pink`/`--light-blue`) e
pilhas de fonte em `official-identity.css` → handoff
`11-para-03-divergencias-residuais-de-tokens-de-cor-e-fonte-entre-globals-e-tokens-canonicos.md`.

**Observação de propriedade:** `docs/AGENTS.md` atribui `docs/` ao Agente 08,
mas este handoff designou `docs/BrandConstitution.md` ao Agente 11 por ser
ativo de governança de marca; alteração foi cirúrgica e restrita a esse arquivo.
