De: 03 (design/a11y — 03C/03E)
Para: 04 (signals-risks, market-intelligence, dashboard); cópia informativa 02 (settings: MultiRegionFailoverPanel) e 07 (roleplay)
Onda: 1
Status: aberto
Prioridade: normal
Bloqueador-ref: A4 do plano `.agents/runs/onda-1-birthub-experience-360-plano.md`
Sprint destino: próxima rodada (dívida; a Onda 1 já está mitigada por CSS)

## Problema
Cinco telas usam utilitárias cruas que não passam em AA. O 03 mitigou TODAS por regras de piso em `src/styles/official-identity.css` (bloco "Piso de legibilidade WCAG AA (Onda 1, A4)"), mas a correção definitiva é migrar as features para tokens semânticos e então remover a regra correspondente.

## Arquivo(s) envolvido(s)
- `src/features/settings/components/MultiRegionFailoverPanel.tsx` (`/app/failover`, `/app/resilience`): `text-emerald-500`, `text-amber-500`, `text-indigo-400` e selo `bg-emerald-500/10 text-emerald-500` -> `text-ok-active` / `text-warn-active` / `text-info-active` (tokens existentes que já reagem a tema).
- `src/features/roleplay/components/roleplay-hub/CallSetup.tsx`: `text-amber-500` -> `text-warn-active`.
- `src/features/market-intelligence/components/InteligenciaMercadoHub.tsx` (~linha 357): `text-[var(--nav-c-teal)]` em Badge -> `text-ok-active` (ou variante `success` do Badge).
- `src/features/signals-risks/components/DealRisksTab.tsx` (linha ~90): botão `bg-warning-active ... text-slate-950` (#020618 sobre #8C6A04 = 4,01:1 no claro) -> par claro/escuro coerente (texto `text-on-brand`) ou `bg-warning text-on-warning`; linha ~175 `bg-critical/10 text-critical` -> `text-critical-active`.
- `src/features/dashboard/**` (alternador GESTOR/...): `bg-brand text-white` -> `bg-brand text-on-brand` (constituição §4: branco sobre superfície sólida de marca é proibido; 1,68:1 no escuro).

## Evidência
axe antes: failover/resilience 6 nós cada (claro), roleplay 3, market-intelligence/hub 1, deal-risks 1 (claro) + 1 (escuro), dashboard 1 (escuro). Depois das regras de piso: 0 nos temas claro e escuro nessas rotas.

## Alteração necessária
Migração nos arquivos acima; ao concluir, remover do `official-identity.css` a regra correspondente (cada uma está comentada com a origem). Aviso: remapeamento global de `text-emerald-500`, `text-amber-500` e `text-indigo-400` no claro altera todas as telas que as usam (cores mais escuras, só no tema claro).

## Teste esperado
`accessibility.spec.ts` e varredura axe das rotas listadas, claro e escuro, sem as regras de piso.

## Contexto adicional
`/app/dashboard` claro: 0 violações no HEAD atual (não reproduziu); só o escuro reproduzia.
