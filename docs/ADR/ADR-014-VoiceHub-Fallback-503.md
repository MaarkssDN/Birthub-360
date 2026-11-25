# ADR-014: Fallback temporário do Voice Hub durante indisponibilidade (HTTP 503)

**Data:** 2026-11-21
**Status:** APROVADO — fallback temporário autorizado; correção definitiva do
backend permanece P1 no backlog
**Autor:** Agente 00 — Engenharia de Experiência / Astra

---

## 1. Contexto

`/app/voice-hub` monta `VoiceHubView` enquanto o backend responde **503
`MODULE_NOT_READY`** de forma intencional via `legacyModuleGate` (isolamento por
org). O comentário em `src/components/layout/AppLayout.tsx` (~linhas 463-478)
já registra que "deep-link volta pro dashboard até o 12 reabrir o gate", mas a
rota `<Route path="voice-hub/*" element={<VoiceHubView />} />` **não aplica** esse
fallback — o usuário cai em interface operacional quebrada/erro genérico.

## 2. Decisão do Orquestrador Humano

> "APROVADO UM FALLBACK TEMPORÁRIO, COM CORREÇÃO DEFINITIVA NO BACKLOG P1. Quando a
> indisponibilidade do serviço estiver confirmada, a aplicação deverá impedir o
> acesso a uma interface operacional quebrada. Preparar fallback para o dashboard
> com mensagem clara de indisponibilidade, preservando contexto e permitindo
> recuperação quando o serviço voltar. Investigar a causa do 503 e apresentar
> critérios objetivos para reativação do Voice Hub. Não ocultar erros reais nem
> considerar o redirecionamento como correção definitiva do backend."

## 3. Diretrizes derivadas

1. **Fallback de rota:** `voice-hub/*` deve resolver para um estado honesto —
   redirect para `/app/dashboard` com mensagem de indisponibilidade (via state ou
   toast), preservando a rota de origem para retorno quando o serviço voltar.
2. **Detecção de indisponibilidade:** o fallback deve disparar quando o 503 for
   confirmado (resposta do backend ou health check), não por heurística de URL —
   orgs com o módulo habilitado não podem ser bloqueadas.
3. **Recuperação:** a mensagem deve indicar que o serviço está temporariamente
   indisponível e como o usuário será avisado/retomará (ex.: o módulo retorna à
   navegação quando o gate for reaberto pelo Agente 12).
4. **Definitivo ≠ redirect:** a causa raiz do 503 (`legacyModuleGate` /
   reabertura do módulo pelo dono, Agente 12) permanece item P1 do backlog —
   este ADR cobre apenas a experiência de falha.
5. **Critérios de reativação:** a entregar deve incluir proposta objetiva de
   critérios para reabrir o gate (ex.: contratos de API estáveis, feature flag por
   org, smoke tests dos endpoints `/api/voice-hub/*`) — a definir com o Agente 12.
6. **Erros reais não ocultos:** falhas que não sejam o 503 conhecido (500, rede,
   auth) devem continuar visíveis com tratamento de erro padrão, não engolidas
   pelo fallback.

## 4. Riscos

- Redirect cego pode esconder indisponibilidade de orgs habilitadas → mitigação:
  detecção por resposta 503, não por flag global.
- Perda de contexto de deep-link → mitigação: preservar `location.state.from`.
- Testes E2E existentes de voice-hub podem assumir montagem da UI → mitigação:
  atualizar specs para o novo comportamento de fallback.

## 5. Estado

Handoff de preparação emitido:
`.agents/handoffs/onda-1/00-para-02-12-voicehub-503-fallback-dashboard.md`.
Implementação **não autorizada** até parecer do Agente 09 (Silas).
