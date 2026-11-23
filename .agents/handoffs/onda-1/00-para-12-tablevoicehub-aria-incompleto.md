# Handoff 00 → Agente 12 (+03 ciente) — TableRow do DS voice-hub: ARIA incompleto

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas); alinhar com ADR-012.

## 1. Problema e backlog
`TableRow` em `src/features/voice-hub/components/design-system/index.tsx:797`
renderiza linhas de tabela com ARIA incompleto — a tabela não expõe
`role="table"`/`aria-rowcount`/`aria-colcount` consistentes e o teclado só cobre
linhas clicáveis. Leitores de tela não conseguem navegar a grade como tabela.
Backlog: A11Y-003 / COMP-002 (P1) · `docs/audits/experience-360/06-COMPONENT-AUDIT.md`.

## 2. Evidência técnica
`src/features/voice-hub/components/design-system/index.tsx:791-800`
(`TableRowProps`/`TableRow`).

## 3. Agente responsável e ownership
Arquivo dentro de `src/features/voice-hub/**` → **Agente 12** é dono
(`src/features/voice-hub/AGENTS.md`). Coordenação com Agente 03 (a11y/DS) porque
o padrão correto deve convergir com `ui/` na reconciliação (ADR-012) —
**não duplicar solução divergente**.

## 4. Causa raiz
DS paralelo implementou tabela com roles parciais em vez de semântica nativa
`<table>` ou ARIA grid completo.

## 5. Solução mínima proposta
- Opção preferida: migrar para `<table>/<tr>/<td>` nativos (semântica grátis,
  teclado e SR resolvidos) **se** o layout permitir.
- Se a estrutura visual exigir divs: aplicar ARIA completo
  (`role="table"`, `row`, `cell`/`columnheader`, `aria-rowcount`,
  `aria-colcount`) + navegação por setas, espelhando o padrão que será
  promovido a `ui/`.
- **Não** criar um terceiro padrão — alinhar com a direção do ADR-012.

## 6. Arquivos que poderão ser modificados
- `src/features/voice-hub/components/design-system/index.tsx` (apenas o bloco
  Table*).
- Consumidores da Table no voice-hub se a API do componente mudar.

## 7. Dependências e riscos
- Depende da direção do DS (ADR-012): se `ui/` absorverá o padrão, corrigir aqui
  de forma compatível evita retrabalho.
- Risco moderado: tabelas do voice-hub podem depender de layout custom (divs) —
  testar cada consumidor.

## 8. Critérios de aceite
- Navegação por leitor de tela anuncia tabela com linhas/células corretas.
- Teclado navega as linhas interativas.
- axe-core sem violações de tabela na(s) tela(s) que usam Table.

## 9. Testes obrigatórios
- axe nas telas do voice-hub que usam Table.
- Verificação manual SR (NVDA/VoiceOver) se disponível.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; componente isolado, sem contrato externo.

## 11. Atualização 2026-11-22 (baseline + ownership)
- **Ownership:** CONFIRMADO — Agente 12 (Squad 60); coordenação com Agente 03
  mantida. Atenção: o arquivo vive no `design-system/` paralelo do voice-hub —
  se COMP-001 decidir deprecar esse DS, esta correção pode ser absorvida pela
  migração para `ui/`. Verificar status do COMP-001 antes de implementar para
  não retrabalhar.
