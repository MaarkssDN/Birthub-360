# Relatório Executivo — Release Readiness Birth Hub 360°
**Data:** 2026-11-18 | **Base:** `main @ b54060ad1` (8 commits à frente de origin/main) | **Auditoria:** 11 domínios + transversal, evidência arquivo:linha.

## Veredito: **NO-GO**

A plataforma **não pode ser lançada agora**. Não por dívida difusa, mas por um conjunto pequeno e concreto de bloqueadores em 4 clusters: **deploy/dados (P0)**, **LGPD/envio/consentimento**, **custo/ honestidade de IA**, e **gates de qualidade estruturalmente insuficientes**.

## Respostas às 8 perguntas

### 1. O que está errado/incompleto/inseguro?
Ver `inventario-mestre.md`: **4 P0, 22 P1 confirmados, ~34 P2, dezenas de P3**. Concentração real:
- **Operação:** deploy sem migrate/healthcheck; zero backup; observabilidade cega; rollback sem caminho.
- **Dados/LGPD:** retenção morta e incompatível com RLS; import Bitrix não atômica; voz persiste PII sem retenção; cold-email sem rastro/base legal; opt-out inexerciseível.
- **Segurança:** SSRF residual no scraper (VISUALIZADOR alcança); fallback global Bitrix; segredo 3CX global; rotas IA/prospecção sem RBAC/Zod.
- **Funcionalidade:** cadência inerte (falso positivo de reply + pending eterno); sem criação manual de lead; status de lead fora do fluxo canônico em 2 caminhos; Company hard-delete.
- **IA:** loop ReAct fora do gateway (custo invisível); quota fail-open; fallback fabrica prompt "aprovado"; consentimento é env var.
- **Higiene:** ~31k LOC mortas (voz×2, outbound, temporal-workers, proposals, design-lab público); typecheck não cobre `@ts-nocheck` e excludes do tsconfig.

### 2. O que realmente impede o lançamento?
**Mínimo para GO (Trilha 1+2):**
- DEBT-0001/0002 (deploy+backup) — sem isso, qualquer incidente é perda total.
- DEBT-0003 — confirmar topologia worker; se dedicado, sync CRM para.
- DEBT-0005/0006/0007 — verificar envs (`BITRIX24_WEBHOOK_URL`, `THREECX_WEBHOOK_SECRET`); corrigir SSRF independentemente.
- DEBT-0008/0009/0010/0011 — módulo Cadência/cold-email não pode ir ao ar assim.
- DEBT-0012/0014/0015 — se IA/enxame for feature de lançamento, loop ReAct precisa de quota+custo; se não for, manter gated e documentar.
- DEBT-0016/0017/0019/0020 — integridade CRM/dados antes de dados reais de clientes.
- DEBT-0021/0022/0023 — se voz no escopo; senão manter gated (já está 503).
- DEBT-0024 — jornada "cadastrar oportunidade" é core de CRM.
- DEBT-0026 — gates de qualidade precisam medir o que afirmam.

### 3. Corrigido mas não integrado/validado?
- **PRs #381–#393 (13 PRs de saneamento de handoffs)** todos OPEN/MERGEABLE — contêm correções reais já verificadas em parte na main (ex.: tenancy prospecting do #383 já está em main; DSR do #381 já em main). **Vários achados desta auditoria podem já estar cobertos em branches** — reconciliar diff-a-diff antes de corrigir (ver `plano-saneamento.md` etapa 0).
- PRs conflitantes: #368, #366, #361 (CONFLICTING); #310, #372, #378 com checks históricos falhos.
- Correções de tenancy/contrato verificadas em main: providerCache v2 tenant, assertLeadRelationsInTenant, RLS estática 137 tabelas, webhooks HMAC, erasure LGPD transacional.

### 4. Menor sequência segura?
Ver `plano-saneamento.md`. Resumo: **(0)** reconciliar PRs abertos × achados → merge na ordem segura; **(1)** P0 deploy/backup/topologia; **(2)** P1 segurança/envs; **(3)** P1 cadência/LGPD/cold-email; **(4)** P1 CRM/dados; **(5)** P1 IA se no escopo; **(6)** gates (Sonar coverage, verify:* no CI); **(7)** saneamento de mortos (decisão remover×reincluir); **(8)** Onda E convergência + 24 + GO/NO-GO.

### 5. Dono e evidência por correção?
Matriz em `plano-saneamento.md` §owners. Regra: achados de domínio vão ao agente dono via handoff; Agente 24 revisa cada diff exato antes de merge.

### 6. Paralelizável?
Sim — trilhas independentes: (deploy/backup=10/08) ∥ (segurança rotas=15/05) ∥ (cadência=17) ∥ (CRM dados=04/01) ∥ (IA=07/13) ∥ (UX=02) ∥ (higiene mortos=00 coordenado). Conflitos prováveis apenas em `bootstrap/routes.ts`, `schema.prisma` (→01), `package.json` (→00).

### 7. Pode ficar para depois?
P2/P3 não-bloqueadores: envelopes de erro, paginação residual, duplicação de tipos, deps mortas, hotspots (atenção ao vencimento 2026-11-30 das exceções/waivers — ação preventiva necessária), mobile app (se fora de escopo), voice-hub pages, design system Polish, docs stale.

### 8. Condições objetivas para GO?
Ver `plano-saneamento.md` §GO-LIVE checklist. Resumo: todos os P0 resolvidos ou formalmente descartados por decisão; P1 de módulos NO ESCOPO resolvidos e revalidados; envs de produção verificadas; backup+restore drill com evidência; CI verde no SHA candidato incluindo verify:migration-drift sem continue-on-error ou com baseline; parecer 24 APROVADO na revisão exata; E2E das jornadas essenciais (login→CRM→cadência→conversão; prospecção→promoção; LGPD DSR) executado.

## Painel executivo

| Indicador | Resultado |
|---|---|
| Agentes/domínios auditados | 11 relatórios + transversal + baseline gates (cobertura: 01,01A,02,04,05,07,08,10,12,13,15,16,17,18,21,22,23 + parcial 03/09/11/14) |
| Domínios sem cobertura suficiente | 03 (design/a11y visual — só via PRs), 06/06A (integrações Bitrix em profundidade — parcial via 05/12), 09 mobile (parcial via 10), 11 marca (parcial), 22 verificação runtime (limitado a estático), 24 (pendente revisão do consolidado) |
| P0 confirmados | 4 (sendo 2 DEPENDE DE DECISÃO/escopo) |
| P1 confirmados | 22 |
| P2/P3 confirmados | ~34 / dezenas |
| Gates executados em main | typecheck PASS, lint PASS, test:architecture PASS, verify:rls-coverage PASS, verify:openapi-drift PASS, verify:governance-reviews PASS, verify:ownership-coverage PASS |
| Gates NÃO executados localmente | test:unit, test:integration, test:e2e, build, verify:integrations, verify:ai, verify:migration-drift, npm audit (ambiente/Docker) — CI cobre nos PRs, não em main local |
| PRs abertos reconciliados | 22 inventariados; #381–#393 = saneamento de handoffs (13 PRs); #368/#366/#361 conflitantes; #310/#372/#378 checks falhos históricos |
| Pareceres 24 pendentes | ≥13 (um por PR #381–#393) + este consolidado |
| Estado do release | **NO-GO** |

## Riscos de processo
- **Trava de mutação:** nenhum fix P0/P1 deve começar antes de reconciliar PRs abertos (vários achados podem já estar em branches).
- **Evidência ambiental:** envs do EC2 e topologia de worker são decisivas para severidade real de DEBT-0003/0006/0007 — checklist de verificação em `plano-saneamento.md`.
- **Vencimento 2026-11-30:** 13 exceções de hotspot + ~30 waivers Trivy vencem em bloco — se hoje ≥ essa data, `check:hotspots` falha; ação preventiva.
- **TechDebt JSON histórico é >90% ruído** — não usar como backlog; achados reais desta auditoria são a fonte.
