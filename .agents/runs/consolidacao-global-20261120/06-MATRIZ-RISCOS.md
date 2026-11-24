# 06 — MATRIZ DE RISCOS
Data: 2026-11-20 · Severidade: 🔴 crítico · 🟠 alto · 🟡 médio · 🟢 baixo

| ID | Risco | Sev | Probabilidade | Mitigação / dono |
|---|---|---|---|---|
| R-01 | **Release-readiness state desatualizado** — NO-GO de 19/11 antecede 7 merges de débitos | 🔴 | certa | re-reconciliação em curso; novo veredito antes de qualquer claim de GO |
| R-02 | **Remap de agentes não aprovado** — handoffs/reviews citam IDs mortos; ownership ambíguo pode causar edição em arquivo de outro dono | 🔴 | alta | proposta de mapa → aprovação humana (D-P1) antes de novos despachos |
| R-03 | **#434/#437 podem continuar vermelhos** — ownership test e/ou flaky "Round 1 de 3" podem falhar de novo após #466 | 🟠 | média | re-run após #466; se flaky persistir, debitar teste (G-44) |
| R-04 | **Backup sem lastro operacional** — código pronto mas nada dispara em prod; RPO real = ∞ | 🔴 | certa até decisão | D-P4/D-P9/D-P10; até lá tratar backup como NÃO RESOLVIDO operacionalmente |
| R-05 | **verify:ai/verify:integrations bloqueantes** (#430) — LLM real + BrasilAPI em todo PR → flakes/custo | 🟡 | média | observar primeiros runs; D-P8 se flakkar |
| R-06 | **46 worktrees + dezenas de branches** — risco de perda de trabalho não integrado e conflitos futuros | 🟡 | média | inventário G-37; só remover worktree limpo e mergeado |
| R-07 | **PRs stale conflitantes** (#361/#366/#368 etc.) — podem conter trabalho único ainda não resgatado | 🟡 | média | triagem G-36 antes de fechar |
| R-08 | **Workaround pending→Skipped+providerMessageId** (cadence) — funcional mas semanticamente errado até enum real | 🟡 | baixa | G-28 schema fix remove workaround |
| R-09 | **Untracked files no worktree principal** (handoffs onda-review, decisão 02, brand-system) — podem se perder em faxina | 🟡 | baixa | verificar se #449 já integrou; commitar ou descartar conscientemente |
| R-10 | **moduleRegistry/moduleThemes WIP** de outra sessão — não tocar, mas pode conflitar com Onda 1 a11y | 🟢 | baixa | dono da sessão resolve |
| R-11 | **SonarQube flaky tests** (2 falhas UI intermitentes) derrubam gate de PRs alheios | 🟡 | média | G-44 débito de teste |
| R-12 | **Dependências vulneráveis** — GitHub reporta advisories recorrentes (GHSA-7589 resolvido via #465; novas podem surgir) | 🟡 | média | 99 Vito/AppSec + waivers process |
| R-13 | **Decisões humanas acumuladas** (D-P2..D-P12) bloqueiam ~8 débitos e o veredito final | 🔴 | certa | checklist de decisões apresentado ao orquestrador |
| R-14 | **Conversas paralelas sem relatório forense** — waves D/E, Onda 1, AUD-1 conhecidas só por PRs | 🟡 | média | recuperar relatórios antes de arquivar aquelas conversas |
| R-15 | **merge --admin normalizado** — 3 usos recentes (#412/#390/#465); erosão de gate se virar hábito | 🟡 | baixa | registrar justificativa por uso (feito em 05) |
