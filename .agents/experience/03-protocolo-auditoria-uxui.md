# 03 — Protocolo de Auditoria UX/UI

**Status:** IMPLEMENTADO · **Uso:** qualquer perfil de experiência (02-*, 03A–03G) executa auditorias de tela com esta metodologia.
**Saída:** registro de achados em `.agents/runs/auditorias-ux/<onda>/<escopo>.md` + evidências (screenshots reais, nunca inventados).

## 1. Escopo da auditoria

Uma "tela" = uma rota ou estado significativo de `src/App.tsx` / módulo de feature. Auditorias podem cobrir:

- rota autenticada (`/app/*`);
- página pública (`/`, `/login`, `/privacidade`, `/termos`, landing variants);
- modal/drawer/fluxo multi-etapa como unidade própria quando a jornada exigir.

**Fora de escopo por padrão:** regras de negócio, contratos de API, tenancy, LGPD de dados — auditar a *apresentação* desses aspectos, não corrigi-los (handoff ao dono).

## 2. As 12 dimensões obrigatórias

Cada tela auditada recebe nota/veredito em cada dimensão. Dimensão não aplicável é marcada `N/A` com justificativa — nunca omitida.

| # | Dimensão | O que verificar |
|---|---|---|
| D1 | Clareza e propósito | A tela responde "onde estou / o que faço aqui" em <5s? Propósito único ou mistura de intenções? |
| D2 | Organização da informação | Hierarquia visual (H1→H6), agrupamento, densidade, ordem de leitura, progressive disclosure. |
| D3 | Navegação e descoberta | Breadcrumbs, volta, deep link, refresh, item de menu correspondente, rotas órfãs. |
| D4 | Consistência visual | Tokens oficiais (`official-identity.css`), radius ramp, trinca tipográfica, espaçamento, ícones, dark/light mode. |
| D5 | Qualidade dos componentes | Primitivos de `src/components/ui/**` vs. implementações ad hoc; estados hover/focus/disabled; duplicação. |
| D6 | Estados e feedback | loading / empty / error / success / stale / offline — todos presentes, honestos e com copy específica PT-BR. |
| D7 | Responsividade | 360 / 390 / 768 / 1024 / 1440px; overflow horizontal, tabelas, kanban, modais, touch targets. |
| D8 | Acessibilidade | WCAG 2.2 AA: teclado, foco visível, contraste 4.5:1/3:1, semântica, aria-live em feedback assíncrono, reduced-motion. |
| D9 | Desempenho percebido | Skeletons proporcionais, ausência de spinner genérico em operação longa, listas grandes, animações custosas. |
| D10 | Jornada e conclusão da tarefa | A tarefa principal da tela é concluível? Passos desnecessários, beco sem saída, ação morta. |
| D11 | Compatibilidade com permissões | VISUALIZADOR não vê ações proibidas; estados bloqueados explicam o porquê; sem vazamento de dado por UI. |
| D12 | Fidelidade à identidade homologada | Paleta/typography/radius de `identidade-visual/` + `DESIGN.md` + constituição; zero AI slop; Landing/Login intocadas em reformas. |

## 3. Schema de achado

Todo não conformidade vira um achado com **todos** os campos:

```
ID:            UX-<ONDA>-<SEQ>          ex.: UX-WB-007 (WB = onda de trabalho)
               Se já existir DEBT-*/UX-NN equivalente no inventário, referenciar o ID canônico
               em `Relacionado:` em vez de criar ID duplicado.
Dimensão:      D1–D12
Rota:          caminho da rota ou "global"/"componente X"
Componente:    arquivo(s) responsável(is) — caminho exato
Descrição:     o que está errado, em uma frase
Evidência:     screenshot real (caminho), trecho de código (arquivo:linha), ou reprodução
Impacto:       o que o usuário não consegue fazer / risco
Severidade:    P0 | P1 | P2 | P3
Prioridade:    derivada (ver §4)
Dono:          agente proprietário do arquivo correto
Correção:      recomendação concreta e mínima
Teste aceite:  como verificar que foi corrigido (comando, teste, inspeção)
Status:        aberto | em-andamento | resolvido | wontfix-justificado
Relacionado:   DEBT-*, handoffs, PRs
```

### Severidades

| Sev | Critério | Exemplos |
|---|---|---|
| **P0 — Bloqueador crítico** | Impede tarefa central, vaza dado, quebra em viewport primário, falsa informação ao usuário | botão que não faz nada em jornada core; KPI fabricado; overflow que impede uso no mobile |
| **P1 — Problema grave** | Degrada significativamente UX/a11y em fluxo principal ou viola norma homologada | erro exibido como empty state; contraste <4.5:1 em texto; navegação por teclado impossível em modal |
| **P2 — Melhoria importante** | Inconsistência ou fricção relevante sem bloquear | token fora do sistema; breadcrumb ausente; estado stale não comunicado |
| **P3 — Refinamento cosmético** | Polish, consistência fina | radius divergente, tracking tipográfico, alinhamento |

### Regras de classificação

1. **Evidência obrigatória** — sem screenshot/código/reprodução, o achado é `hipótese` e não conta para severidade.
2. **Preferência estética não é falha** — divergência de gosto sem violação de token/constituição/WCAG é P3 no máximo e precisa de justificativa.
3. **Prioridade** = f(severidade, frequência de uso da rota, risco de dados/permissão, esforço estimado, dependências). P0 sempre primeiro; entre P1/P2, jornada comercial > tela administrativa > área interna.
4. **Não duplicar** — cruzar com `inventario-mestre.md` (`DEBT-*`) e `audit-2026-11-18/ux-completude.md` (`UX-NN`) antes de abrir achado novo.

## 4. Execução

1. Fixar rota/escopo e viewport base (1440px + 390px mínimo).
2. Percorrer as 12 dimensões; registrar evidência por achado.
3. Para D7/D8, executar verificações reais: `npm run test:e2e` (spec `accessibility.spec.ts` existe), `npx playwright test` direcionado, screenshots via `agent-browser` ou Playwright.
4. Consolidar tabela de achados + veredito por dimensão.
5. Rotear: correções no escopo do executor → plano de correção; fora do escopo → handoffs por arquivo dono.
6. Entregar para revisão do Agente 24 quando fizer parte de onda.

## 5. Template de saída

```markdown
# Auditoria UX/UI — <rota/módulo>
Data: | Auditor (perfil): | Base (commit): | Worktree:

## Veredito por dimensão
| Dim | Status | Nota |
| D1 | ✅/⚠️/❌/N/A | ... |
...

## Achados
<schema §3 por achado>

## Resumo
- P0: n | P1: n | P2: n | P3: n
- Top-3 correções recomendadas (por prioridade)
- Handoffs abertos: <lista>
```

## 6. Integração com o ecossistema

- Achados P0/P1 de jornadas comerciais alimentam o backlog `DEBT-*` via handoff ao Agente 00 (não criar IDs paralelos).
- Telas auditadas com achados de marca/identidade → handoff ao Agente 11 quando envolverem `identidade-visual/**` ou assets.
- Quebras de responsividade mobile → handoff ao Agente 09 quando envolverem shell Capacitor.
- Achados de a11y que exigem teste e2e novo → handoff ao Agente 08 (`tests/**`).
- Evidência visual de regressão → 03F. `visual.spec.ts` está ativo, mas com 11 snapshots divergentes (DEBT-0041/#201) e `tests/AGENTS.md` §6 desatualizado — registrar drift documental como handoff ao Agente 08.
