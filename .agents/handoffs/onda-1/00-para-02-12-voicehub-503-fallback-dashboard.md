# Handoff 00 → Agentes 02 + 12 — Voice Hub 503: fallback para dashboard com mensagem

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas).
**ADR:** ADR-014 (decisão de produto já tomada).

## 1. Problema e backlog
`/app/voice-hub` monta `VoiceHubView` enquanto o backend responde **503
`MODULE_NOT_READY`** intencionalmente (`legacyModuleGate`, isolamento por org).
O comentário em `AppLayout.tsx` (~463-478) já diz que "deep-link volta pro
dashboard até o 12 reabrir o gate", mas a rota `voice-hub/*` renderiza
`VoiceHubView` — **o fallback prometido não está aplicado**. O usuário cai numa
interface operacional quebrada/erro genérico.
Backlog: P1 (UX/rota) · `docs/audits/experience-360/02-ROUTES-AND-SCREENS.md`.

## 2. Evidência técnica
`src/components/layout/AppLayout.tsx:~476`:
```tsx
<Route path="voice-hub/*" element={<VoiceHubView />} />
```
Comentário adjacente documenta a intenção de redirect não implementada.
`src/features/voice-hub/components/VoiceHubView.tsx` monta UI que chama APIs em 503.

## 3. Agente responsável e ownership
- Rota/layout → **Agente 02** (`src/components/layout/**`).
- Voice-hub/módulo → **Agente 12** (dono do feature e do gate).
- Coordenação obrigatória 02 ↔ 12.

## 4. Causa raiz
O gate de módulo (`legacyModuleGate`) foi ativado no backend para isolar orgs sem
o recurso, mas o frontend nunca ganhou o estado de "módulo indisponível" — a
rota continua servindo a UI que depende de APIs desligadas.

## 5. Solução mínima proposta
- Quando a indisponibilidade for **confirmada** (resposta 503 do backend, não
  heurística de URL), a rota resolve para fallback honesto:
  - Redirect para `/app/dashboard` com mensagem clara de indisponibilidade
    (via `location.state`/toast), **preservando** a rota de origem.
  - O módulo deve poder "voltar" quando o serviço for reabilitado.
- **Não** ocultar outros erros (500, rede, auth) — só o 503 conhecido.
- **Não** reabrir o gate nem "consertar" o backend aqui — isso é débito P1
  separado do Agente 12.

## 6. Arquivos que poderão ser modificados
- `src/components/layout/AppLayout.tsx` (rota `voice-hub/*`).
- Possivelmente um pequeno componente/estado de "módulo indisponível" em
  `layout/` ou `ui/` (propor, não criar se já existir padrão).
- `src/features/voice-hub/**` somente se o Agente 12 precisar expor um estado de
  indisponibilidade — coordenação prévia.

## 7. Dependências e riscos
- **Decisão por org:** o 503 é por tenant (`legacyModuleGate`/isolamento por
  org). O fallback deve disparar por resposta 503, não por flag global — orgs
  com voice-hub habilitado não podem ser bloqueadas.
- Risco: redirect cego esconder indisponibilidade real → mitigar com detecção
  por resposta e mensagem clara.
- Testes E2E de voice-hub podem assumir montagem da UI → atualizar specs.
- Dependência do Agente 12 para critérios de reativação do módulo (backlog P1
  separado — documentar, não implementar aqui).

## 8. Critérios de aceite
- Com backend respondendo 503, acessar `/app/voice-hub` (e deep-links) leva a
  dashboard com mensagem de indisponibilidade clara.
- Contexto/origem preservado para retorno quando o serviço voltar.
- Orgs com módulo habilitado não são afetadas.
- Erros não-503 continuam com tratamento de erro padrão (visíveis).

## 9. Testes obrigatórios
- Teste da rota: simular 503 → redirect + mensagem; simular sucesso → UI monta.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.
- Coordenar com Agente 12 a validação do lado do módulo.

## 10. Estratégia de rollback
Revert do commit da rota; o comportamento anterior (UI quebrada) volta —
aceitável como rollback temporário, mas o fallback é a correção pretendida.

## 11. Atualização 2026-11-22 (baseline + ownership)
- **Ownership:** CONFIRMADO — Agente 02 (layout/rotas, `AppLayout.tsx`) +
  Agente 12 (voice-hub/gate). Squad 30 + Squad 60/Lena(65).
- **Baseline:** o comportamento 503 é **intencional** no backend
  (`legacyModuleGate`) — a "falha" visual atual é o sintoma documentado, não
  regressão nova. A correção é de UX de falha, não de backend.
- **Aceite complementar:** o fallback deve ser testável simulando resposta 503
  — prever mock/rota de teste ou feature flag de indisponibilidade para o E2E
  não depender do estado real do gate por org.
