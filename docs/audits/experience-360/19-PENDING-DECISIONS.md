# 19 — Relatório de Decisões Pendentes

**Data:** 2026-11-21 · **Contexto:** Deliberação do Orquestrador (itens 1-7)

---

## 1. Decisões JÁ tomadas pelo Orquestrador (registradas)

| # | Tema | Decisão | Registro |
|---|---|---|---|
| 1 | DL v2.0 × implementação | Reconciliação documental aprovada; proposta do Agente 03+marca antes de mudanças estruturais | ADR-012 + `16-DESIGN-LANGUAGE-RECONCILIATION.md` |
| 2 | OPP-01 criação manual de lead | Escopo aprovado; implementação condicionada à governança | ADR-013 + handoff `00-para-04-21` |
| 3 | Voice-hub 503 | Fallback temporário p/ dashboard aprovado; correção definitiva P1 no backlog | ADR-014 + handoff `00-para-02-12` |
| 4 | /app/characters | Migração p/ temas oficiais AA aprovada; sem dark forçado | ADR-015 + handoff `00-para-02-03` |
| 5 | Onda 1 | 8 handoffs P1 autorizados (preparados, sem implementação) | `.agents/handoffs/onda-1/` |
| 6 | Auditoria independente | Obrigatória antes de implementação — instância separada | Handoff `00-para-09-silas` |
| 7 | Execução | Melhoria incremental, sem reescrita; baseline antes de implementar | `18-HOMOLOGATION-PLAN.md` |

## 2. Decisões PENDENTES (precisam do Orquestrador)

### 2.1 Imediatas (destravam a Onda 1)
- **Designar donos sem AGENTS.md local:** `src/hooks/**` (useFetch),
  `src/contexts/**` (providers), `src/features/characters/**`,
  `src/features/signals-risks/**`.
- **Aprovar os 8 handoffs da Onda 1** após parecer do Silas.
- **Agendar/destinár a auditoria do Silas** — instância realmente separada
  (não mudança de papel no mesmo runtime).

### 2.2 Estruturais (destravam a Onda 3)
- **Aprovar a proposta de reconciliação do DL v2.1** (após Agente 03+marca
  executarem `16-DESIGN-LANGUAGE-RECONCILIATION.md`).
- **Decidir destino do `design-system/` do voice-hub** após consolidação
  (deprecar migração — COMP-001).
- **Critérios objetivos de reativação do Voice Hub** (com Agente 12) — o que
  precisa estar pronto para reabrir o `legacyModuleGate`.

### 2.3 De produto/UX (backlog, não bloqueiam Onda 1)
- Settings pilar placeholders — manter ou implementar?
- Command Palette permissões — confirmar se deve filtrar por papel (achado de
  segurança/UX a validar com Silas).
- Expansões de experiência (OPP-*) — priorização após Onda 1.

## 3. Bloqueios de implementação vigentes

Implementação, merge e promoção **NÃO autorizados** até:
1. ✅ Decisões de produto — FEITAS.
2. ⬜ Parecer do Agente 09 (Silas) — **PENDENTE**.
3. ⬜ Aprovação dos handoffs pelo Orquestrador.
4. ⬜ Baseline visual (`test:visual`) executada — **PENDENTE** (nunca rodada).

## 4. Próximo passo recomendado

1. Orquestrador designa donos dos arquivos sem AGENTS.md (item 2.1).
2. Encaminhar pacote ao Silas (handoff `00-para-09-silas` já preparado).
3. Agente 03+marca executam a proposta de reconciliação do DL.
4. Após Silas APROVAR → Orquestrador aprova handoffs → Onda 1 inicia com
   baseline visual.
