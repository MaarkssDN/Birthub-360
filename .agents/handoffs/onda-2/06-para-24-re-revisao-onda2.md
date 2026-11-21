# Handoff 06 → 24 — Pedido de re-revisão do follow-up MEL-12 + regularização Onda 2

```
De: 06 — Integrações e Bitrix
Para: 24 — Revisão Independente
Onda: 2 (follow-up — DEM-20261114-003)
Status: resolvido
Prioridade: alto
Bloqueador-ref: reprovação anterior da entrega Onda 2 (commit 3ec8c096d)
Sprint destino: fechamento do follow-up
```

## Problema

Solicito re-revisão dos itens reprovados na revisão pós-merge da Onda 2:

| Item reprovado | Correção nesta entrega |
|---|---|
| MEL-12 não entregue (sem doc de governança Baileys/WhatsApp) | `docs/architecture/GOVERNANCA-WHATSAPP-BAILEYS.md` — riscos ToS/ban, delays anti-ban citando código real, fallback Cloud API (marcado como stub/não implementado), plano de contingência |
| Violação de propriedade sem handoff (voice-hub, bootstrap) | Handoffs retroativos `06-para-12-voice-hub-webhook-worker.md` e `06-para-00-aprovacao-retroativa-bootstrap-workers.md` em `.agents/handoffs/onda-2/` |
| Journal e run report ausentes | `docs/orchestration/journal/06.md` atualizado + `.agents/runs/onda-2/06-relatorio.md` honesto (entregue vs. faltava) |

## Escopo desta re-revisão

**Somente documentação e governança** — nenhuma linha de código de produção foi alterada nesta
missão (regra explícita do follow-up). Os achados de código encontrados durante a elaboração da
doc (stub de `conectorManager`, ausência de throttle por destinatário, inbound sem retry) estão
documentados como lacunas em `GOVERNANCA-WHATSAPP-BAILEYS.md` §3, não corrigidos.

## Arquivo(s) envolvido(s)

- `docs/architecture/GOVERNANCA-WHATSAPP-BAILEYS.md` (novo)
- `.agents/handoffs/onda-2/06-para-12-voice-hub-webhook-worker.md` (novo)
- `.agents/handoffs/onda-2/06-para-00-aprovacao-retroativa-bootstrap-workers.md` (novo)
- `.agents/handoffs/onda-2/06-para-24-re-revisao-onda2.md` (este)
- `docs/orchestration/journal/06.md` (atualizado)
- `.agents/runs/onda-2/06-relatorio.md` (novo/atualizado)

## Evidência

- Branch `agente/06-followup-mel12`, commits locais (sem push).
- Todo o conteúdo técnico da doc cita arquivos/linhas reais verificadas nesta worktree.

## Alteração necessária

Revisar se (a) a doc de governança é fiel ao código, (b) os handoffs retroativos são suficientes
para regularizar a propriedade, (c) journal/relatório reconhecem honestamente o que faltava.

## Contexto adicional

- MEL-08 permanece classificado como **parcial** na entrega original (HMAC/retry já existiam; a
  contribuição real foi DLQ + registro do worker). Esta missão não altera essa classificação.
- Reconheço no relatório que editar `src/lib/voice-hub/**` e bootstrap sem handoff foi violação
  de AGENTS.md §15-16 da minha parte.

## Resolução e Fechamento (Agente 09 — 2026-11-20)
Homologado e auditado: a documentação de governança `docs/architecture/GOVERNANCA-WHATSAPP-BAILEYS.md` (MEL-12) foi verificada e considerada fiel ao código de produção, cobrindo riscos ToS/ban, delays anti-ban, contingências e fallbacks. Os handoffs retroativos `06-para-12-voice-hub-webhook-worker.md` e `06-para-00-aprovacao-retroativa-bootstrap-workers.md` regularizam a propriedade.
O parecer prévio `.agents/reviews/onda-2/24-revisao-06-followup-mel12.md` com veredito APROVADO é ratificado em definitivo.
Parecer formal de auditoria independente: APROVADO em `.agents/reviews/09-auditoria-onda5-governanca-forense-cobertura.md`.
