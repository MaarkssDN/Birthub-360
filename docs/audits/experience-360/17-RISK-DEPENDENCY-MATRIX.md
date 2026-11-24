# 17 — Matriz de Riscos e Dependências entre Ondas 1, 2 e 3

**Data:** 2026-11-21 · **Base:** `12-PRIORITIZED-BACKLOG.md`, `13-IMPLEMENTATION-ROADMAP.md`,
ADRs 012-015, handoffs `.agents/handoffs/onda-1/`

---

## 1. Visão das ondas

| Onda | Tema | Itens-chave | Bloqueio externo |
|---|---|---|---|
| **1** | P1 cirúrgicos | 8 handoffs (KanbanBoard, characters, providers memo, useFetch, signals-risks, VoiceHubView alert, TableRow, voice-hub 503) + OPP-01 (Onda 4 na prática) | Silas (§40) + ADR-012 p/ characters |
| **2** | Navegação/IA | UX-007..010, títulos de página, Command Palette permissões, logout mobile | Depende de parte da Onda 1 (rotas estáveis) |
| **3** | Design System | COMP-001 (consolidar DS voice-hub), tokens, EmptyState/ErrorBoundary, modais→Dialog, DataTable | **Bloqueada por ADR-012** (reconciliação DL) |

## 2. Matriz de dependências

```
ADR-012 (DL v2.1 aprovado)
   │
   ├──► Onda 3 inteira (tokens, DS paralelo, temas, modais)
   │        │
   │        └──► characters (Onda 1) — idealmente DEPOIS de ADR-012 p/ não
   │             codificar valores que serão remapeados
   │
   ├──► COMP-001 (consolidar voice-hub design-system)
   │        │
   │        └──► TableRow (Onda 1) — corrigir de forma compatível c/ ui/
   │             para não criar terceiro padrão
   │
   └──► VoiceHubView alert→toast (Onda 1) — decidir toast ui/ vs local

Silas (parecer §40)
   │
   └──► TODAS as implementações (Onda 1+)

Agente 12 (voice-hub/gate)
   │
   ├──► voice-hub 503 fallback (Onda 1) — critérios de reativação
   └──► COMP-001/DS voice-hub (Onda 3) — dono do módulo

Agente 04 (CRM)
   │
   ├──► KanbanBoard (Onda 1)
   └──► OPP-01 criação manual (Onda 4) — junto c/ Agente 21
```

## 3. Riscos por item da Onda 1

| Item | Dono | Risco de regressão | Mitigação |
|---|---|---|---|
| KanbanBoard role=button | 04 | Baixo | Reusar nav do detalhe; axe no board |
| characters tema AA | 03+? | **Moderado-Alto** (visual muda muito) | Baseline nova justificada; aguardar ADR-012 |
| providers useMemo | 02/03 | Baixo funcional, médio (expõe renders) | Testar consumidores; mesma API |
| useFetch race/cancel | 02 | **Alto alcance** (todas as telas) | Guarda aditiva; testar 3 consumidores |
| signals-risks catch | ? | Baixo | Confirmar se falha é esperada/degradável |
| VoiceHubView alert→toast | 12 | Baixo | Usar toast do módulo |
| TableRow ARIA | 12 | Médio (tabelas voice-hub) | Alinhar c/ ADR-012; testar consumidores |
| voice-hub 503 fallback | 02+12 | Médio (rotas/E2E) | Detectar por 503 real; atualizar specs |

## 4] Conflitos de ownership prováveis

- **`src/contexts/**` e `src/hooks/**`** sem AGENTS.md → dono a designar pelo 00
  (providers memo, useFetch).
- **`src/features/characters/**` e `src/features/signals-risks/**`** sem
  AGENTS.md → idem.
- **ThemeContexts do voice-hub** (2 arquivos) → Agente 12 é dono do arquivo,
  mas a *decisão* de consolidar é do ADR-012/Agente 03 — risco de duas correções
  paralelas se Onda 1 e Onda 3 rodarem juntas.
- **`ui/` vs voice-hub `design-system/`** → qualquer correção de a11y em
  primitivo compartilhado deve convergir para `ui/` (ADR-012), não criar padrão
  novo no voice-hub.

## 5. Regras de sequenciamento recomendadas

1. **Silas primeiro** — sem parecer, nada implementa.
2. **ADR-012 antes da Onda 3** — e idealmente antes de characters/DS-paralelo.
3. **Onda 1 itens independentes de token podem rodar em paralelo** após Silas,
   cada um em branch própria com gate local.
4. **Não rodar Onda 1 e Onda 3 no mesmo componente** (ex.: não corrigir
   TableRow e migrar o DS ao mesmo tempo sem coordenação).
5. **OPP-01 (Onda 4)** depende de Onda 1 estável (KanbanBoard/pipeline) e de
   contrato confirmado com Agente 21.

## 6] Riscos transversais

- **Regressão visual global:** tokens/DS são transversais — qualquer remap da
  Onda 3 pode afetar todas as telas. Mitigação: `test:visual` com baselines
  antes/depois, nunca merge sem baseline nova justificada.
- **CI pré-existente falhando** (SonarQube, Semgrep, Visual Regression Gate em
  PRs anteriores): falhas preexistentes permanecem visíveis — não mascarar nem
  "consertar" oportunisticamente neste escopo.
- **Working tree sujo** com handoffs não relacionados: preservar, não commitar
  junto.
