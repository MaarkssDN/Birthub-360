# Proposta consolidada de ownership — caminhos órfãos

**Data:** 2026-11-25 · **Autor:** Agente 00 (Astra/Devin)
**Origem:** Deliberação do Orquestrador Humano — fechamento da fase 2, decisão 3
**Status:** PROPOSTA — submeter à governança global. Não altera a MATRIZ retroativamente;
paths com conflito sinalizado exigem deliberação humana antes de publicação.

Critérios: (a) domínio funcional mais próximo; (b) menor overlap com squads adjacentes;
(c) quando houver disputa real, proposta de coordenação explícita em vez de dono único.

## 1. E-mail / SMTP (origem: handoffs 55 Ícaro, 58 Elisa)

| Path | Conteúdo | Owner proposto | Justificativa |
|---|---|---|---|
| `src/lib/email/**` (mailer.ts, meetingInvite.ts) | nodemailer, ~12 call sites cross-squad | **55 Ícaro** | Domínio e-mail é dele; `src/lib/integrations/email/**` já é 55. Wiring de `recordOutboundEmailMessage` no `sendEmail` exige contrato com callers → coordenação 55+20. |
| `src/services/email/**` (se existir) | services legados | **55 Ícaro** | idem |

**Conflito a delibrar:** `sendEmail` é chamado por squads 40/50/60/70 — o owner do path não
controla os callers. Recomendo: 55 é dono do contrato de envio; mudanças de assinatura exigem
handoff aos consumidores.

## 2. Voz legada vs Voice Hub (origem: achados 64 Tito, auditoria squad-60)

| Path | Conteúdo | Owner proposto | Justificativa |
|---|---|---|---|
| `src/features/voice/**` | voice-command-executor, pipelines legados; contém risco B-07 latente | **61 Nando** (discador/SIP) com coordenação 60 | É telefonia/discador, não o hub de atendimento. Bloqueio C-2 vigente até correção do `handleTransferCall`. |
| `src/features/ai-voice/**` | IA de voz (STT/LLM em chamada) | **63 Lira** (STT/diarização) ou **74 Luca** (copiloto) — **conflito** | Fronteira IA×voz ambígua → deliberação humana. |
| `src/lib/voice-runtime/**` | runtime de sessão de voz | **60 Aurora** (coordenação) até decomposição | Shared runtime do Voice Hub. |
| `src/lib/voice-hub/**` | já atribuído | 60 (sem mudança) | matriz atual ok |

## 3. CRM application layer (origem: handoff 48 Jade, gaps Ravi)

| Path | Conteúdo | Owner proposto |
|---|---|---|
| `src/features/crm/application/**` | services de domínio CRM (LeadDeduplicationService, CompanyDeduplicationService) | **48 Jade** para dedup/higiene; **41 Cadu** para o restante — split por subpath na matriz |
| `src/features/crm/routes/**` | rotas CRM | **22 Hugo** (camada HTTP) com domínio 40 — ou 40 Ravi; **conflito** → proposta: 22 é dono técnico de rotas, 40 valida contratos |
| `src/features/crm/jobs/**` | workers CRM | **23 Pina** (runtime/filas) executando lógica 40 — **conflito** → proposta: jobs de domínio CRM → 40 Ravi, infra de fila → 23 |

## 4. Cadências / templateRenderer (origem: handoff 67 Teca)

| Path | Conteúdo | Owner proposto |
|---|---|---|
| `src/services/cadence/**` (templateRenderer.service.ts etc.) | renderização de templates de cadência | **44 Lola** (motor de cadências) — `src/services/**` hoje não tem dono; este subpath é inequivocamente cadência |
| `src/services/**` (demais) | catch-all legado | Regra proposta: mapear por subdomínio; default **20 Ciro** até revisão caso a caso |

## 5. Filas / DLQ (origem: handoffs 24 Ivo)

| Path | Conteúdo | Owner proposto |
|---|---|---|
| `src/lib/queue/dlq/**` | DLQ-como-fila (reservado, vazio) | **24 Ivo** (especialidade DLQ) — já reservado na matriz; falta só decisão de transporte com 23 Pina |
| `src/lib/queue/AGENTS.md` | doc local diz dono=16 | Corrigir doc para refletir matriz (23 runtime / 24 DLQ-resilience) — ação do 20 Ciro ou 90 Hélio |

## 6. Docker overlays (origem: handoff 93 Max)

| Path | Conteúdo | Owner proposto |
|---|---|---|
| `docker-compose.{services,opensource,postgres-local,qdrant}.yml` | overlays dev | **93 Max** |
| `docker/postgres/Dockerfile`, `docker/**` restante | imagens auxiliares | **93 Max** |
| Achados a corrigir na sequência | `:latest` generalizado, defaults de senha, credencial literal `prospector:prospector_pass` (langfuse), LiveKit `--dev` | Missão 93-v2 ou 98 Safira (segredos) |

## 7. Prospecção — divergência 05×43 (origem: handoff 58 Elisa)

`prospecting/**` aparece como 05 (enrichment, AGENTS.md local) e 43 (outbound/lead scoring).
**Proposta:** 43 Amon é dono do domínio prospecting/outbound; 05 Luma mantém só
autenticação E2E/fixtures relacionados. **Conflito** → deliberação.

## 8. Superfície HTTP fantasma (origem: inventário 00 + auditoria Ciro)

Matriz cita `src/api/**` que não existe como superfície real — o mount real é
`src/bootstrap/routes.ts` (+ `src/lib/**/routes.ts` por domínio).
**Proposta:** registrar exceção na matriz: `src/bootstrap/routes.ts` → **22 Hugo**;
rotas por domínio permanecem com seus donos de feature. `src/api/**` remover da matriz
ou marcar como "não existe — consolidado em bootstrap".

## 9. WhatsApp 56×60 (já proposto, pendente de ratificação)

- `src/lib/integrations/whatsapp/**` e conectores externos → **56 Luna**
- Experiência/canais internos WhatsApp → **60 Aurora**
- Limite proposto: 56 = protocolo/sessão/anti-ban; 60 = UX de atendimento e roteamento.

## Conflitos que exigem deliberação humana (não resolvo sozinho)

1. `src/features/ai-voice/**` → 63 vs 74.
2. `src/features/crm/routes|jobs/**` → dono técnico (22/23) vs dono de domínio (40).
3. `prospecting/**` → 43 vs 05.
4. `sendEmail`/`src/lib/email/**` → 55 dono do path, mas contrato afeta 4+ squads.
5. Regra geral para `src/services/**` catch-all.
