# Onda 02 — Despacho dos agentes restantes (Agente 00)

Data: 2026-11-13 · Branch: `agente/02-onda-02-ux` (worktree `agente-02-onda02`)

## Estado verificado

- Auditoria funcional dos 11 módulos: **concluída** — fabricações reais
  concentradas em landing (2 forms), War Room, failover e 2 UIs mortas
  (todas corrigidas/removidas; -976 linhas).
- Shell 100% tokenizado; CrmBoard, personagens tokenizados.
- Gates locais verdes: `tsc` 0 erros · `biome lint` 0 erros (1433
  warnings pré-existentes) · build+PWA ok · testes-alvo verdes.
- `test:integration` e `test:e2e`: **bloqueados neste ambiente** — sem
  Docker (`docker` não instalado/acessível) e sem `.env.test`. Precisam do
  harness do Agente 14/08.

## Tarefas por agente

### Agente 07 — Inteligência Artificial (P06)
- Triar `Math.random`/`setTimeout`/mock em `features/intelligence/**` e
  `copiloto-ia/**`: `agents/triad/*.agent.ts`, `swarmMission.constants.ts`,
  `services/{proactiveAlerts,promptAbTesting,successPrediction}.service.ts`.
- Aplicar o mesmo padrão da Onda 02: nada de score/métrica fabricada
  apresentada como real; simulações devem ser rotuladas.
- Handoff de tokens já aberto: `02-para-07-intelligence-hub-tokens.md`
  (78 hex crus em features/intelligence).

### Agente 05/17 — Prospecção e Cadência (P02/P03)
- Nada pendente na auditoria funcional — domínios verificados honestos.
- Se houver handoffs abertos de waves anteriores, concluí-los.

### Agente 04 — CRM e BI (P01/P04)
- Handoff aberto: `02-para-04-crm-kanban-tokens.md` — hex crus em
  `features/crm/components/Kanban*` com mapeamento pronto.
- War Room e failover já corrigidos pelo 02 (fora do seu domínio, FYI).

### Agente 08 — QA e Release
- Executar gate completo na branch de integração quando o 00 mergear:
  `test:unit` completo, `test:integration` (Postgres+RLS), `test:e2e`
  (Playwright), axe/a11y E2E.
- Revisar os testes atualizados em `CockpitScreens.unit.test.tsx` e
  `cockpitsAndPanels.unit.test.tsx` (contrato V2 do cockpit real).

### Agente 03 — Design e Acessibilidade
- Auditoria a11y dos componentes interativos do shell e workspaces
  (em andamento via subagente nesta sessão — achados serão anexados).
- `globals.css`/`official-identity.css`: 1433 warnings de lint
  (`!important`, `noImportantStyles`) — débito conhecido, priorizar por
  impacto visual, não em massa.

### Agente 01 — Plataforma e Dados
- Decidir persistência estruturada de leads públicos (hoje só e-mail via
  `LEAD_CAPTURE_EMAIL`/`SMTP_*`); se necessário, propor schema via
  handoff — ver `02-para-00-landing-lead-capture.md`.

### Agente 00 — Coordenação
- Integrar `agente/02-onda-02-ux` em `integracao/onda-02` (15+ commits,
  lista no plano mestre §6).
- Registrar decisões pendentes: depoimentos fabricados da landing
  (Marca/11 + Produto/02), `Landing360Impeccable.tsx` não roteada,
  `LEAD_CAPTURE_EMAIL` no ambiente de deploy.
