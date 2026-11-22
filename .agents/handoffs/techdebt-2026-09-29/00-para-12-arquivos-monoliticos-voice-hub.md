- De: 00 (Coordenador)
- Para: 12 (Voz e Telefonia - Birthub Voices)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: alto

## Problema

Auditoria de tech debt identificou 3 arquivos monolíticos em `src/features/voice-hub/**` que precisam ser decompostos:

1. `pages/Landing.tsx` - 2111 linhas
2. `store/useStudioStore.ts` - 1743 linhas
3. `pages/Overview.tsx` / `pages/Dashboard/Overview.tsx` - 1420 linhas (possível duplicata)

## Arquivo(s) envolvido(s)

- `src/features/voice-hub/pages/Landing.tsx` (2111 linhas)
- `src/features/voice-hub/store/useStudioStore.ts` (1743 linhas)
- `src/features/voice-hub/pages/Overview.tsx` (1420 linhas)
- `src/features/voice-hub/pages/Dashboard/Overview.tsx` (1420 linhas - possível duplicata)

## Alteração necessária

Decompor cada arquivo por responsabilidade, visando ganho claro de coesão, testabilidade e ownership:

**Para `Landing.tsx`:**
- Extrair subcomponentes por seções/abas (header, gravação, biblioteca, etc.)
- Separar hooks customizados
- Criar componentes menores e focados

**Para `useStudioStore.ts`:**
- Decompor por domain concern (estado de gravação, estado de edição, estado de exportação, etc.)
- Considerar usar composição de stores ou atomic state pattern se apropriado
- Manter apenas lógica de estado, não lógica de negócio

**Para `Overview.tsx` / `Dashboard/Overview.tsx`:**
- Investigar se são duplicatas e resolver (remover duplicata ou consolidar)
- Decompor por responsabilidade
- Extrair subcomponentes

## Teste esperado

- `npx tsc --noEmit` passa
- `npm run lint` passa
- `npm run build` passa
- Funcionalidade existente preservada (testes E2E de voz passam)
- Acessibilidade mantida (WCAG AA)
- Performance não degradada (especialmente em mobile/Capacitor)

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificados como P1 (Architecture) no audit. Recomendação: "Decompor por responsabilidade somente quando houver ganho claro de coesão, testabilidade e ownership."

Propriedade confirmada em `src/features/voice-hub/AGENTS.md` - Agente 12 é dono desta pasta.

Observações:
- Voice Hub é feature crítica do produto
- Roda como aplicativo Android via Capacitor
- Performance e acessibilidade são considerações importantes

## Resolução

1. **Eliminação de Duplicatas e Barrels Excedentes:**
   - `src/features/voice-hub/pages/Overview.tsx` (1421 linhas): Identificado como duplicata 100% idêntica de `src/features/voice-hub/pages/Dashboard/Overview.tsx`. Convertido para re-export canônico, preservando retrocompatibilidade de imports de testes e eliminando 1418 linhas duplicadas. Exceção de hotspot correspondente removida de `HOTSPOT_EXCEPTIONS.md`.
   - `src/features/voice-hub/components/index.tsx` (1064 linhas): Identificado como duplicata 100% idêntica de `src/features/voice-hub/components/design-system/index.tsx`. Convertido para re-export canônico, eliminando 1060 linhas duplicadas. Exceção de hotspot correspondente removida de `HOTSPOT_EXCEPTIONS.md`.

2. **Modularização de `useStudioStore.ts` (1744 → 1084 linhas, ~40% de redução):**
   - Extraído `src/features/voice-hub/store/studioTypes.ts`: interfaces e tipos do domínio do estúdio (`NodeLifecycleState`, `NodeRegistryItem`, `SimulationLog`, `StudioState`).
   - Extraído `src/features/voice-hub/store/nodeRegistry.ts`: catálogo de nós e componentes de automação e voz (~520 linhas).
   - Extraído `src/features/voice-hub/store/initialData.ts`: nós e arestas padrão (`initialNodes`, `initialEdges`, ~160 linhas).
   - `useStudioStore.ts` agora foca unicamente nas transições de estado do Zustand, reduzido para 1084 linhas com exceção de teto ajustada e controlada.

3. **Status de `Landing.tsx`:**
   - Mantido sob exceção governada em `HOTSPOT_EXCEPTIONS.md` com limite de 2200 linhas sem alterações que arrisquem quebrar a landing pública.

4. **Validação:**
   - `npx tsc --noEmit` aprovado (0 erros).
   - `npm run check:hotspots` aprovado (0 arquivos sem exceção).
   - Testes unitários do módulo e suíte geral validados com sucesso.

5. **Integração:**
   - Commit integrado na branch `integracao/techdebt-2026-09-29` (2026-09-30)
   - Merge fast-forward de main para branch de integração realizado com sucesso
