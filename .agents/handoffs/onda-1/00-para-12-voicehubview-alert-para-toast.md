# Handoff 00 → Agente 12 — VoiceHubView: `alert()` nativo → feedback do DS

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas).

## 1. Problema e backlog
`VoiceHubView` usa `alert()` nativo do browser para erro de ação ("Falha ao
registrar bloqueio") — bloqueia a thread, fora do sistema de feedback do produto
e inconsistente com o restante da UI.
Backlog: feedback/UX (alert residual) · COMP-adjacente.

## 2. Evidência técnica
`src/features/voice-hub/components/VoiceHubView.tsx:133`:
```ts
alert(err?.response?.data?.error || err?.message || 'Falha ao registrar bloqueio.');
```

## 3. Agente responsável e ownership
**Agente 12 — Voz e Telefonia** (dono exclusivo de `src/features/voice-hub/**`,
`src/features/voice-hub/AGENTS.md`).

## 4. Causa raiz
`alert()` residual de implementação rápida, anterior ao sistema de toast do
módulo.

## 5. Solução mínima proposta
- Substituir por `window.toast`/toast do `design-system` local do voice-hub
  (verificar qual o módulo já usa nas demais telas — **não criar terceiro
  sistema de feedback**).
- Preservar a mensagem de erro (`err.response.data.error || err.message ||
  fallback`).
- Se a consolidação do DS (COMP-001/ADR-012) já apontar o toast de `ui/`, usar
  esse para evitar retrabalho — decisão do Agente 12 com ciência do 00.

## 6. Arquivos que poderão ser modificados
- `src/features/voice-hub/components/VoiceHubView.tsx` (e o toast local se for
  preciso expor helper — mínimo necessário).

## 7. Dependências e riscos
- Depende de COMP-001 (consolidação DS voice-hub): se a migração para `ui/`
  estiver próxima, considerar já usar o toast de `ui/` — decisão do Agente 12.
- Risco baixo; mudança só de superfície de feedback.

## 8. Critérios de aceite
- Nenhum `alert()`/`window.alert` restante em `VoiceHubView.tsx`.
- Erro de ação exibido via toast/sistema de feedback do módulo, com a mensagem
  preservada.
- Sem regressão no fluxo de bloqueio.

## 9. Testes obrigatórios
- Verificação do fluxo de erro (mock de falha) → toast aparece.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; sem mudança de contrato ou dado.
