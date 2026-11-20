# Auditoria B-01/B-02 — autorização em rotas HTTP (leitura apenas)

Agente / Onda / Branch: 00 (Astra) · Onda 1 do `CHECKLIST_RESOLUCAO_ONDAS.md` · `agente/97-b02-rotas-admin`
Data: 2026-11-20 · Escopo: **somente leitura** — nenhum código de aplicação foi alterado.
Itens do checklist: `[97 · Rocco]` B-01/B-02. O arquivo citado no checklist (`src/lib/auth/rbac/enforcer.ts`)
**não existe**; a fonte de RBAC real é `src/lib/auth/authorization.ts` + `src/shared/middlewares/requireRole.ts`.

## Conclusão (status: VERIFICADO por leitura de código; NÃO EXECUTADO em runtime)
- **B-01 (RBAC duplicado): resolvido na prática.** Há uma única hierarquia
  (`ROLE_HIERARCHY` em `authorization.ts`) usada por `requireRole`/`hasRequiredRole`; o sistema
  paralelo morto foi removido (histórico no cabeçalho do arquivo).
- **B-02 (rotas administrativas sem autorização): nenhuma rota aberta e nenhuma escalada de
  privilégio encontrada** nas 79 montagens de `src/bootstrap/routes.ts`. Os achados reais são de
  **cobertura de teste**, não de código desprotegido (ver abaixo).
- Critério do checklist ("acesso a rota admin por usuário comum gera 403 padronizado"):
  `requireRole` responde `401` sem sessão e `403` com `Insufficient permissions…` (padronizado).
  Prova automatizada existe só para parte das rotas (ver "Lacunas de teste").

## Método
1. Mapa de montagem (`src/bootstrap/routes.ts` + `src/bootstrap/rateLimiters.ts`).
2. Varredura estática de cada router: mutações (POST/PUT/PATCH/DELETE) × guardas de papel
   (`requireRole`, aliases como `writeRoles`/`managementRoles`, `router.use(requireRole…)`).
3. Verificação manual de todo caso "sem guarda aparente" até a camada de serviço.

Limitação da varredura: primeira versão deu falsos positivos por não reconhecer aliases
(`const writeRoles = requireRole([...])`) nem guardas em serviços; foram todos revistos à mão.

## Verificações (todas confirmadas por leitura)
| Item | Evidência | Resultado |
|---|---|---|
| Rotas montadas sem `authenticateToken` no `app.use` (`/api/intelligence`, `/api/agent`, `/api/knowledge`, `/api/bug-reports`) | `authenticateToken` roda antes, em `rateLimiters.ts` (linhas 66–74, 114) | Protegidas |
| `/api/calendar/booking-links` | `privateBookingRouter.use(authenticateToken, requireTenant)` | Protegida |
| Rotas públicas (`/api/public/*`, `/api/calendar/book`, `/api/public/data-subject-requests`) | Intencionais, com limitador dedicado e sem persistência indevida | Aceitas por desenho |
| `/api/access-requests` (aprovar/negar) | `decideAccessRequest`: bloqueia autoaprovação, exige `minApproverUserRole` + cargo elegível, grava auditoria | Protegida (serviço) |
| `/api/memory` approve/rollback | `isEligibleDecider`; rollback só ADMIN/GESTOR | Protegida (serviço) |
| `/api/agent-builder` approve/reject | `isEligibleReviewer` → 403 `FORBIDDEN` | Protegida (serviço) |
| `/api/auth-extra` `DELETE /sessions/:id` | `deleteMany({ where: { id, userId: user.id } })` | Sem IDOR |
| `/api/knowledge` | todas as escritas usam `writeRoles`; `DELETE` exige ADMIN/GESTOR; `/search` é consulta | Protegida |
| `/api/leads` | `managementRoles` (ADMIN/GESTOR) e `writeRoles` (sem VISUALIZADOR) | Protegida |
| `/api/team`, `/api/module-access`, `/api/organization-modules`, `/api/job-roles` | `router.use(requireRole(...))` | Protegidas |
| `/api/api-keys` | `requireRole(['ADMIN'])` no mount | Protegida |
| `/admin/queues`, `/metrics` | `PLATFORM_OPERATOR_TOKEN`, falha fechada | Protegidas |

## Lacunas de teste (OBRIGATÓRIO pelo AGENTS.md §26: "testes de acesso cruzado")
Heurística por citação do arquivo de rota/prefixo em testes que também afirmam 403. Pode subestimar
testes que montam routers sem o prefixo — **confirmar antes de corrigir**.

Sem teste de acesso negado encontrado: `team`, `api-keys`, `module-access`, `organization-modules`,
`omie`, `slack`, `whatsapp`, `automations`, `job-roles`, `access-requests`, `memory`,
`agent-builder`, `knowledge`, `google`. Com cobertura de 403: CRM (writes/operations), feature
flags, copiloto IA, inteligência comercial, BullBoard, usage, bug-reports, birth-voice, 3cx,
stripe/bitrix (parcial), pillars, LGPD.

### Tratamento (mesma branch)
`tests/unit/security/admin-routes-access-denied.contract.test.ts` — 140 testes de contrato (router
REAL + `authenticateToken` REAL, só a sessão simulada) provando 403 padronizado para papel
insuficiente e 401 sem sessão em: `team`, `module-access`, `organization-modules`, `job-roles`,
`api-keys`, `settings/pillars` (PUT), `omie`, `slack`, `whatsapp` (conectar/desconectar),
`automations` (gestão e `stagnation-scan`) e `knowledge` (DELETE). TESTADO localmente (sem Postgres):
140/140 passam; controle negativo — remover a guarda de `team` e de `omie /connect` quebra 19 testes.
Ainda SEM teste de acesso negado: `access-requests`, `memory`, `agent-builder` e `google` (a proteção
destes está na camada de serviço, não no middleware — exigem testes de serviço/integração, outro escopo).
O caminho de SUCESSO com sessão e RLS reais segue nos `tests/integration/rbac-e2e-*` (precisam de
Postgres; NÃO EXECUTADO aqui).

## Recomendações de endurecimento (OPCIONAL — não são defeitos comprovados)
- `POST /api/prospecting/enrich` (scraper web com Playwright): hoje qualquer usuário autenticado,
  inclusive VISUALIZADOR, aciona. Há guarda SSRF (`isSafeUrl`); sugerir piso `writeRoles` como
  nas demais ações faturáveis/pesadas (precedente: ACH-05-01 em `/discover`).
- `POST /api/prospecting/apollo/reconnect`, `/enrich-cnpj`, `/tools/*`: consultas a provedores
  externos abertas a qualquer papel; decisão de produto sobre piso de papel. (DECISÃO HUMANA)
- `requireRole` expõe o papel do usuário na mensagem de 403 (`Your role: …`); baixo risco, mas
  é informação desnecessária ao cliente.

## Pendências / próximos passos propostos
1. (Feito) testes de acesso negado por contrato — ver "Tratamento".
2. Testes de serviço para as proteções em camada de serviço (`access-requests`, `memory`, `agent-builder`).
3. Decidir os pisos de papel opcionais acima (decisão humana).

Handoffs abertos: nenhum novo. Riscos: nenhum defeito de código confirmado; risco residual é
regressão futura sem teste de 403 nas rotas listadas.
Parecer do Agente 09 (Silas): **NÃO EXECUTADO** — este relatório não é aprovação de entrega.
