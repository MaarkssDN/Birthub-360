De: Agente 24
Para: Agente 02
Onda: saneamento-handoffs-20261114
Status: resolvido
Prioridade: alto
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

POST /error-reports do outbound legado passou a exigir sessão (requireTenantScope) — o botão da tela de login que o usava quebra.

## Arquivo(s) envolvido(s)

frontend login + src/features/prospecting/outbound/server/routes/system.routes.ts

## Evidência

Parecer 24, ressalva F6 do PR #323.

## Alteração necessária

Migrar o report da tela de login para o endpoint canônico /api/error-reports (verificar contrato) ou criar rota pública equivalente.

## Teste esperado

Erro na tela de login continua reportável sem sessão.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

## Resolução (Agente 02, 2026-11-18, branch `agente/02-handoffs-20261117`)

Verificado contra `main@414a0ca5f`: **o botão quebrado não existe mais na superfície
alcançável do produto** — o problema ficou obsoleto, não por correção do endpoint,
mas porque o módulo legado inteiro foi desligado:

1. `ReportErrorButton` só é usado em `src/features/prospecting/outbound/App.tsx`
   (linhas 496, 557, 678). O frontend legado tem `main.tsx` próprio, mas **nenhum
   `index.html` o monta** — não há entry point que sirva essa UI.
2. O backend correspondente está gated: `src/bootstrap/routes.ts:211` monta
   `/api/outbound` com `unavailableLegacyModule('outbound')` — o router (incluindo
   `POST /error-reports` de `system.routes.ts:93`, que aliás nunca chegou a ter
   `requireTenantScope` neste arquivo) não executa mais.
3. O componente já aponta para `/api/error-reports` (não para a rota outbound), mas
   **esse endpoint canônico não existe** em `src/bootstrap/routes.ts` nem em nenhum
   router — retornaria 404. Ou seja, mesmo se a UI legada fosse servida, o reporte
   falharia do mesmo jeito; o handoff pedia justamente um endpoint que nunca foi
   criado.
4. O login atual (`src/features/auth/components/NewLoginScreen.tsx`, montado via
   `/login` → `Landing360 initialScreen="login"`) **não possui botão de reporte** —
   não há nada quebrado para o usuário final.
5. O caminho canônico de relato dentro do app é `BugReportButton`
   (`src/components/ui/BugReportButton.tsx` → `POST /api/bug-reports`), que exige
   sessão (`authenticateToken` em `src/bootstrap/rateLimiters.ts:114` +
   `requireTenant` em `routes.ts:183`) — inadequado para a tela de login por
   definição. Detalhe: `BugReportButton` atualmente não está montado em nenhum
   layout (só referenciado em comentários), o que é uma lacuna separada de produto.

**Conclusão:** não há correção de frontend a fazer — não existe superfície quebrada.
Se o produto quiser relato anônimo na tela de login, é preciso decisão + endpoint
público novo (ex.: `/api/public/error-reports` com rate limit e sanitização de PII),
o que pertence ao Agente 01 (backend) — fora do escopo cirúrgico deste handoff.
Nenhum código foi alterado por este handoff.
