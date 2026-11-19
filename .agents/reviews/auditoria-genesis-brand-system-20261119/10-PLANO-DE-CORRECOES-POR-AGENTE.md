# 10 — Plano de Correções por Agente Especializado
## AUDITORIA TÉCNICA INDEPENDENTE — OPERAÇÃO GENESIS BRAND SYSTEM
### Repositório: Birthub 360 | Data: 19/11/2026 | Auditor: Google Antigravity

---

## 1. Princípios de Execução e Ownership

Em estrito cumprimento do `AGENTS.md`:
- O Antigravity não executa alterações diretas em código de produto nem assume propriedades alheias.
- Cada ação corretiva, migração de código ou ajuste documental foi fatiado e atribuído ao seu respectivo proprietário de domínio.
- As ações dependentes de aprovação humana aguardarão a homologação do Orquestrador antes do disparo.

---

## 2. Matriz de Distribuição de Tarefas por Agente

### 2.1 Agente 00 — Coordenação Global
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-00-1** | Registrar formalmente as deliberações do Orquestrador Humano para D1 a D12 | Resposta humana às perguntas do relatório final | `.agents/runs/00-deliberacoes-genesis-20261119.md` |
| **ACT-00-2** | Fechar formalmente o PR #368 (`agente/00-paleta-oficial-migracao`) | Confirmação da recomendação C2/C12 | PR fechado no GitHub e worktree `wt-368-rebase` desalocado |
| **ACT-00-3** | Atualizar prompts e skills do sistema em `.agents/skills/` | Homologação do brand system | Referências atualizadas de `BIRTHHUB-360-DESIGN-LANGUAGE.md` para `brand-system/` |

### 2.2 Agente 15 — Segurança Aplicada e Segredos (Prioridade P0)
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-15-1** | Inspeção e sanitização do `.env` em `Desktop\DOCUMENTOS\IDENTIDADE-VISUAL\05_TOKENS_E_TEMAS/` | Imediata | Relatório de auditoria de segredos confirmando ausência de chaves de produção ou rotação realizada |

### 2.3 Agente 11 — Marca e Ativos Institucionais (`identidade-visual/**`)
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-11-1** | Retificar correções factuais em `RELATORIO-FINAL-GENESIS-BRAND-SYSTEM.md` | Parecer do Antigravity | Ajuste para 73 arquivos e commit `9b08b7bbd` |
| **ACT-11-2** | Atualizar `01-MARCA/brandbook.md` com deliberações oficiais de D1, D2 e D10 | Deliberação humana | Brandbook consolidado com grafia, contagem e área de proteção homologadas |
| **ACT-11-3** | Incorporar catálogo visual de personagens e variações de logo | ACT-11-2 | Seção ilustrada de ativos no Brandbook |

### 2.4 Agente 03 — Design System e Acessibilidade (`src/components/ui/**`, `src/styles/**`)
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-03-1** | Complementar especificações de componentes secundários em `04-DESIGN-SYSTEM/especificacoes/` | Imediata | Seções dedicadas para `AIContextPopover`, `AIEmailGenerator`, `CalendarHeatmap`, etc. |
| **ACT-03-2** | Adequar contraste do botão/CTA gradiente primário no light mode para 4.5:1 | Deliberação D4 | Commit cirúrgico em `src/components/ui/Button.tsx` / `official-identity.css` |
| **ACT-03-3** | Eliminar arquivos CSS mortos (`elegance.css`, `luxury-tokens.css`) | Deliberação D5 | Remoção controlada dos arquivos órfãos sem impacto em runtime |
| **ACT-03-4** | Fatiar a migração das 4.000 cores hexadecimais em pacotes por feature (Onda C) | Fechamento do PR #368 | PRs atômicos com testes visuais por módulo |

### 2.5 Agente 02 — Produto e UX (`src/App.tsx`, `src/components/layout/**`, `src/features/**`)
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-02-1** | Ativar injeção do atributo `data-module` no container do `AppLayout.tsx` | Deliberação D3 | Conexão com os acentos de módulo já estilizados em `official-identity.css` |
| **ACT-02-2** | Validar consistência de títulos e breadcrumbs com o novo vocabulário | Imediata | Revisão de copy das rotas no `AppLayout.tsx` |

### 2.6 Agente 08 / 08A — QA, CI e Release
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-08-1** | Executar suíte completa de testes de regressão e gates | Após ACT-03-2 e ACT-03-3 | Relatório com `tsc`, `lint`, `test:architecture` e build 100% verdes |
| **ACT-08-2** | Preparar PR de integração da branch `docs/brand-system-e-onda-review-20261119` para `main` | Aprovação do Agente 24 e Humana | PR documentado sem conflitos |

### 2.7 Agente 24 — Revisão Independente
| ID Tarefa | Descrição da Ação | Pré-condição | Entrega Esperada |
|---|---|---|---|
| **ACT-24-1** | Auditoria formal de encerramento de handoffs e emissão de parecer independente | Conclusão desta missão | Parecer formal registrado em `.agents/reviews/` |
