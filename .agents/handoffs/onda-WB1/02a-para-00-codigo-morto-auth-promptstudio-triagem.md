# Handoff — Triagem de código morto: auth components legadas + PromptStudio (UX-05 residual)

```
De: 02A — UX Research & Usability
Para: 00 — Coordenador
Onda: WB-1
Status: resolvido
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

## Resolução (Agente 99 / 20 — 2026-11-20)

- Confirmado via `git grep` que não restavam imports de produção para os 5 componentes legados mortos de autenticação.
- Removidos os 7 arquivos mortos em `src/features/auth/components/`: `WelcomeScreen.tsx`, `WelcomeScreen.css`, `LoginScreen.tsx`, `NewLoginScreen.tsx`, `NewLoginScreen.css`, `LandingLoginSplitScreen.tsx` e `OrbitalSystem.tsx`, além do teste órfão `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx`.
- Preservados integralmente os componentes vivos de autenticação (`ResetPasswordScreen.tsx`, `ChangePasswordGate.tsx`, `GoogleLoginModal.tsx`).
- Atualizado o comentário da linha ~70 em `src/components/layout/tabMeta.ts` removendo a menção obsoleta a Prompt Studio.

## Re-verificação UX-05a (Agente 01 — waveF, 2026-11-20)

- Confirmado em `origin/main @ 960e0524e`: os 7 arquivos + teste órfão já removidos pelo commit `f33025448`; `src/features/auth/components/` contém apenas `ResetPasswordScreen.tsx`, `ChangePasswordGate.tsx`, `GoogleLoginModal.tsx`.
- `grep` por `WelcomeScreen|LoginScreen|NewLoginScreen|LandingLoginSplitScreen|OrbitalSystem` em `src/` e `tests/`: zero imports; restam apenas comentários históricos obsoletos em `src/App.tsx:82-91` (dono 31), `src/components/ui/sign-in-page.tsx:11` (dono 03), `src/config/brand.ts:30`, `tests/e2e/helpers.ts:24,38`, `tests/e2e/accessibility.spec.ts:77,87`, `tests/e2e/saved-views.spec.ts:83` — higienização cosmética delegada aos donos (não bloqueia UX-05a).
- Comentário residual no próprio domínio corrigido: `src/features/auth/components/ResetPasswordScreen.tsx:121-122` não referencia mais `LoginScreen.tsx` (arquivo inexistente).
