De: Agente 00 — Coordenador
Para: Agente 08 (QA, Testes e Release)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-007)
Status: aberto
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest**

- **Dívida técnica:** BT360-DT-0044
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de unificação entre a convenção de testes centralizados em `tests/` e testes co-localizados em `src/`.

**Impacto:** Falsa impressão de alta cobertura; funcionalidades críticas podem ter seus testes unitários quebrados sem alerta no CI.

## Arquivo(s) envolvido(s)

`vitest.unit.config.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-007`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-007` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 08 — W5, TAREFA-SANEAMENTO-007 / BT360-DT-0044)

Status: resolvido.

**Diagnóstico:** a causa raiz já havia sido corrigida antes desta onda — o commit
`8b120cca4` (2026-10-17, "fix(staging): consolidacao das 6 capacidades") adicionou
`src/**/*.test.ts` e `src/**/*.test.tsx` ao `include` de `vitest.unit.config.ts`.
Verificação executada nesta worktree:

- Censo em `src/features`: 234 arquivos `*.test.ts(x)` (212 em `__tests__/`, 22
  co-localizados) — todos casam com os padrões de include atuais.
- Nenhum arquivo `*.spec.*` ou teste fora do padrão `.test.` existe sob `src/`.
- `tests/unit/**` e `src/**` são as únicas raízes que este config reivindica;
  `tests/integration|security|container|e2e|load` pertencem a runners próprios.

**Entrega desta onda (guarda de regressão):** novo teste
`tests/unit/config/vitest-discovery.test.ts` (4 casos, todos verdes) que:

1. exige os padrões `src/**/*.test.ts(x)` e `tests/unit/**/*.test.ts` no include;
2. varre `src/` + `tests/unit/` por arquivos com cara de teste (`*.test.*`,
   `*.spec.*`, `__tests__/**`) e falha listando qualquer órfão de descoberta;
3. falha se algum padrão de include virar letra morta (não casa nenhum arquivo);
4. documenta o caminho de falha: `*.spec.*` e arquivos soltos em `__tests__`
   sem sufixo `.test` NÃO são descobertos — devem ser renomeados.

Observação de implementação: os padrões são extraídos do texto do config (não via
import) porque importar `vitest.unit.config.ts` puxa vite/esbuild, que quebra sob
o ambiente jsdom da suíte (invariante TextEncoder/Uint8Array entre realms).

Evidência: `.agents/runs/agente-08-tarefa-saneamento-007.md`.
