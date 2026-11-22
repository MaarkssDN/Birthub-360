# 15 — Decisões de Design e Registro de Autoridade
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22

## 1. Hierarquia de autoridade visual (vigente)

1. `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 — autoridade máxima.
2. Requisitos funcionais.
3. Arquitetura existente.
4. Regras das skills especializadas.

## 2. Decisões humanas já registradas (não reabrir)

| ID | Decisão | Data | Status |
|---|---|---|---|
| DS-001 | DL v2.0 é autoridade; paleta neon; gradiente em título permitido só onde o DL §2 prevê (`Gradiente de Títulos`, `Gradiente de Ação`); gradiente decorativo arbitrário proibido | 2026-11-19 | RATIFICADO — `.claude/CLAUDE.md` atualizado (b57673bd) |
| A11Y-001 | Títulos no tema claro devem usar variantes escuras AA; tokens `--title-color-*` já implementados como variantes escuras (`#0369a1`, `#d91b7c`, `#b45309`) | 2026-11-19 | PARCIAL — residual em `--warn`/páginas com paleta dark forçada (ver UX-A11Y-01) |
| GOV-001 | Skills `birthhub-*` existem em `.agents/skills/` e foram espelhadas em `.claude/skills/`; `birthhub-impeccable` não existe na origem | 2026-11-19 | RESOLVIDO |
| GOV-002 | Nenhum skill externo instalado; Playwright MCP só se Agente 14 não entregasse harness | 2026-11-19 | RESOLVIDO — harness do 14 entregue |
| UX-09 | Perfil editável implementado (nome, imagem, senha) — PR #496 waveF | 2026-11-20 | IMPLEMENTADO |
| UX-05a | Componentes de auth legadas mortas removidas — PR #495 waveF | 2026-11-20 | IMPLEMENTADO |
| GOV-487 | `SwarmAuditLog`: retenção LGPD 90 dias p/ ipAddress+userAgent (Agente 15), `onDelete: Cascade` mantido | 2026-11-21 | APROVADO (deliberação humana) |

## 3. Decisões de ownership que afetam esta operação

- **Landing e Login são intocáveis** por esta operação (03A/03G). Qualquer proposta que os envolva vira handoff, não implementação.
- Mudanças em `src/components/layout/**` → Agente 02; `src/components/ui/**` e `src/styles/**` → Agente 03; `src/lib/motion.ts` → 03D.
- Esta operação (Agente 00) produz diagnóstico, backlog e handoffs; implementação segue a matriz de propriedade e exige parecer do Agente 09 (Silas) antes de fechar.

## 4. Decisões pendentes que esta auditoria eleva ao humano

| ID | Questão | Contexto |
|---|---|---|
| DEC-UX-01 | Criar ou não fluxo de criação manual de lead/oportunidade na UI | Backend `createLead` existe com round-robin; UI não expõe. Decisão de produto (CRM core). |
| DEC-UX-02 | Destino das 3 abas placeholder de settings de pilar | Implementar persistência real vs remover abas vs manter disclaimer. Escopo Agente 02/17. |
| DEC-UX-03 | `/app/characters` com paleta dark forçada | Alinhar ao tema claro ou declarar a página como "sempre escura" por design — decisão de DS com impacto a11y. |
| DEC-UX-04 | Funil Negócio: fallback hardcoded de estágios de pilotos | Regra AGENTS.md exige dados de funil via API; fallback precisa morrer ou ser marcado como último recurso explícito. Dono: Agente 04 (CrmBoard) + 02. |

## 5. Princípios adotados nesta operação (sem nova decisão necessária)

- Preservar paleta oficial neon DL v2.0 — nenhuma proposta de troca de identidade.
- Tokens semânticos obrigatórios; proibir novos hex hardcoded em componentes.
- Estados loading/empty/error são obrigatórios por tela (contrato de UX já existente).
- Ações mortas são defeito (regra já vigente no AGENTS.md de sales-orchestration — estendida como princípio geral).
- WCAG 2.2 AA como meta; contraste medido, não presumido.
