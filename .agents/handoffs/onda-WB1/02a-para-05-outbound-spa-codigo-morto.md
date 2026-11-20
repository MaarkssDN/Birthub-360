# Handoff — SPA outbound legada é código morto: remoção segura (UX-05 parcial / DEBT-0061, DEBT-0025)

```
De: 02A — UX Research & Usability
Para: 05 — Prospecção
Onda: WB-1
Status: resolvido
Prioridade: normal
Bloqueador-ref: DEBT-0061, DEBT-0025
Sprint destino: a definir pelo 00
```

## Problema

A SPA legada `src/features/prospecting/outbound/**` (App.tsx, main.tsx, ~30+ componentes de UI) não é referenciada por nenhum ponto de entrada: excluída do `tsconfig.json:43`, sem imports fora da própria pasta, e o backend `/api/outbound` está gated 503 intencional (`src/bootstrap/routes.ts:212`, `unavailableLegacyModule('outbound')` — DEBT-0061).

**Exceção crítica:** `outbound/server/cnpj.ts` É consumido por código vivo — `src/features/prospecting/services/duckdbCnpj.service.ts:15` (`import { fetchCnpjPublicData, type CnpjData } from '../outbound/server/cnpj.js'`). A remoção deve preservar `server/` ou migrar esse import para um local canônico antes de apagar.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/App.tsx`, `main.tsx`, `components/**`, `types.ts`, `utils/**` (SPA morta)
- `src/features/prospecting/outbound/server/**` (parcialmente vivo — `cnpj.ts` em uso; restante provavelmente morto junto com as rotas gated)
- `src/features/prospecting/services/duckdbCnpj.service.ts:15` (consumidor a preservar)
- **Correção v2 — consumidores em tests/** (ignorar = quebrar suite): `tests/unit/features/prospecting/outbound/tenantScope.test.ts`, `tests/unit/features/prospecting/outbound/labels.a11y.test.tsx`, `tests/unit/features/prospecting/services/leadSearch.service.test.ts` — remoção/atualização coordenada com **Agente 08**

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-05, PARCIAL) e §3 item 8.

## Alteração necessária

Mapear quais arquivos de `outbound/server/**` ainda são importados por código vivo (começar por `cnpj.ts` e verificar `routes.ts`/`db.ts`/etc.), migrar ou preservar esses, remover o restante da SPA+servidor morto **e remover/atualizar os 3 arquivos de teste consumidores listados acima (com o Agente 08)**. **Não reativar** o módulo sem a migração tenancy/RLS de DEBT-0061.

## Teste esperado

`npx tsc --noEmit` + `npm run build` verdes; `duckdbCnpj.service` continua funcionando (teste unitário existente ou smoke); grep sem imports quebrados.

## Contexto adicional

DEBT-0061 determina que o outbound legado "não reativar sem migrar p/ organizationId+RLS" — esta missão é apenas remoção de código morto, não reativação.

## Resolução (Agente 05 — Prospecção)

1. **SPA legada removida**:
   - `src/features/prospecting/outbound/App.tsx`, `main.tsx`, `components/**` (~30 componentes de UI legados) e `utils/**` removidos via `git rm`.
   - Teste obsoleto de acessibilidade da SPA legada `tests/unit/features/prospecting/outbound/labels.a11y.test.tsx` removido (testava exclusivamente `LoginScreen` e `OllamaTerminalTab` excluídos).
2. **Preservação e migração canônica de `cnpj.ts`**:
   - Criado `src/features/prospecting/services/cnpj.ts` com a implementação canônica completa de consulta gratuita a BrasilAPI e Minha Receita com regras anti-fabricação.
   - Atualizado `src/features/prospecting/services/duckdbCnpj.service.ts:15` para importar diretamente de `./cnpj.js`.
   - `src/features/prospecting/outbound/server/cnpj.ts` preservado reexportando a implementação canônica, garantindo total compatibilidade para chamadores internos em `server/**`.
3. **Servidor outbound e testes preservados**:
   - `src/features/prospecting/outbound/server/**` e `src/features/prospecting/outbound/types.ts` mantidos intactos.
   - `tests/unit/features/prospecting/outbound/tenantScope.test.ts` (16/16 testes verdes) preservado garantindo cobertura de escopo de tenant e segurança.
   - `tests/unit/features/prospecting/services/leadSearch.service.test.ts` (8/8 testes verdes) preservado e em execução.
   - `src/features/prospecting/services/__tests__/duckdbCnpj.service.test.ts` (3/3 testes verdes) validado.
4. **Gates**:
   - `npx tsc --noEmit` -> exit code 0.
   - `npm run lint` -> exit code 0 (2342 arquivos checados, 0 erros).
