- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: resolvido
- Prioridade: alto

## Problema

Bugs funcionais confirmados no código da landing:

1. **ROI simulator corrompe A/B**: `RoiSimulatorModal` recebe `variant` com
   default `'A'`, mas `Landing360` não passa `variant={abVariant}` — toda
   conversão do simulador é registrada como variante A
   (`Landing360.tsx` ~L3363-3367; `RoiSimulatorModal.tsx` ~L24-29).
2. **Dock A/B duplicado**: o bloco "🧪 Experimento A/B" com botões Variante
   A/B está renderizado duas vezes seguidas no footer (~L2573-2597 e
   ~L2599-2624) — copy-paste visível ao usuário.
3. **Variante C fantasma**: URL `?variant=C` e sessionStorage aceitam 'C',
   mas a UI só tem toggles A/B e o copy só testa `=== 'B'` — variante C
   renderiza como A mas é medida como C (~L536-562).
4. **State `email` compartilhado**: campo "Domínio Corporativo" (SSO) e
   "E-mail Corporativo" (login) usam o mesmo state — trocar de aba carrega
   valor inválido para o outro contexto (~L675-679, ~L2934-3034).
5. **Medidor de senha no signin**: strength meter renderiza sempre que
   `password.length > 0`, inclusive no modo signin onde a senha é do usuário
   (~L3084-3130).
6. **Reveal flicker**: `useEffect` de scroll-reveal depende de `viewMode`;
   alternar public↔command readiciona `.b360-reveal` em elementos já
   revelados (~L693-748).
7. **Superfícies de debug em produção**: `?mode=luxury`/`?view=luxury`
   trocam para `LuxuryLandingPage` inteira e `?variant=C` muda o experimento
   — rotas de teste expostas via query param (~L950-964).

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx`
- `src/features/landing/components/RoiSimulatorModal.tsx`
- `src/features/landing/luxury/LuxuryLandingPage.tsx` (se o gate de debug mudar)

## Alteração necessária

1. Passar `variant={abVariant}` para `RoiSimulatorModal`.
2. Remover um dos docks A/B duplicados (manter um).
3. Decidir o destino da variante C: remover suporte ou criar toggle/copy —
   alinhar com o dono do experimento A/B (ver `conversionTelemetry`).
4. Separar states: `ssoDomain` vs `email` (ou limpar ao trocar de aba).
5. Renderizar strength meter apenas em `authMode === 'signup'`.
6. No effect de reveal, não readicionar `.b360-reveal` em elementos que já
   têm `.b360-reveal-in`.
7. Gatear `isLuxuryMode` atrás de flag de dev (`import.meta.env.DEV` ou
   feature flag) — nunca ativo em produção por query param.

## Teste esperado

- Simular ROI na variante B → `trackRoiSimulatorConverted` recebe 'B'.
- Footer mostra o dock A/B uma única vez.
- `?variant=C` em produção não altera comportamento (ou renderiza variante C
  de verdade, se mantida).
- Alternar E-mail/SSO não carrega valor entre campos.
- Login signin não exibe strength meter.
- Alternar public↔command não causa flicker de reveal.

## Contexto adicional

- `npx tsc --noEmit` passa — são bugs de lógica/estado, não de tipo.

## Resolução (Agente 02 — 2026-11-12, commit `510bce4bd`)

- `variant={abVariant}` passado ao `RoiSimulatorModal`; dock A/B duplicado removido (resta um, restrito a `import.meta.env.DEV`).
- Variante C normalizada para A/B na leitura de query/session storage.
- Estado SSO (`ssoDomain`) separado do e-mail de login.
- Medidor de força de senha exibido apenas em `authMode === 'signup'`.
- Scroll reveal não re-adiciona `b360-reveal` em elementos já revelados.
- Modo luxury gateado por `import.meta.env.DEV`.
- Gates: tsc ✅, Biome ✅, `Landing360.test.tsx` 11/11 ✅.
