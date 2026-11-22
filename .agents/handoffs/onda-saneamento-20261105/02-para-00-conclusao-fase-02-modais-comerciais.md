De: Agente 02 (Produto e UX)
Para: Agente 00 (Coordenador)
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: Fase 03

## Problema
Os oito cards da Landing Page compartilhavam uma única caixa escura genérica sem estrutura de metadados, sem diferenciação visual, sem visualização contextual da interface operacional e com conteúdo comercial superficial.

## Arquivo(s) envolvido(s)
- `src/features/landing/components/pillars/PillarRegistry.tsx`
- `src/features/landing/components/pillars/PillarDetailDialog.tsx`
- `src/features/landing/components/pillars/PillarContent.tsx`
- `src/features/landing/components/PillarDetailModal.tsx`
- `src/features/landing/pages/Landing360.tsx`
- `src/features/landing/pages/LandingAdaptive.css`
- `index.html`
- `tests/unit/features/landing/PillarDetailModal.test.tsx`

## Evidência
- 33 testes unitários aprovados (100% verde na suíte de landing).
- Tipagem estática `npx tsc --noEmit` aprovada sem erros (código de saída 0).
- 36 capturas de tela arquivadas em `.agents/reviews/evidence-handoffs/pillars/` cobrindo os 8 pilares em Desktop (1280x800) e Mobile (390x844), Dark e Light mode.
- Parecer formal APROVADO emitido pelo Agente 24 em `.agents/reviews/24-revisao-modais-8-pilares-temas.md`.

## Alteração necessária
A arquitetura foi migrada integralmente para `PillarRegistry` → `PillarDetailDialog` → `PillarContent`:
1. Registro tipado dos 8 pilares com metadados estruturados, capacidades reais, disponibilidade e visualizadores contextuais.
2. Layout editorial com 2 áreas no desktop (conteúdo e visualização) e adaptativo mobile.
3. Botões cápsula com glow multicolorido inspirado no Sleep Cycle nos acentos Cyan, Pink, Gold e Iris.
4. Tipografia padronizada em Sora (títulos), Inter (textos) e IBM Plex Mono (dados técnicos).
5. Acessibilidade integral WCAG 2.2 AA: `role="dialog"`, `aria-modal="true"`, focus trap, Escape, restauração de foco e trava de rolagem do fundo.
6. Fidelidade funcional: ausência de métricas falsas e identificação explícita de simulação operacional.

## Teste esperado
- Abertura individual dos 8 modais nos temas Dark e Light.
- Teste de navegação e CTAs com redirecionamento para rotas reais (`/app/crm`, `/app/market-intelligence`, `/app/cadence`, `/app/analytics`, `/app/forecast`, `/app/intelligence`, `/app/automations`, `/app/voice-hub`).
- Acionamento integrado do Simulador de ROI nos pilares pertinentes (01 e 05).

## Contexto adicional
Fase 02 concluída com sucesso e em conformidade estrita com o `AGENTS.md`. Entregue para o Agente 00 para liberação da Fase 03.
