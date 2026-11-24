# 18 — Plano de Testes e Homologação Visual/Funcional

**Data:** 2026-11-21 · **Base:** `14-TEST-MATRIX.md`, Decisão 7 do Orquestrador
**Princípio:** baseline verificável ANTES de implementar; nenhuma correção sem
evidência de não-regressão.

---

## 1. Baseline pré-implementação (OBRIGATÓRIO antes da Onda 1)

Antes de qualquer correção, estabelecer e registrar:

| Verificação | Como | Status conhecido |
|---|---|---|
| Build | `npm run build` | passa |
| Typecheck | `npx tsc --noEmit` | passa |
| Lint | `npm run lint` | 0 erros / ~1.561 warnings (pré-existentes) |
| Unit | Vitest paralelo | 7.366 passam, 1 skip |
| Architecture | `npm run test:architecture` | 70 violações conhecidas = baseline |
| **Visual snapshots** | `npm run test:visual` | ⚠️ nunca rodado nesta sessão — executar e registrar baseline |
| axe por rota | harness Playwright | parcial (Agente 14: 51 limpas, 19 com findings) |
| Interação browser | manual/Playwright | não coberto nesta auditoria |
| Lighthouse/RUM | — | não medido |
| Screen reader | NVDA/VoiceOver | não testado |

**Ação:** rodar `test:visual` e gerar/confirmar baselines das rotas afetadas
(characters, voice-hub, crm/kanban, signals-risks, dashboard) **antes** de
qualquer merge da Onda 1. Registrar resultado real — não assumir.

## 2. Gates por correção (Onda 1)

Cada handoff exige, no mínimo:

1. `npx tsc --noEmit`
2. `npm run lint` (sem novos erros; warnings pré-existentes ok)
3. Teste de domínio relevante (unit/componente)
4. `npm run build`
5. **Visual:** screenshot before/after da rota afetada nos temas claro/escuro
   (e mobile para characters/voice-hub) — anexar ao PR.
6. **A11y:** axe-core na rota afetada — zero violações serious/critical novas.

## 3. Matriz de homologação por tema

### 3.1 Acessibilidade (correções a11y)
- axe-core por rota afetada (desktop + mobile).
- Teclado: Tab/Shift+Tab, Enter/Espaço, Esc em modais — foco visível e contido.
- Contraste medido (não estimado) onde houver mudança de cor/tema.
- Screen reader (NVDA/VoiceOver) nas telas de maior risco: characters,
  voice-hub table, kanban.

### 3.2 Tema/Tokens (characters, ADR-012)
- Mesma rota nos temas **claro e escuro**, desktop + mobile.
- Medição de contraste AA real.
- Baseline visual nova **justificada** no PR (o visual muda intencionalmente).

### 3.3 Render/Performance (providers memo, useFetch)
- Confirmar estabilidade de referência dos contexts (React DevTools ou teste).
- Smoke das telas consumidoras de `useFetch` (companies, contacts, leads).
- Sem setState-após-unmount (warning do React ausente).
- Sem regressão de dado (resposta mais recente vence).

### 3.4 Navegação/Rotas (voice-hub 503, characters)
- `/app/voice-hub` com backend 503 → dashboard + mensagem; com sucesso → UI monta.
- Deep-links legados (`voice-hub/*`, `dialer/*`) mantêm comportamento honesto.
- Command Palette: intents funcionais (sem dead-code).

### 3.5 OPP-01 (criação manual de lead)
- Jornada E2E: criar lead → aparece no pipeline/board.
- Duplicidade → mensagem orientada (não erro cru).
- Permissão negada → feedback claro, sem chamada indevida.
- axe no formulário/diálogo.

## 4. Protocolo de homologação por PR

Para cada PR da Onda 1:

1. **Antes:** baseline visual da rota (passo 1).
2. **Depois:** screenshot da rota alterada — light/dark, desktop/mobile.
3. **Comparação:** anexar lado a lado ou descrever delta intencional.
4. **axe:** resultado antes/depois (ou confirmar zero nos dois).
5. **Funcional:** evidência do fluxo afetado funcionando.

**Regra:** nenhuma correção de UI/a11y é "pronta" sem evidência visual —
AGENTS.md P4 ("UI → implementar → executar → verificar visualmente").

## 5. Critérios de lançamento (gate de release da Onda 1)

- [ ] Zero P0/P1 abertos sem correção ou deferimento formal.
- [ ] Todas as correções a11y com axe limpo na rota afetada.
- [ ] Contraste AA medido nas telas de tema alterado.
- [ ] `test:visual` sem regressão não justificada.
- [ ] Unit + integração + E2E dos fluxos tocados verdes.
- [ ] `npx tsc --noEmit` + `npm run lint` + `npm run build` verdes.
- [ ] Nenhuma falha de CI pré-existente mascarada.

## 6. O que NÃO foi coberto (honestidade de escopo)

- Interação real em browser em todas as rotas (só inventário do Agente 14).
- Lighthouse/RUM/CWV — sem medição; metas (LCP 2.5s, INP 200ms, CLS 0.1) são
  **alvo**, não resultado medido.
- Screen reader completo — só spot-check previsto na homologação.
- Testes E2E amplos — dependem do ambiente (`.env.test`/Postgres/Redis), já
  documentado como bloqueio parcial.
