# Resultados da verificação de handoffs RESOLVIDO — DEM-20261114-002 (onda 1)

Data: 2026-11-14 · Executor: Agente 00 + 6 verificadores (subagentes read-only, clusters A–F)
Método: inspeção do handoff (seção de resolução/evidência/parecer) + verificação estática
do artefato citado no repositório (grep/glob/read). Sem execução de testes.

## Totais

| Cluster | Destinatários | Resolvidos auditados | CONFIRMADO | SEM-EVIDENCIA | DUVIDA |
|---------|---------------|----------------------|------------|---------------|--------|
| A | 00, 01, 01A | 126 | 110 | 8 | 8 |
| B | 02, 03, 04, 05 | 85 | 76 | 0 | 9 |
| C | 06, 06A, 07 | 53 | 49 | 2 | 2 |
| D | 08, 08A, 09, 10 | 59 | 51 | 2 | 6 |
| E | 11–18 | 83 | 71 | 0 | 12 |
| F | 21–24 + misc | 30 | 29 | 0 | 1 |
| **Total** | | **436** | **386 (88,5%)** | **12** | **38** |

## Itens SEM-EVIDENCIA (12) — marcados resolvidos sem resolução documentada

- `audit-ach/17-para-01-04-agendamento-transporte-pendente.md` (A)
- `executor-f3-para-00-orquestracao-auditoria.md` (A)
- `onda-02-ux/02-para-00-landing-lead-capture.md` (A)
- `onda-13/10-para-00-server-telemetry.md` (A)
- `onda-14/15-para-00-padronizacao-rotacao-segredos.md` (A)
- `onda-51/00-para-todos-evolucao-core-revops-ia-voz.md` (A)
- `onda-1/15-para-01-aprovacao-package-json.md` → arquivo real `15-para-00-...` (A)
- `onda-p0-dialer-503/12-para-00-inventario-503.md` (A)
- `roadmap-v2-transversais/15-para-00-runbook-incident-response-secret-desatualizado.md` (A)
- `onda-14/15-para-06-criptografia-tokens-crms.md` (C — credentialCrypto sem uso em integrations)
- `onda-6/16-para-08-deploy-worker-service.md` (D — "não resolvido"; render.yaml ausente)
- `onda-6/16-para-10-observabilidade-worker.md` (D — serviço não ativado)

## Itens DUVIDA (38) — evidência incompleta, divergente ou condição não atendida

### Cluster A (8)
- `audit-ach/08-para-00-ship-script-bypass.md` — script `ship` não existe em package.json (valor diverge)
- `onda-c0/11-para-00-portais-estaticos-marca-antiga.md` — 4 diretórios removidos, mas `social-selling` permanece
- `onda-saneamento-20261105/00-para-01-filtro-tenant-repositorios-discador.md` — PgCampaignRepository/teste citados ausentes (módulo dialer removido/gated?)
- `onda-saneamento-20261110/00-para-01-hotspot-arquitetural-prisma.md` — implementação existe, gates não rodados, 24 pendente
- `onda-saneamento-20261110/00-para-01-resumo-consumo-ia.md` — resolução é redirecionamento; correção real pendente no 07
- `onda-evolucao-enxame-fase2/00-para-01-07-08-commercial-v3-security.md` — commercialV3.security.test.ts não existe
- `techdebt-2026-09-29/00-para-00-arquivos-monoliticos-scripts.md` — live-browser.js duplicado voltou a existir em .claude
- `techdebt-2026-09-29/00-para-00-typescript-quality.md` — resolução admite filtragem pendente (parcial)

### Cluster B (9)
- `audit-ach/09-para-05-ocr-camera-permission-declarada.md` — CAMERA no manifest ok; validação em device pendente
- `onda-11/09-para-04-commercial-intelligence-tsc-error.md` — resolução de 1 parágrafo, sem commit/teste
- `onda-14/16-para-05-integracao-crawlee-prospeccao.md` — resolução vaga ("via Temporal"), sem artefato
- `onda-38/00-para-02-03-redesign-plataforma.md` — "resolvido=adiado" por freeze; corpo diz em-andamento
- `onda-7/05-para-02-rotulagem-confirmado-inferido.md` — badges CONFIRMADO/INFERIDO/HUNTER ausentes em src
- `onda-8/09-para-02-downloads-blob-nao-funcionam-no-app.md` — resolvido=postponed por freeze; nada implementado
- `onda-8/09-para-02-voice-command-nao-funciona-no-app.md` — resolvido=postponed; plugin não instalado
- `onda-lint-main-20261025/07-para-03-hotspots-intelligence.md` — só exceção/prazo registrado; redução não evidenciada
- `roadmap-v2-onda-4/11-para-03-brand-2-default-nao-bate-com-atlasgr.md` — --brand-2 hoje #ff2d9b diverge do #f0d77b documentado

### Cluster C (2)
- `onda-forense-20261020/00-para-06-forense.md` — double-cast `as unknown as` persiste; validação de contrato não implementada
- `onda-saneamento-20261110/01-para-07-resumo-consumo-ia-findmany.md` — cost-analysis usa groupBy, mas heatmap segue findMany sem take e costUsd fabricado

### Cluster D (6)
- `onda-6/15-para-08-zap-trivy-gate.md` — workflow existe, mas RELEASE_CHECKLIST.md citado não existe
- `onda-8/09-para-08-10-dominio-producao-e-verificacao-deep-link.md` — resolução é deferral, não conclusão
- `onda-forense-20261020/00-para-09-forense.md` — Crypto storage existe, mas logout não expurga fila offline
- `onda-liquidacao-debitos/10-para-08A-deploy-ec2-scripts.md` — healthcheck ok; migrações e rollback pendentes
- `onda-paralela-8/00-para-08-unit-failures.md` — apenas relato de execução; nada estaticamente verificável
- `saneamento-onda-3/01-para-08-ci-migrate-diff-gate.md` — continue-on-error mantido por freeze; gate não-bloqueante

### Cluster E (12)
- `onda-7/12-para-17-optout-unificado-voz.md` — resolução delega pontes ao 17; evidência de conclusão ausente
- `onda-forense-20261020/00-para-12-forense.md` — código ainda simula métricas e links de billing/dialer
- `onda-forense-20261020/00-para-15-forense.md` — continuousSecurityAudit usa CVE/waivers hardcoded
- `onda-forense-20261020/00-para-17-forense.md` — filtro inclui leads sem organizationId no tenant
- `onda-ia-1/15-para-14-avaliacao-pii.md` — spec pii-guardrail.spec.ts esperado não existe
- `onda-p0-dialer-503/12-para-17-dialer-sql-seguro.md` — resolução é decisão; dialer depois removido
- `onda-saneamento-20261105/00-para-13-modularizacao-supervisor-agent.md` — Supervisor segue ~900 linhas, sem decomposição
- `onda-saneamento-20261105/04-para-12-correcao-faturamento-meses-31-dias.md` — serviço corrigido só referenciado por testes
- `onda-saneamento-20261105/05-para-17-trava-templates-cadencia.md` — renderer criado sem consumidor produtivo
- `onda-saneamento-20261105/06-para-17-janela-horario-comercial-whatsapp.md` — scheduler isolado sem integração produtiva
- `onda-saneamento-20261105/15-para-12-mascaramento-pii-transcricoes-voz.md` — máscara existe, pipeline real não a consome
- `onda-saneamento-20261105/23-para-13-limite-recursao-agent-bus.md` — limite em protótipo sem consumidores produtivos

### Cluster F (1)
- `onda-52/01-para-24-typecheck-integrations-schema-decision.md` — seção Resolução vazia no handoff (parecer 24 existe, PR #91)

## Alertas estruturais levantados pelos verificadores

1. **"resolvido=postponed/adiado" infla o contador** — ao menos 3 itens (downloads-blob, voice-command, redesign-plataforma) estão marcados resolvidos mas foram apenas adiados por freeze. Candidatos a rebaixar para BLOQUEADO/adiado.
2. **Resoluções que são redirecionamento, não correção** — ex.: resumo-consumo-IA (00→07), optout-voz (12→17). O handoff fecha mas o trabalho real pode estar pendente no destinatário final.
3. **Código citado diverge do atual** — regressões detectadas: live-browser.js duplicado retornou; brand-2 mudou de valor; PgCampaignRepository não existe mais; social-selling portal permanece.
4. **Condição de encerramento pendente** — itens cujas resoluções dizem "pendente de parecer do 24" constam como RESOLVIDO (ex.: TAREFA-004/005/021/022/023/045/046 citados pelo cluster C).
5. **Resolução vazia/declarativa** — 12 itens SEM-EVIDENCIA + handoff com seção de resolução em branco (onda-52 typecheck).

## Pendências de processo para o 00

- Reclassificar os "resolvido=postponed" e redirecionamentos puros.
- Abrir handoffs de correção para os itens DUVIDA com defeito real confirmado
  (ex.: heatmap findMany+costUsd fabricado, double-cast forense, filtro tenant forense-17).
- Verificação profunda (execução de testes) dos itens CONFIRMADO por amostragem
  fica para onda 2, priorizando clusters com maior risco (A, C, E).
