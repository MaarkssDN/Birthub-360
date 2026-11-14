# Roster ↔ sessões (reconciliado com AGENTS.md §3 e `.agents/bus/roster.json`)

Fonte: AGENTS.md §3 (26 agentes). Observação: os IDs reais são 00–18, 21–24 mais as variantes
01A, 06A e 08A. Os IDs 19 e 20 são reservados (AGENTS.md §4) e **não existe agente 25**.
Os subagentes `03A–03G` em `.agents/prompts/` são especialistas internos do 03, não sessões.

| ID | Nome da sessão | Prompt |
|----|----------------|--------|
| 00 | 00 — Coordenador (Orquestrador Geral) | `.agents/prompts/00-coordenador.md` |
| 01 | 01 — Plataforma, Segurança e Dados | `01-plataforma-dados.md` |
| 01A | 01A — Confiabilidade de Dados, RLS e Retenção | `01A-dados-rls-retencao.md` |
| 02 | 02 — Produto e UX | `02-produto-ux.md` |
| 03 | 03 — Design e Acessibilidade | `03-design-a11y.md` |
| 04 | 04 — CRM e BI | `04-crm-bi.md` |
| 05 | 05 — Prospecção | `05-prospeccao.md` |
| 06 | 06 — Integrações e Bitrix | `06-integracoes-bitrix.md` |
| 06A | 06A — Extrações Bitrix | `06A-extracoes-bitrix.md` |
| 07 | 07 — IA e Automações | `07-ia-automacoes.md` |
| 08 | 08 — QA e Release | `08-qa-release.md` |
| 08A | 08A — Operações Git e Deploy AWS | `08A-git-deploy-aws.md` |
| 09 | 09 — Mobile | `09-mobile.md` |
| 10 | 10 — Infraestrutura, Observabilidade e SRE | `10-infraestrutura-sre.md` |
| 11 | 11 — Marca e Ativos Institucionais | `11-marca-institucional.md` |
| 12 | 12 — Voz e Telefonia | `12-voz-telefonia.md` |
| 13 | 13 — Enxame Autônomo e Governança de Agentes de Runtime | `13-enxame-governanca-agentes.md` |
| 14 | 14 — Ambiente de Execução e Test Harness | `14-ambiente-execucao-harness.md` |
| 15 | 15 — Segurança Aplicada e Rotação de Segredos | `15-seguranca-aplicada.md` |
| 16 | 16 — Runtime, Workers e Escala | `16-runtime-workers-escala.md` |
| 17 | 17 — Cadência Multicanal e Ciclo de Receita | `17-cadencia-ciclo-receita.md` |
| 18 | 18 — Contratos, API e Documentação Viva | `18-contratos-api-docs.md` |
| 21 | 21 — Privacidade e LGPD | `21-privacidade-lgpd.md` |
| 22 | 22 — Verificação de Realidade | `22-verificacao-realidade.md` |
| 23 | 23 — Custo, Performance e Limites de IA | `23-custo-performance-ia.md` |
| 24 | 24 — Revisão Independente | `24-revisao-independente.md` |

## Estado das sessões (atualizado só pelo 00)
Ver tabela em `demands/INDEX.md` → "Sessões conhecidas".

## Prompt padrão de especialista (usado por `start_session`, Agent Bus ou subagente)
> Você é o Agente NN. Leia AGENTS.md e .agents/prompts/NN-<slug>.md antes de planejar. Siga
> docs/orchestration/PROTOCOLO.md e docs/orchestration/PROTOCOLO_QUALIDADE_E_ACEITE.md. Demanda: <ID>.
> Contexto/objetivo/critérios: <...>. Registre em docs/orchestration/journal/NN.md e na ficha da demanda.
> Responda ao Agente 00 (sessão ou Agent Bus na porta 4100) com evidências verificáveis.
