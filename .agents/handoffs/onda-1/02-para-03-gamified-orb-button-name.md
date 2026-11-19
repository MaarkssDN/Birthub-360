De: 02 — Produto e UX
Para: 03 — Design e Acessibilidade
Onda: 1
Status: aberto
Prioridade: alto
Bloqueador-ref: A2 do plano `.agents/runs/onda-1-birthub-experience-360-plano.md` (OBRIGATÓRIO: `/app/gamification` com 0 `button-name`)
Sprint destino: Onda 1

## Problema
`/app/gamification` mantém 1 violação axe crítica `button-name` (reproduzida no HEAD de main em 2026-11-19, tema claro e escuro, 1280x800; seletor `.appearance-none`). O `GamificationWidget` renderiza `<Gamified3DOrb interactive={false} />`, que emite um `<button disabled>` sem texto, sem `aria-label` e sem `title` (o `title` só existe quando `interactive`).

## Arquivo(s) envolvido(s)
- `src/components/ui/Gamified3DOrb.tsx` (linhas ~185-193, `<button ... disabled={!interactive} title={interactive ? ... : undefined}>`) — dono 03.
- Consumidor: `src/components/ui/GamificationWidget.tsx:145` (também `ui/`, dono 03).
- O 02 não consegue corrigir a partir da página: o componente não aceita `aria-label` por prop e o botão está dentro do widget.

## Evidência
Script axe (`@axe-core/playwright`, tags wcag2a/aa/21a/21aa) em `/app/gamification` com usuário ADMIN de teste: `button-name(1): .appearance-none` em light e dark. Mesma classe de achado em `.agents/runs/14-inventario-visual-app-20261119.md` (achado 3).

## Alteração necessária
No `<button>` de `Gamified3DOrb.tsx`, sempre expor nome acessível, no mesmo padrão já usado em `BrandOrb.tsx:124`, por exemplo:
`aria-label={interactive ? 'Obter impulso de energia' : 'Cristal 3D de gamificação'}`
(alternativa: quando `interactive={false}`, renderizar `<div role="img" aria-label=...>` em vez de um `<button disabled>`, o que também evita um botão desabilitado inútil na ordem de tabulação). Texto em PT-BR a critério do 03. Proposta NÃO verificada pelo 02 (arquivo de outro dono; não foi editado nem testado localmente).

## Teste esperado
Axe em `/app/gamification` (light e dark) com 0 `button-name`; teste Testing Library no 03 verificando que `Gamified3DOrb` com `interactive={false}` expõe nome acessível (`getByRole('button', { name })` ou `getByRole('img', { name })`); `accessibility.spec.ts` verde.

## Contexto adicional
`BrandOrb.tsx` tem a mesma estrutura e já possui `aria-label`; apenas `Gamified3DOrb` ficou sem. Os 8 pilares de settings (A1) foram corrigidos pelo 02 em `agente/02-onda1-a11y-labels`.
