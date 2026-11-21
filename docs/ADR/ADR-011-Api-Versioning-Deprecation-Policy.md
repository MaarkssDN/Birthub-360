# ADR 011: Política de versionamento e depreciação da API (/api/* como v1 implícita)

## Status

Proposto — aguardando ratificação do Agente 00. A política documental já está vigente
para fins de processo (changelog + `deprecated` flags); a **introdução de prefixo de
path `/api/v1` e a emissão de headers `Deprecation`/`Sunset`** dependem de decisão do
00/usuário porque tocam `server.ts`/`src/bootstrap/**` e o contrato público.

- Data de registro: 2026-11-14
- Registrado por: Agente 18 (Contratos, API e Documentação Viva), missão
  DEM-20261114-007 / MEL-43 (Onda 6)
- Documento operacional: `docs/api/API_VERSIONING_POLICY.md` + `docs/api/CHANGELOG.md`

## Contexto

A API HTTP do Birth Hub 360º não tinha política de versão nem de depreciação:

- Todas as rotas vivem sob `/api/*` sem segmento de versão (`src/bootstrap/routes.ts`,
  ~60 mounts).
- `docs/openapi.yaml` (~14,5k linhas) declara `info.version: '1.0.0'`, mas o número
  nunca foi definido como "versão de contrato" — era metadado do documento.
- Já existem operações `deprecated: true` no OpenAPI sem processo de janela de
  transição, e o servidor não emite `Deprecation`/`Sunset`.
- O único mecanismo de acesso "de máquina" previsto — API keys `bhk_…`
  (`src/features/api-keys/`, DEM-20261113-002 / MEL-07) — está implementado mas
  **não montado** em nenhuma rota de negócio; o consumidor externo versionado que
  justificaria `/api/v1` ainda não existe.
- Hoje o consumidor dominante é o próprio frontend (mesma origem, cookie de sessão
  Better Auth), versionado junto com o deploy.

Sem política, a primeira mudança quebradora encontraria o repositório sem regras de
transição — e qualquer introdução apressada de `/api/v1` criaria uma segunda
superfície para manter sem consumidor que a justifique.

## Decisão

1. **`/api/*` atual = API v1.** O `info.version` do OpenAPI passa a ser a versão de
   contrato publicada, com changelog obrigatório em `docs/api/CHANGELOG.md`.
2. **Semver de contrato:** MAJOR = quebrador (remoção, mudança de tipo, obrigatório
   novo), MINOR = aditivo, PATCH = docs/correções. Detalhes na política.
3. **Depreciação em dois canais:** `deprecated: true` + `summary` no OpenAPI
   (imediato, sem código) e, quando o middleware for montado, headers `Deprecation`
   (RFC 8594) e `Sunset` na resposta da rota deprecada. Janelas mínimas: 90 dias com
   consumidor externo, 30 dias sem consumidor.
4. **`/api/v1` fica reservado**, condicionado a: (a) primeiro consumidor externo via
   API key, ou (b) primeira mudança quebradora que precise coexistir com a versão
   antiga. A introdução é mudança de contrato público → decisão do 00/usuário, com
   ADR próprio e coordenação com 02 (frontend) e 09 (mobile).
5. **Todo PR que altera contrato** deve tocar código + `openapi.yaml` +
   `CHANGELOG.md` juntos; o gate `verify:openapi-drift` já impede divergência
   documento↔rota.

## Alternativas consideradas

- **Prefixo `/api/v1` imediato em todas as rotas:** rejeitado — dobra a superfície de
  manutenção, exige redirect/dupla montagem em ~60 routers e não há consumidor
  externo que se beneficie hoje. Custo real, benefício zero.
- **Versionamento só por header (`Accept: application/vnd.birthhub.v1+json`):**
  rejeitado como mecanismo primário — o frontend e a maioria dos clientes não negociam
  mídia; headers de versão ficam como sinalização (`X-API-Version`/`Deprecation`), não
  como roteamento.
- **Manter status quo sem política:** rejeitado — é a condição que gerou esta missão.

## Consequências

- Positivas: contrato passa a ter nome, versão e processo de fim de vida; a primeira
  mudança quebradora futura já encontra regra; custo de implementação atual ≈ zero
  (documentação + convenção).
- Custos/pendências: headers `Deprecation`/`Sunset` exigem middleware novo montado no
  bootstrap (handoff ao 00 — `src/bootstrap/**`/`server.ts` fora da propriedade do 18);
  endpoints hoje `deprecated: true` precisam de entrada formal no changelog antes de
  qualquer remoção.
- Risco residual: enquanto o prefixo `/api/v1` não existir, "v1" é uma etiqueta de
  contrato, não de URL — dois deploys podem servir "v1" com contratos ligeiramente
  diferentes durante o rollout; mitigado pelo fato de frontend e API deployarem
  juntos.
