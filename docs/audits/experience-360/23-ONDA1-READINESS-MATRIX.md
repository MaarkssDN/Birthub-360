# 23 — Matriz de Prontidão para Execução da Onda 1

**Data:** 2026-11-23 · **HEAD:** `80b1a335b` + docs · **Status geral: NO-GO**

Critérios exigidos pelo Orquestrador para solicitar autorização de implementação.

## 1. Gates obrigatórios

| # | Critério | Status | Evidência / bloqueio |
|---|---|---|---|
| G1 | Baseline visual executada | ✅ | CI Linux runs `45084163511`/`45086319222`: 74/88; 14 diffs = drift preexistente em `main` (prova comparativa) |
| G2 | Baseline funcional em browser | ❌ | Requer Postgres/Redis/Meilisearch + auth; Docker local indisponível. Alternativa: executar no CI ou devcontainer — **decisão do Orquestrador** |
| G3 | Baseline a11y (axe/WCAG 2.2 AA) | ⚠️ | Inventário estático Agente 14 + `07-ACCESSIBILITY-AUDIT.md`; sem reexecução autenticada em browser |
| G4 | Temas claro/escuro verificados | ⚠️ | Coberto parcialmente pelos 74 passes visuais (ambos temas); sem validação interativa |
| G5 | Gates técnicos no HEAD homologado | ⚠️ | `typecheck` PASS · `lint` exit 0 (1.517 warnings) · `build` PASS · `test:unit` **33 falhas reais preexistentes em `main`** (6 arquivos — `21-BASELINE-REPORT.md` §3.6); branch não altera código |
| G6 | Ownership reconciliado | ⚠️ | Proposta em `22-OWNERSHIP-MATRIX.md` — `characters`→07 e `signals-risks`→04 **pendentes de ratificação**; numeração local × roster global em reconciliação |
| G7 | Handoffs atualizados com evidências | ✅ | 8 P1 + OPP-01 em `.agents/handoffs/onda-1/` com baseline, dependências ambientais e status de ownership |
| G8 | Parecer independente Silas (§40) | ❌ | Handoff `00-para-09-silas-auditoria-independent-experience360.md` pronto; aguarda execução em contexto realmente separado |
| G9 | Defeitos reais separados de impedimentos | ✅ | `21-BASELINE-REPORT.md` §5: 0 regressões novas na branch; 14 diffs = drift de `main`; bloqueios ambientais isolados |
| G10 | Decisão sobre drift de baseline (14 diffs) | ❌ | Humano deve revisar imagens diff e autorizar (ou não) atualização de snapshots em sessão própria |
| G11 | Riscos residuais documentados | ✅ | `17-RISK-DEPENDENCY-MATRIX.md`, `19-PENDING-DECISIONS.md` |

## 2. Resumo

- **Verdes:** G1, G7, G9, G11. **G5 parcial** (unit com 33 falhas preexistentes
  em `main` — não bloqueia a Onda 1 por si só, mas deve ser reportada).
- **Parciais:** G3, G4, G6.
- **Bloqueantes:** G2 (infra), G8 (Silas), G10 (decisão humana sobre snapshots).

## 3. Caminho mínimo para NO-GO → GO

1. Executar baseline funcional/a11y autenticada no CI ou com Docker local ativo.
2. Ratificar ownership pendente (`characters`, `signals-risks`) e confirmar
   numeração local × roster global.
3. Obter parecer Silas (instância independente) sobre handoffs, ADRs, DL e
   confiabilidade do plano de baseline.
4. Deliberação humana sobre os 14 diffs de snapshot em `main`.
5. Nova deliberação expressa do Orquestrador autorizando implementação.

## 4. Riscos residuais que seguem abertos

- `test:visual` local Windows nunca produzirá baseline válida (baselines só-linux)
  — recomenda-se declarar CI como ambiente oficial da suíte.
- Command Palette ignora permissões (achado estático P1/P2) — sem validação
  runtime ainda.
- `useFetch` sem race-guard e providers sem `useMemo` — débito transversal
  confirmado estaticamente; impacto real depende de medição em runtime.
- Backend Voice Hub 503 é intencional (`legacyModuleGate`); fallback proposto
  é paliativo — correção definitiva segue no backlog.
