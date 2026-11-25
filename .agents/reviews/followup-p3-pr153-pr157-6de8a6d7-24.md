# Parecer Agente 24 — PR #157 @ 6de8a6d7 (re-revisão)

- **Missão:** follow-ups P3 do parecer 24 do PR #153
- **Autor:** MarksNN — branch `agente/wf2-p3-followup-153`
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** origin/main 2d62f9fa566eecf31a0c1a70f679cca794a2760a
- **SHA auditado:** 6de8a6d73c00c7f051e2323855c9e4d27d399095 (reverificado imediatamente antes da escrita)
- **Parecer anterior:** REPROVADO @ c36ffd28 (branch `agente/24-review-pr157-c36ffd28`)
- **Escopo incremental (c36ffd28..6de8a6d7, 1 commit):** `ExternalCrmPanel.tsx` (formatação de uma linha) e `.gitleaksignore` (texto da justificativa).

## Decisão: **BLOQUEADO**

Os achados P1 e P2 anteriores foram corrigidos. O bloqueio é de gate: o application gate do Release falha (4 erros Biome herdados da main) e os testes unitários não rodam no CI. Teste obrigatório não executado não é aprovação.

## Evidências
| Item | Resultado |
|---|---|
| P1 anterior (erro de format em ExternalCrmPanel.tsx:809–810) | **Corrigido** — `<div className=...>` em uma linha |
| P2 anterior ("Valor confirmado") | **Corrigido** — agora "Verificado pelo WF2 como aparente chave só de teste (CONFIRMAÇÃO HUMANA PENDENTE)" |
| Release 41408899315 | failure — **4 errors / 643 warnings**, mesmo conjunto de erros da main (41406269451: 4/645). Nenhum erro novo; −2 warnings. |
| Visual Regression 41408899362 | **success** |
| Bundle Budget 41408899251, CodeQL 41408899201, Dependency Review 41408899225, Trivy 41408899432 | success |
| SonarQube 41408899385 | em andamento na escrita (falha herdada na main 41406269361) |
| Testes locais | 212/212 @ c36ffd28 (vitest.unit.config.ts). O incremental só muda formatação/comentário, sem efeito em runtime. |

### Visual Regression (CRM/Prospecção) — não atribuível ao PR
A falha em 41407448644 (@c36ffd28: 1 failed, 2 flaky em screenshots CRM/prospect) não é deste PR:
- o mesmo PR passou no VR em 6de8a6d7 (41408899362) e a mudança incremental não altera render;
- o PR `agente/wf1-format-release-gate` (run 41405426428, sem relação com ExternalCrmPanel) teve as mesmas falhas de `toHaveScreenshot` em CRM e Integrações (light/dark);
- não há execução recente de VR na main para comparar. Conclusão: as baselines CRM/Integrações são instáveis (flaky), um problema que já existia.

## Achados
- Sem P1.
- **P3-1 (mantido):** o caso de sucesso do teste depende de `openssl` no runner.
- **P3-2:** flakiness do VR em CRM/Integrações — follow-up para o dono das baselines visuais.

## Pendências
- Confirmação humana (Marcelo) de que `PII_BLIND_INDEX_KEY` em `.env.test.example` é só de teste.
- Gate de testes unitários verde no CI (depende de corrigir os 4 erros Biome herdados).
- Conclusão do SonarQube 41408899385.

Atualização futura do PR: via merge da main na branch (sem rebase).
