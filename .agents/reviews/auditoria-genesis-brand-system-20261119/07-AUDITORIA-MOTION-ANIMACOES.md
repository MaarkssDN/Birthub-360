# 07 — Auditoria de Motion Design e Animações
## AUDITORIA TÉCNICA INDEPENDENTE — OPERAÇÃO GENESIS BRAND SYSTEM
### Repositório: Birthub 360 | Data: 19/11/2026 | Auditor: Google Antigravity

---

## 1. Inventário Técnico de `src/lib/motion.ts`

O arquivo `src/lib/motion.ts` constitui o motor central de animações da plataforma, construído sobre a biblioteca `framer-motion`.
A auditoria independente confirmou a existência de **55 exports ativos**:

### 1.1 Curvas de Easing (Bézier cúbico)
- `EASE_PREMIUM = [0.22, 1, 0.36, 1]`: Easing canônico para transições de página, modais e entradas principais.
- `EASE_SPRING_SOFT = [0.34, 1.56, 0.64, 1]`: Curva com overshoot suave.
- `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]`: Curva de alta aceleração inicial para microinterações rápidas.
- `EASE_IN_OUT_SMOOTH = [0.4, 0, 0.2, 1]`: Curva para saídas e fechamento de drawers.
- `EASE_BOUNCE`: Declarado na linha 14 como alias idêntico a `EASE_PREMIUM` (com comentário "Replaced bounce with smooth" para eliminar saltos indesejados).
- `EASE_SMOOTH = [0.25, 0.1, 0.25, 1]`: Curva para animações cíclicas de ambientação.

**Convergência com CSS (`src/styles/globals.css:396-399`):**
- `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`
- `--ease-enter: cubic-bezier(0.22, 1, 0.36, 1)`
- `--ease-exit: cubic-bezier(0.4, 0, 1, 1)`
- `--ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1)`

### 1.2 Durações Padronizadas (`MOTION_DURATION`)
- `instant: 0.1s` (100ms) — Toggles, hovers imediatos.
- `fast: 0.15s` (150ms) — Dropdowns, tooltips.
- `base: 0.25s` (250ms) — Modais, expansão de cards.
- `deliberate: 0.35s` (350ms) — Drawers laterais, troca de abas.
- `gentle: 0.6s` (600ms) — Transições de landing page e reveals complexos.

### 1.3 Modelos de Física / Springs
- `SPRING_SNAPPY`: `{ stiffness: 420, damping: 32, mass: 0.7 }` — Feedback tátil de botões e badges.
- `SPRING_SOFT`: `{ stiffness: 260, damping: 24, mass: 0.9 }` — Expansão de painéis.
- `SPRING_TACTILE`: `{ stiffness: 500, damping: 28, mass: 0.6 }` — Switches e toggles rápidos.
- `SPRING_ORGANIC`: `{ stiffness: 280, damping: 22, mass: 0.8 }` — Flutuação suave de orbes.

---

## 2. Auditoria da Seção `05-MOTION/` da Documentação

A documentação entregue pelo Devin na pasta `05-MOTION/` possui 6 documentos especializados:
1. `manual-de-animacoes.md`: Guia geral de implementação com exemplos reais de código.
2. `motion-tokens.md`: Tabela de referência exata conectando tokens JS aos equivalentes CSS.
3. `principios-de-motion.md`: Filosofia de movimento ("Propósito antes do espetáculo", "Respeito ao foco").
4. `transicoes.md`: Especificação de transições de página, staggers e drawers.
5. `microinteracoes.md`: Efeitos de clique, hover magnético e feedback de botões.
6. `movimento-reduzido.md`: Diretrizes estritas de acessibilidade para usuários sensíveis a movimento.

---

## 3. Avaliação da Proposta de Motion em Dois Níveis (Conflito C6 / Decisão D11)

O Devin propôs na documentação uma separação explícita entre dois níveis de movimento:
- **Nível 1 — Motion Operacional (CRM, Dashboards, Tabelas):**
  - Animações curtas (100ms–250ms), sem elasticidade perceptível, transições puramente de fade/slide direto. Foco exclusivo em produtividade e densidade de dados.
- **Nível 2 — Motion Comercial (Landing Pages, Onboarding, Voice Hub Showcase):**
  - Uso de molas orgânicas, gradientes animados (`BorderBeam`), glows pulsantes e reveals escalonados.

**Parecer do Antigravity:**
Esta proposta é **tecnicamente excelente e resolve a tensão entre um CRM sóbrio e uma vitrine moderna**. Contudo, trata-se de uma **PROPOSTA NÃO HOMOLOGADA**, classificada como Conflito C6 / Decisão D11. Cabe ao Orquestrador Humano ratificar formalmente essa regra no Brandbook.

---

## 4. Acessibilidade e Redução de Movimento (WCAG 2.2.2 / 2.3.3)

- **Suporte no Código:** O arquivo `src/lib/motion.ts` importa e utiliza `useReducedMotion()` do Framer Motion.
- **Implementação em Componentes:** As classes do Tailwind utilizam sistematicamente o modificador `motion-safe:` (ex: `motion-safe:transition-all`).
- **Comportamento Documentado:** Quando `prefers-reduced-motion: reduce` está ativo no sistema operacional, todas as durações são colapsadas para 0s ou substituídas por cross-fades instantâneos de opacidade sem deslocamento geométrico (sem transform X/Y/scale).

---

## 5. Detecção de Débito Técnico e Variantes Ociosas

A auditoria independente confirmou a descoberta do Devin:
- Das 30+ variantes exportadas em `motion.ts` (como `nodePulse`, `scanLineEntry`, `float3D`, `journeyConnector`), **mais de 60% não possuem chamadas diretas em arquivos `.tsx` de produção**.
- **Recomendação:** Não excluir as variantes imediatamente, pois servem de biblioteca para novas telas, mas marcá-las como utilitários opcionais de catálogo e criar testes unitários para o módulo.
