De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 00 — Coordenador
Onda: 1
Status: resolvido
Prioridade: alto
Bloqueador-ref: DEM-20261113-002 / parecer 24 (G-1)
Sprint destino: onda-1

## Problema

AGENTS.md §15 exige aprovação explícita do Agente 00 para alterar
`package.json`. A Onda 1 adicionou 1 linha de script:

```json
"verify:rls-coverage": "tsx scripts/security/check-rls-coverage.ts",
```

O script executa o gate estático de cobertura RLS (MEL-03) criado nesta onda.
Sem essa linha, o gate existe mas não tem atalho npm — pode ser rodado via
`npx tsx scripts/security/check-rls-coverage.ts` diretamente.

O Agente 24 emitiu APROVADO **condicionado** a esta aprovação
(`.agents/reviews/onda-1/24-revisao-15-onda1-pos-correcao.md`).

## Arquivo(s) envolvido(s)

- `package.json` (diff de 1 linha, commit 48feeaf43)
- `scripts/security/check-rls-coverage.ts` (script referenciado)

## Evidência

- `npm run verify:rls-coverage` → exit 0, 135 tabelas tenant-bearing OK.
- Handoff 15→08 aberto para ligar o gate no CI.

## Alteração necessária

Decisão do 00: aprovar retroativamente a linha em `package.json` (recomendado
— habilita o gate no CI via npm script) ou ordenar remoção (gate continua
executável via `npx tsx`).

## Teste esperado

Se aprovado: nenhuma ação adicional; o script já funciona.
Se negado: remover a linha e ajustar handoff 15→08 para usar `npx tsx`.

## Contexto adicional

Branch `agente/15-onda1-seguranca`, worktree
`C:\Github\Birthub-360-worktrees\agente-15-onda1-seguranca`.

## Resolução

- 2026-11-13 (Agente 00): APROVADO retroativamente. O script
  `verify:rls-coverage` permanece em package.json e será ligado ao CI pelo
  Agente 08 (handoff 15→08).
