# 05 — Roadmap de Evolução da Experiência (Ondas A–F)

**Data:** 2026-11-18 · **Contexto:** release em NO-GO (auditoria `audit-2026-11-18`); freeze de escopo ativo (§23). Este roadmap **não autoriza features novas** — prioriza correção, auditoria, consolidação e acabamento do que já existe.

## Onda A — Governança e inventário (esta entrega)

**Objetivo:** consolidar arquitetura de especialistas, contratos e documentação.

- Entregue agora: `.agents/experience/` completo (diagnóstico, arquitetura, protocolo de auditoria, templates, este roadmap).
- Pendente de aprovação humana: prompts 02-UXR/02-CJ/02-IA/02-CRO em `.agents/prompts/`, registro no roster do `AGENTS.md`, seção em `COMO-CHAMAR-OS-AGENTES.md`, `AGENTS.md` local de `src/features/landing/`.
- **Agentes:** 00 (execução), 24 (revisão), usuário (decisões de governança).
- **Aceite:** pacote verificado (este documento + `01`–`04`); propostas formalizadas; parecer 24.
- **Dependências:** nenhuma. **Risco:** baixo.

## Onda B — Auditoria e estabilização

**Objetivo:** mapear e corrigir problemas críticos de UX, navegação, acessibilidade e apresentação — **antes** de qualquer reforma visual.

- Executar o protocolo `03-protocolo-auditoria-uxui.md` nas jornadas principais, começando pelas já evidenciadas em `audit-2026-11-18/ux-completude.md` (UX-01…UX-11 → DEBT-0024, 0032, 0033, 0059, 0060, 0065).
- Prioridade 1 (bloqueadores de jornada): UX-01/DEBT-0024 (criação manual de oportunidade), UX-10 (funil com estágios de piloto), UX-02 (botão morto), UX-03/UX-07 (estados honestos).
- Prioridade 2: UX-08/UX-09 (settings/placeholders), UX-04 (score heurístico → copy honesta), UX-05/UX-11 (código morto, deep link).
- Handoffs cruzados: persistência de settings → dono do módulo; criação de lead → 04/01 se exigir schema; a11y → 03E + 08.
- **Agentes:** 02 (perfis UXR/CJ/IA), 03 (03E a11y), 08 (testes/gates), 24 (revisão).
- **Aceite:** cada achado P0/P1 corrigido e re-verificado, ou justificado com handoff; zero P0 aberto ao final.
- **Dependências:** Onda A (protocolos). **Risco:** médio — toca features de outros donos; exige handoffs disciplinados.

## Onda C — Design System

**Objetivo:** consolidar padrões homologados, eliminar inconsistências e componentes redundantes.

- Resolver `docs/design/TOKEN-AUDIT.md`: convergir hex hardcoded residual de voice-hub (`design-system/tokens.ts`) para a cadeia canônica (`identidade-visual/birthhub360/tokens` → `official-identity.css` → `globals.css`). A duplicação de arquivo já foi eliminada (shim de re-export).
- Acompanhar PR #368 (migração hex neon → `var()`) até merge ou substituição.
- Canonizar superfícies de landing (saída do 02-D): `Landing360` já é a canônica roteada; decidir destino de `Landing360Impeccable.tsx` (não roteada), `/landing-new`→`LandingInnovative` (Agente 12 — handoff) e `landing/`+`landing-page.html` na raiz — pré-requisito para Onda E.
- Inventariar componentes duplicados em `src/components/ui/**` (96 arquivos) vs. implementações ad hoc em features.
- **Agentes:** 03C (DS), 03B (componentização), 11 (ativos canônicos), 02 (features donas), 24.
- **Aceite:** uma única fonte de tokens; zero hex hardcoded fora dos tokens canônicos em componentes migrados; typecheck/lint verdes.
- **Dependências:** Onda B (não consolidar sobre base quebrada). **Risco:** médio — muitos arquivos; fatiar por feature.

## Onda D — Jornadas principais

**Objetivo:** otimizar fluxos de maior impacto operacional, respeitando funcionalidades existentes.

- Jornadas candidatas (por evidência): onboarding→primeiro valor; prospecção→promoção→CRM; cadência/ciclo de receita (depende dos bloqueadores DEBT-0008…0011 do domínio 17 — UX só entra depois); Hub de IA (depende DEBT-0012/0015).
- Para cada jornada: mapa 02-CJ → correções de fricção → validação 03F/03E → gate 08.
- **Agentes:** 02-CJ/02-IA, 03B/03D, donos de feature, 08, 24.
- **Aceite:** jornada concluível fim-a-fim com evidência (teste e2e ou roteiro verificado); redução de etapas sem remover funcionalidade.
- **Dependências:** Onda B (estados honestos) e desbloqueio dos P1 de domínio. **Risco:** alto se iniciar antes dos P1 de dados/IA — **não iniciar jornadas dependentes de módulos bloqueados**.

## Onda E — Landing pages e refinamento

**Objetivo:** aprimorar páginas públicas, responsividade, microinterações e acabamento.

- Só após canonização (Onda C): uma landing oficial, variantes depreciadas removidas ou redirecionadas.
- 02-CRO audita conversão; 03G/Impeccable refina; 03D ajusta motion; 03F valida breakpoints.
- Respeitar a regra de "Landing/Login intocadas" (`COMO-CHAMAR-OS-AGENTES.md`, prompt `03G`) — mudanças aqui exigem autorização explícita do usuário por ser superfície pública de conversão.
- **Agentes:** 02-CRO, 03A/03G/03D/03F, 11 (marca), 24.
- **Aceite:** uma landing canônica, Lighthouse/a11y aceitáveis, evidência visual real.
- **Dependências:** Onda C + autorização humana para tocar superfície pública. **Risco:** médio.

## Onda F — Regressão e preparação para release

**Objetivo:** validação integrada, evidências, revisão independente e decisão de liberação.

- Reconciliar os 11 snapshots divergentes de `visual.spec.ts` (DEBT-0041/#201) e o drift de `tests/AGENTS.md` §6 (diz que a suíte está skipped — está ativa desde `dff5677d8`) para que regressão visual seja verificável com baseline honesto.
- Rodar suíte completa nas jornadas de Onda D + auditoria spot-check com protocolo §03.
- Consolida evidências para o gate de release do 08 e parecer final do 24.
- **Agentes:** 08, 14, 03F, 24, 00.
- **Aceite:** gates verdes no SHA candidato + parecer 24 APROVADO + checklist GO/NO-GO atualizado.
- **Dependências:** todas as anteriores + resolução dos P0/P1 do `inventario-mestre.md` (não só UX). **Risco:** o release NO-GO atual é dominado por débitos não-UX — esta onda não substitui o plano de saneamento.

## Sequência e paralelismo

```
A (governança) ──► B (auditoria/estabilização) ──► C (design system) ──► D (jornadas) ──► E (landing) ──► F (release)
                         │                            │
                         └─ handoffs para donos de    └─ PR #368 converge aqui
                            domínio (04/05/17/01)
```

- Ondas B e C podem sobrepor em frentes disjuntas (auditoria 02-* ∥ consolidação 03C) com matriz publicada.
- Onda D **não inicia** para jornadas cujo módulo backend esteja em NO-GO (cadência, IA/enxame, voz) — UX não mascara bloqueador de dados.
- Toda transição de onda segue o ciclo de vida de §20 do AGENTS.md com evidência.
