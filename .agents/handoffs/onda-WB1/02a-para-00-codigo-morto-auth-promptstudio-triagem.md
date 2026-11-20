# Handoff — Triagem de código morto: auth components legadas + PromptStudio (UX-05 residual)

```
De: 02A — UX Research & Usability
Para: 00 — Coordenador
Onda: WB-1
Status: aberto
Prioridade: normal
Bloqueador-ref: DEBT-0025, DEBT-0065
Sprint destino: a definir pelo 00
```

## Problema

Do achado UX-05, duas partes já foram verificadas nesta auditoria e precisam de decisão de dono para remoção:

1. **Auth components legadas mortas** — `src/features/auth/components/`: `WelcomeScreen.tsx/.css`, `LoginScreen.tsx`, `NewLoginScreen.tsx/.css`, `LandingLoginSplitScreen.tsx`, `OrbitalSystem.tsx`. Verificado: nenhum import de **produção** externo (só auto-referência `LoginScreen.tsx:1` e `WelcomeScreen.tsx:1` → `NewLoginScreen`). **Correção v2:** há 1 consumidor em teste — `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx:19` importa `NewLoginScreen` → remoção coordenada com **Agente 08**. A entrada real é `Landing360` (`src/App.tsx:51-52,118-131`). Componentes vivos no mesmo diretório (não tocar): `ResetPasswordScreen`, `ChangePasswordGate`, `GoogleLoginModal`.
2. **PromptStudio** — o componente já não existe; resta apenas comentário histórico obsoleto em `src/components/layout/tabMeta.ts:71` mencionando `PromptStudio.tsx` "órfão". Sugestão: atualizar o comentário na próxima edição do arquivo (dono: Agente 02).

## Arquivo(s) envolvido(s)

- `src/features/auth/components/{WelcomeScreen,LoginScreen,NewLoginScreen,LandingLoginSplitScreen,OrbitalSystem}*`
- `src/components/layout/tabMeta.ts:71` (comentário — dono 02)

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-05) e §2 (UX-N3).

## Alteração necessária

**Decisão do usuário (2026-11-18): dono = Agente 01 — Plataforma** (auth é domínio dele). Após esta decisão: deletar os 5 componentes + CSS órfãos, remover/atualizar `NewLoginScreen.contactCards.test.tsx` (com o Agente 08) e rodar `npx tsc --noEmit` + `npm run build` + `vitest` do arquivo afetado.

## Teste esperado

Grep sem referências aos componentes removidos; build e typecheck verdes; `/`, `/welcome`, `/login` continuam renderizando `Landing360`.

## Contexto adicional

A SPA outbound (outra parte do UX-05) já tem handoff próprio para o 05 (`02a-para-05-outbound-spa-codigo-morto.md`). Este handoff cobre apenas auth components + confirmação do PromptStudio.
