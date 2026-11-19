De: 03 (design/a11y — 03C/03E)
Para: 12 (dono de src/features/voice-hub/**)
Onda: 1
Status: aberto
Prioridade: normal
Bloqueador-ref: A4 do plano `.agents/runs/onda-1-birthub-experience-360-plano.md`; achado 5 de `.agents/runs/14-inventario-visual-app-20261119.md`
Sprint destino: Onda 1 (DECISÃO HUMANA pendente: o módulo é marcado indisponível/503 pelo gate)

## Problema
`/app/voice-hub` no tema CLARO tem 12 nós `color-contrast` sérios: o módulo foi desenhado para fundo escuro (contêiner `bg-slate-950 text-slate-100`), mas renderiza `Card` (`bh-platform-card`, superfície clara no tema claro) com texto `text-white` (#F8F9FF sobre #FFFFFF = 1,05:1) e `text-slate-400` (#90A1B9 sobre #FFFFFF = 2,63:1). No tema escuro, `text-slate-500` (#62748E sobre #14141A = 3,85:1) — este o 03 já corrigiu por CSS (`html.dark .bh-platform-card .text-slate-500 { color: var(--ink-2) }` em `src/styles/official-identity.css`).

## Arquivo(s) envolvido(s)
`src/features/voice-hub/**` (cards "Birth Voices Hub (SDR IA)", "PABX 3CX Call Flow" e os KPIs "Chamadas Tentadas", "Atendidas & Conversadas", "Reuniões Agendadas", "Cadências de Voz Ativas").

## Evidência
axe antes (light): 12 nós, ex. `#f8f9ff` sobre `#ffffff` 1,05; `#90a1b9` sobre `#ffffff` 2,63. Tentativa do 03 de remapear por CSS (`html:not(.dark) .bh-platform-card .text-white/.text-slate-400`) PIOROU a rota (subpainéis escuros aninhados e inputs `bg-slate-950` dentro dos Cards ficaram com texto escuro: 1,12:1 e 1,92:1) e foi descartada; não há como distinguir por CSS um Card claro de um subpainel escuro dentro dele.

## Alteração necessária
Migrar o texto dos Cards do módulo para tokens que reagem a tema (`text-ink`, `text-ink-2`) em vez de `text-white`/`text-slate-400`/`text-slate-500`, ou forçar superfície escura nos Cards do módulo inteiro (decisão de design do 12/03). Os subpainéis escuros podem manter os neutros slate.

## Teste esperado
`/app/voice-hub` claro e escuro: 0 `color-contrast` sério (axe wcag2a/aa/21a/21aa, 1280x800).

## Contexto adicional
Registrado como DECISÃO HUMANA no inventário se o módulo deve voltar; sem decisão, prioridade normal.
