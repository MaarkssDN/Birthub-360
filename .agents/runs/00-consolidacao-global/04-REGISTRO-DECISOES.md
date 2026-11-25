# 04 — REGISTRO GLOBAL DE DECISÕES
Data: 2026-11-19 · IDs `DEC-*` · Status: VIGENTE · SUBSTITUÍDA · PENDENTE

## VIGENTES (aprovadas pelo Orquestrador Humano)

| ID | Assunto | Decisão | Fonte | Data | Impacto |
|---|---|---|---|---|---|
| DEC-001 | Arquitetura especialistas UX | Estratégia C híbrida: perfis 02A–02D internos, sem novos slots; enxame 03A–03G reutilizado | missão master + aprovação "todas" | 18/11 | Governança oficial |
| DEC-002 | Prompts 02A–02D | Criados em `.agents/prompts/` (P-01) | idem | 18/11 | 4 especialistas chamáveis |
| DEC-003 | Roster/slots | 02A–02D registrados §3/§14; slot exclusivo 02↔02A–D | idem | 18/11 | Sem sobreposição |
| DEC-004 | Landing ownership | `src/features/landing/**`→02; exceção `/landing-new`→12 | idem | 18/11 | P-05 AGENTS.md local |
| DEC-005 | CrmBoard ownership | `CrmBoard.tsx`/toolbar/hooks→04 | decisão usuário "vamos decidir" | 18/11 | `src/components/AGENTS.md` |
| DEC-006 | Gamification ownership | →02 | idem | 18/11 | AGENTS.md local |
| DEC-007 | Sales-orchestration ownership | →17 | idem | 18/11 | AGENTS.md local |
| DEC-008 | Auth legada | remoção pelo 01 | idem | 18/11 | handoff UX-05a |
| DEC-009 | UX-01 produto | **prospecção-only**: sem criação manual de lead; backend `POST /api/leads` preservado | decisão usuário | 18/11 | intents palette removidos |
| DEC-010 | Tokens canônicos | identidade-visual→official-identity.css→globals.css; voice-hub é shim | diagnóstico 18/11 | 18/11 | base p/ Onda C |
| DEC-011 | Auditoria WB-1 | executada contra `main` real (não branch), 3 rodadas 24 até APROVADO | processo | 18/11 | metodologia: base=main |
| DEC-012 | Correções WB-1 P2 | UX-02/07/11 executadas em paralelo, agentes donos, 24 APROVADO | "SIM" usuário | 19/11 | `f2d4d596b` |

## SUBSTITUÍDAS / HISTÓRICAS

| ID | Assunto | Decisão anterior | Substituída por | Motivo |
|---|---|---|---|---|
| DEC-H01 | Criação manual lead/opportunity na UI | implícita nos intents palette | DEC-009 prospecção-only | decisão de produto |
| DEC-H02 | `visual.spec.ts` "100% skip" | diagnóstico v1 | ativo desde `dff5677d8` | correção factual 24 v1 |
| DEC-H03 | `Landing360Impeccable` candidata canônica | hipótese inicial | `Landing360` é canônica; Impeccable não roteada | verificação repo |
| DEC-H04 | voice-hub tokens duplicados | hipótese inicial | shim de re-export; dívida real = hex consumers | TOKEN-AUDIT |

## PENDENTES DE APROVAÇÃO (aguardam Orquestrador Humano)

| ID | Assunto | Opções | Impacto |
|---|---|---|---|
| DEC-P01 | UX-08 settings placeholders | (a) remover 3 abas (b) manter preview honesto | P3 |
| DEC-P02 | P0-0004 escopo mobile no release | incluir/excluir mobile | P0 — bloqueia release |
| DEC-P03 | Consentimento IA | política a definir (com 21) | P1 |
| DEC-P04 | Escopo voz/mobile releases | definir fronteira | P1 |
| DEC-P05 | `.agents/experience/**` ownership §15 | atribuir dono ou deixar 00 | P3 governança |
| DEC-P06 | Canonização landing (Onda E) | escolher variante canônica | requer autorização superfície pública |
| DEC-P07 | Deploy approach (BG-REL-001) | estratégia deploy+migration | P0 |

## Conflitos registrados
- Nenhuma decisão vigente contradiz outra. DEC-009 explica remoção de intents (não era regressão).
- REGRA: decisões em `.agents/prompts/**` e `AGENTS.md` exigem autorização humana explícita — sempre.
