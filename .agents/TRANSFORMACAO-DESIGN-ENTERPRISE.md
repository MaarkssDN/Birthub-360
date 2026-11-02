# Transformação de Design Premium Enterprise — Birth Hub 360°

Este documento estabelece o guia oficial de execução da transformação de design enterprise do Birth Hub 360°, operado conjuntamente pelo motor **Impeccable** (v4.8.0) e pelo **Enxame de Agentes de Design Enterprise** (Slots 03A a 03G).

---

## 1. Visão e Filosofia do Produto

O Birth Hub 360° não é um template SaaS genérico. É um **Cockpit Executivo de Business Command Center 360°** para Revenue Intelligence, unindo inteligência preditiva, cadências multicanais e tomada de decisão em tempo real para times de alta performance comercial.

### Pilares Visuais Inegociáveis:
- **Autoridade e Sofisticação**: Superfícies escuras puras (`#0D0D0D`, `#14141A`) e temas claros genuínos (`#F8FAFC`, `#FFFFFF`), sem falsos dark modes acinzentados.
- **Identidade Neon Oficial**: Azul Neon (`#00D4FF`), Rosa Neon (`#FF2D9B`) e Dourado (`#FFC107`).
- **Trinca Tipográfica Exclusiva**:
  - `Sora`: Títulos, headings executivos e métricas principais (`tracking -0.02em`).
  - `Inter`: Interface de alta densidade com `font-feature-settings: "cv05", "cv11", "ss01"` (toque arredondado refinado).
  - `IBM Plex Mono`: Valores numéricos de receita, códigos e badges de status.
- **Raios de Borda (Radius Ramp)**:
  - `12px` (`rounded-xl`): controles, botões e inputs.
  - `16px` (`rounded-2xl`): cartões e superfícies de conteúdo.
  - `20px` (`rounded-3xl`): modais e diálogos flutuantes.
  - `9999px` (`rounded-full`): pílulas de status e tags.
- **Os 4 Estados Obrigatórios de Todo Módulo**:
  - `Loading State`: Skeleton screens no formato exato dos cards finais.
  - `Empty State`: Visual zero-state com Call-to-Action claro.
  - `Error State`: Causa do erro amigável e botão de retentativa rápida.
  - `Stale State`: Timestamp da última sincronização mantendo dados em cache.

---

## 2. O Roster do Enxame de Design Enterprise

| Agente | Slug / Prompt | Especialidade | Ferramentas / Foco |
|---|---|---|---|
| **03A** | `03A-diretor-design-enterprise` | Diretor Executivo de Design Engineering | Orquestração global, governança e aprovação de entregas |
| **03B** | `03B-arquiteto-ui-ux-enterprise` | Arquiteto de UI/UX Operacional | Bento Grids, densidade informacional, Command Palette (⌘K) e 4 estados de tela |
| **03C** | `03C-engenheiro-design-system` | Engenheiro de Design System | Primitivos `src/components/ui/**`, tokens Tailwind e variáveis CSS |
| **03D** | `03D-engenheiro-motion-interacao` | Engenheiro de Motion & Microinterações | Framer Motion (`src/lib/motion.ts`), bordas glow sutis e compliance com `prefers-reduced-motion` |
| **03E** | `03E-auditor-a11y-wcag` | Auditor de Acessibilidade WCAG 2.2 AA | Contraste de cores (Dark & Light), navegação completa por teclado e semântica ARIA |
| **03F** | `03F-inspetor-qa-visual` | Inspetor de QA Visual & Regressão | Verificação nos 5 breakpoints (360px a 1920px), truncamento de dados reais e fidelidade de temas |
| **03G** | `03G-guardiao-impeccable-antislop` | Guardião Impeccable Anti-Slop | Motor Impeccable v4.8.0 (`detect`, `polish`, `typeset`, `layout`, `colorize`, `harden`) e eliminação de AI-slop |

---

## 3. Integração com Impeccable (v4.8.0)

O motor Impeccable foi instalado tanto a nível de projeto quanto global:
- **Binário local Windows**: `.agents/skills/impeccable/scripts/impeccable.cmd`
- **Skills instaladas**: `.agents/skills/impeccable` e `.claude/skills/impeccable`
- **Agentes do harness instalados**: `.claude/agents/`

### Comandos Frequentes:
```bash
# Diagnóstico de anti-patterns na tela ou componente alvo
.agents/skills/impeccable/scripts/impeccable.cmd detect src/pages/Hub.tsx

# Contexto carregado de PRODUCT.md e DESIGN.md
.agents/skills/impeccable/scripts/impeccable.cmd context

# Verificação de status e regras ignoradas
.agents/skills/impeccable/scripts/impeccable.cmd ignores
```

---

## 4. Pipeline de Execução por Tela

Toda tela ou módulo que passar pela transformação segue o fluxo:

```
[03A] Triagem & Diagnóstico (com 03G Impeccable)
  ↓
[03B] Arquitetura de Layout (Bento Grid + 4 Estados)
  ↓
[03C] Componentização com Design System & Tokens Oficiais
  ↓
[03D] Aplicação de Motion Operacional & Microinterações
  ↓
[03E] Validação de Acessibilidade WCAG 2.2 AA
  ↓
[03F] Inspeção Visual nos 5 Breakpoints
  ↓
[03A + 24] Gate Final e Relatório de Conclusão
```

---

## 5. Blindagem de Governança Estrita
- **Regra Absoluta do Usuário**: A Landing Page (`src/pages/Landing*.tsx`) e a Tela de Login (`src/pages/Login.tsx`) estão **completamente fora do escopo de modificações**. Permanecem intocadas.
- **Zero Mocks**: Proibido inventar dados em produção.
