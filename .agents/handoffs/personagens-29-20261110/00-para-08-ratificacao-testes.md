De: 00 — Coordenador
Para: 08 — QA e Release
Onda: personagens-29-20261110
Status: resolvido
Prioridade: normal
Bloqueador-ref: .agents/reviews/2026-11-10-expansao-personagens-9-29-24.md
Sprint destino: expansão visual 9→29

## Problema

`tests/unit/**` (propriedade do Agente 08) foi alterado sem handoff prévio:

1. Novo: `tests/unit/features/characters/characterCatalog.test.ts` (11 testes de
   homologação do catálogo de 29 personagens).
2. Corrigido: `tests/unit/components/ui/ModuleAgentWidget.test.tsx` — asserção de
   `getByAltText('Avatar do agente Orbit')` substituída pelo ariaLabel canônico
   `'Orbit, agente guardião do CRM e da integridade de pipeline'` (o alt real do
   código desde o commit original; a asserção estava obsoleta/falhando).

## Arquivo(s) envolvido(s)

- `tests/unit/features/characters/characterCatalog.test.ts` (novo)
- `tests/unit/components/ui/ModuleAgentWidget.test.tsx` (1 asserção)

## Evidência

- `npx vitest run` nos dois arquivos: 15/15 passando.
- Nenhum assert foi enfraquecido — a correção alinhou o teste ao comportamento
  real preservado (ariaLabel nunca foi 'Avatar do agente Orbit' no código).

## Alteração necessária

Ratificar os testes ou sugerir cobertura adicional (ex.: teste de render da
galeria, snapshots dos 20 novos SVGs).

## Teste esperado

Suite verde conforme evidência acima; sugestão de expansão de cobertura é
bem-vinda.

## Contexto adicional

Ver parecer do Agente 24 em `.agents/reviews/2026-11-10-expansao-personagens-9-29-24.md`.

## Resolução

**Agente 08 — QA e Release (ratificação em 2026-11-10)**

**Veredito: RATIFICADO.** Nenhuma alteração em `tests/unit/**` é necessária.

### 1. Correção da asserção em `ModuleAgentWidget.test.tsx` — legítima

Evidência no histórico:
- `b6cfc9b94` introduziu `alt={`Avatar do agente ${agent.name}`}` (linha ~310) e `alt={agent.name}` (linha ~379) — a asserção antiga `'Avatar do agente Orbit'` correspondia a esse formato.
- `b00a4618f` (commit imediatamente anterior a `aac2839fd`, diff de 196 linhas em `ModuleAgentWidget.tsx`) substituiu ambos por `alt={agent.ariaLabel}` (linhas 305 e 382 do arquivo atual) **sem atualizar o teste** — ou seja, o teste já estava quebrado/falhando antes da missão de personagens. Confirmado: `git status` mostra `ModuleAgentWidget.tsx` limpo em HEAD; a mudança veio de `b00a4618f`.
- O valor real de `ariaLabel` para Orbit é `'Orbit, agente guardião do CRM e da integridade de pipeline'` (`src/features/characters/characterCatalog.ts:191`), exatamente o que a nova asserção espera. O `src` continua validado como `/brand/characters/orbit.svg`. Nenhum assert foi enfraquecido — foi realinhado ao comportamento real.

### 2. Qualidade dos 11 testes em `characterCatalog.test.ts` — aprovada

Cobertura real e assertiva, sem falso positivo material:
- **29 IDs únicos**: `toHaveLength(29)` + `new Set(ids).size === 29` (linhas 20–27).
- **Preservação dos 9**: verifica existência via `getCharacter`, `layer === 'pillar'`, `contextGroup` e existência do SVG em `public/` (linhas 29–37).
- **Vínculo com COMMERCIAL_AGENT_REGISTRY**: bidirecional — cada personagem não-pilar tem `linkedAgentId` válido contra o registry real + listas de channel/supervisor (linhas 47–57), e cada agente do registry tem exatamente 1 personagem via `getCharactersByAgent` (linhas 59–63). Isso também garante unicidade do vínculo nos agentes comerciais.
- **Existência de SVGs**: `existsSync` em `public/` para os 29 + `viewBox === '0 0 128 128'` + conteúdo `<svg`, `<title>` e ausência de referências externas (`href|src=` http(s), `<image`, `@import`, `url(http`) — a regex cobre `xlink:href` por conter o substring `href` (linhas 65–78).
- **6 estados**: igualdade exata `c.states` vs `CHARACTER_STATES` para todos (linhas 80–84).
- **Fallback core**: `getCharacterOrFallback('inexistente').id === 'core'` e `getCharacter` retorna `undefined` (linhas 92–95).
- **Invariantes pillar vs agente**: `contextMsg`/`contextGroup` obrigatórios em pilares e proibidos/nulos em agentes, com `linkedAgentId` obrigatório nos não-pilares (linhas 97–107).

Observação menor (não bloqueante): `CHANNEL_AGENT_IDS` e `SUPERVISOR_ID` são listas hardcoded no teste porque não há registry canônico importável para esses agentes; se um `linkedAgentId` ficar obsoleto sem uso, o teste ainda passaria — risco baixo e aceitável nesta homologação.

### 3. Execução

`npx vitest run tests/unit/features/characters/characterCatalog.test.ts tests/unit/components/ui/ModuleAgentWidget.test.tsx` → **15/15 passando** (11 + 4), duração ~6s, executado nesta sessão em 2026-11-10.

Sugestão futura (não exigida): snapshot/render da galeria dos 20 novos SVGs poderia ser adicionado quando houver componente de galeria implementado.
