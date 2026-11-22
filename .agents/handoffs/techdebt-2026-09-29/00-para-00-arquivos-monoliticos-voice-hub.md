- De: 00 (Coordenador)
- Para: 00 (Coordenador - decisório)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: alto

## Problema

Auditoria de tech debt identificou 3 arquivos monolíticos em `src/features/voice-hub/**`:

1. `pages/Landing.tsx` - 2111 linhas
2. `store/useStudioStore.ts` - 1743 linhas
3. `pages/Overview.tsx` / `pages/Dashboard/Overview.tsx` - 1420 linhas (parece ser duplicata)

Não há AGENTS.md em `src/features/voice-hub/` - precisa definir dono antes de prosseguir.

## Arquivo(s) envolvido(s)

- `src/features/voice-hub/pages/Landing.tsx` (2111 linhas)
- `src/features/voice-hub/store/useStudioStore.ts` (1743 linhas)
- `src/features/voice-hub/pages/Overview.tsx` (1420 linhas)
- `src/features/voice-hub/pages/Dashboard/Overview.tsx` (1420 linhas - possível duplicata)

## Alteração necessária

**Decisão do Coordenador:** Definir qual agente é dono de `src/features/voice-hub/**` (provavelmente Agente 12 - Voz e Telefonia, mas precisa confirmação).

Após definição de dono:
- Decompor `Landing.tsx` por seções/abas
- Decompor `useStudioStore.ts` por domain concern
- Investigar e resolver possível duplicata de `Overview.tsx`
- Criar componentes menores e focados

## Teste esperado

- `npx tsc --noEmit` passa
- `npm run lint` passa
- `npm run build` passa
- Funcionalidade existente preservada

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificados como P1 (Architecture) no audit. Recomendação: "Decompor por responsabilidade somente quando houver ganho claro de coesão, testabilidade e ownership."

Roster oficial define Agente 12 como "Voz e Telefonia (Birthub Voices)" - provável dono, mas não há AGENTS.md confirmando.

## Resolução

**Decisão do Coordenador (2026-09-29):**

- **Dono confirmado:** Agente 12 (Voz e Telefonia - Birthub Voices) é dono de `src/features/voice-hub/**`
- **Executado:** Criado `src/features/voice-hub/AGENTS.md` confirmando propriedade do Agente 12
- **Handoff criado:** Novo handoff direcionado ao Agente 12 para execução do trabalho de refatoração

**Justificativa:** Conforme roster oficial em AGENTS.md, Agente 12 é responsável por "Voz e Telefonia (Birthub Voices)", que inclui o Voice Hub.
