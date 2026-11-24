# Handoff 00 → Agentes 02 + 03 (+ dono do feature) — /app/characters: temas oficiais AA

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas); idealmente após ADR-012.

## 1. Problema e backlog
`/app/characters` força paleta escura no tema claro e tem heading com contraste
medido de **1,52:1** — falha grave WCAG 2.2 AA. Não consome tokens semânticos de
tema.
Backlog: A11Y-001 (P1) · **ADR-015** (decisão de produto já tomada).

## 2. Evidência técnica
- `src/features/characters/CharacterGalleryView.tsx` (e `CharacterDetailPanel.tsx`,
  `characterCatalog*.ts`) — cores hardcoded/escuro forçado.
- Contraste medido 1,52:1 no H1 (inventário visual Agente 14;
  `docs/audits/experience-360/07-ACCESSIBILITY-AUDIT.md`).
- `src/features/characters/` **não possui AGENTS.md local** — dono do feature a
  designar pelo Agente 00.

## 3. Agente responsável e ownership
- Tema/tokens/contraste → **Agente 03** (Design e Acessibilidade,
  `src/styles/**`).
- Feature `characters` → dono a confirmar pelo 00 (sem AGENTS.md local).

## 4. Causa raiz
Paleta escura hardcoded como solução visual, ignorando os mecanismos de tema e
sem auditoria de contraste AA.

## 5. Solução mínima proposta
- Substituir cores hardcoded por **tokens semânticos de tema** (`src/styles`),
  funcional nos temas claro e escuro.
- Contraste ≥ 4,5:1 (texto) / ≥ 3:1 (componentes e texto grande) medido em ambos
  os temas — não estimado.
- Preservar a identidade do módulo via tokens, não hex solto.
- Estados hover/focus/disabled consistentes com `ui/`; teclado completo;
  `prefers-reduced-motion`; sem overflow horizontal; alvos de toque adequados.
- Se a paleta escura for intencional para a "identidade do personagem", escalar
  ao Orquestrador antes de implementar — não decidir sozinho.

## 6. Arquivos que poderão ser modificados
- `src/features/characters/**` (após designação de dono).
- `src/styles/**` somente se faltar token semântico — coordenar com Agente 03 e
  **aguardar ADR-012** para não codificar valores que serão remapeados.

## 7. Dependências e riscos
- **Dependência dura:** reconciliação de tokens (ADR-012). Se tokens mudarem,
  retrabalho — mitigação: implementar contra tokens atuais e revalidar após a
  reconciliação, ou aguardar.
- Baselines visuais desta rota vão mudar → baseline nova **justificada** no PR.
- Risco visual moderado-alto: a página hoje é dark-only; o tema claro muda
  bastante a aparência (mudança intencional e aprovada).

## 8. Critérios de aceite
- `/app/characters` funcional e legível nos temas claro e escuro.
- Contraste AA **medido** em todos os textos.
- axe-core sem violações serious/critical na rota.
- Teclado, reduced-motion e responsivo (360px→desktop) OK.
- Evidência visual light/dark anexada ao PR.

## 9. Testes obrigatórios
- axe na rota; medição de contraste.
- Snapshots visuais light/dark desktop+mobile (baseline nova aprovada).
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; baseline visual anterior permanece no histórico para
comparação.

## 11. Atualização 2026-11-22 (baseline + ownership)
- **Ownership:** PENDENTE DE RATIFICAÇÃO — proposta revisada em
  `22-OWNERSHIP-MATRIX.md`: `characterCatalog.ts` declara "nenhum personagem é
  um agente de IA" → domínio = experiência/personas → **Squad 30 (legado 02)**,
  não Squad 70. Squad 70 só como fonte de eventos/runtime.
- **Baseline:** `/app/characters` **não é coberta** pela suíte `test:visual`
  (rotas do spec: login, dashboard, workspace, crm, prospecção, inteligência,
  analytics, integrações, calendário, automações, admin). Contraste 1,52:1 vem
  do inventário do Agente 14 — **revalidar com screenshot/axe quando a infra
  de teste estiver disponível**.
- **Dependência:** aguardar ADR-012 para tokens; baseline visual da rota não
  existe — gerar evidência before/after no PR.
