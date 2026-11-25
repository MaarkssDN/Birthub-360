# Política de Versionamento e Depreciação da API

- **Status:** vigente a partir de 2026-11-14 (DEM-20261114-007 / MEL-43, Onda 6)
- **Dono do documento:** Agente 18 — Contratos, API e Documentação Viva
- **Decisão formal:** [`docs/ADR/ADR-011-Api-Versioning-Deprecation-Policy.md`](../ADR/ADR-011-Api-Versioning-Deprecation-Policy.md)
- **Escopo:** API HTTP servida pelo processo `server.ts` — hoje todo o tráfego REST
  sob `/api/*`, `/api/auth/*` (Better Auth) e os endpoints públicos (`/api/public/*`).

## 1. Estado atual medido (não presumido)

| Fato | Evidência |
|---|---|
| Não existe prefixo de versão (`/api/v1`) em nenhuma rota | `src/bootstrap/routes.ts` — todos os `app.use('/api/…')` sem segmento de versão |
| O documento OpenAPI declara `info.version: '1.0.0'` | `docs/openapi.yaml` (linha 4) |
| `docs/openapi.yaml` tem ~14,5k linhas e é servido em `/api-docs` | `src/bootstrap/apiDocs.ts` |
| Deriva documento↔rotas é verificada em CI/local por `npm run verify:openapi-drift` | `scripts/verify-openapi-drift.ts` |
| Autenticação de sessão via cookie Better Auth; API keys `bhk_…` implementadas mas **não montadas** | `src/features/api-keys/apiKey.middleware.ts` (sem consumidor em `routes.ts`) |
| Já existem operações marcadas `deprecated: true` no OpenAPI | ex.: `/agent/model-benchmark` em `docs/openapi.yaml` |
| Não há headers `Deprecation`/`Sunset` emitidos pelo servidor hoje | nenhuma ocorrência em `src/` |

**Conclusão da avaliação:** a superfície `/api/*` é, na prática, a "v1" da API —
consumida hoje principalmente pelo próprio frontend (mesma origem, cookie de sessão).
Não há consumidor externo versionado para quebrar, e o único mecanismo de acesso
"de máquina" previsto (API keys) ainda não está ligado a rotas.

## 2. Decisão de modelo de versionamento

Adotamos **versionamento implícito de contrato**, não versionamento de path:

1. **Todo o contrato atual sob `/api/*` é declarado "API v1"** — registrado pelo
   `info.version: '1.0.0'` do OpenAPI e por este documento. O número do OpenAPI passa
   a ser a versão de contrato publicada.
2. **Versionamento de path (`/api/vN/...`) fica reservado** e só será introduzido
   quando pelo menos uma destas condições for verdadeira:
   - existir consumidor externo autenticado por API key (`bhk_…`) dependente do
     contrato (hoje: zero);
   - uma mudança quebradora precisar coexistir com a versão antiga por uma janela de
     transição (ver §4).
   A introdução do prefixo é **mudança de contrato público** → decisão do Agente 00
   com aprovação do usuário, registrada em ADR. Não é decidida unilateralmente por
   este documento.
3. **Mudanças não quebradoras nunca criam versão nova de path** — entram como
   aditivas na v1 vigente (MINOR no changelog).

## 3. Versionamento semântico do contrato (semver de API)

`info.version` do OpenAPI e o cabeçalho de versão do changelog seguem semver:

| Tipo de mudança | Bump | Exemplos |
|---|---|---|
| **MAJOR** | `X.0.0` | remover/renomear rota ou campo; tornar campo opcional obrigatório; mudar tipo de campo; remover código de erro documentado; alterar semântica de filtro/paginação |
| **MINOR** | `X.Y.0` | novo endpoint; novo campo **opcional** em request/response; novo valor de enum aditivo; novo header opcional aceito |
| **PATCH** | `X.Y.Z` | correção de documentação, exemplos, descrições, `deprecated` flags, clarificações de erro — sem mudar comportamento |

Regras:

- Um commit que mistura MAJOR + MINOR conta como MAJOR.
- Remoção de campo que já foi marcado `deprecated` por uma janela completa (§4) ainda
  é MAJOR.
- Correção de bug que muda comportamento observável de endpoint documentado exige
  PATCH + nota no changelog; se a correção "quebra" clientes que dependiam do bug,
  é tratada como MINOR/MAJOR conforme o impacto.

## 4. Depreciação e janela de transição

Todo endpoint/campo a ser descontinuado segue o ciclo:

1. **Anúncio (T0):** marcar `deprecated: true` na operação correspondente em
   `docs/openapi.yaml` (OpenAPI já suporta o campo por operação), adicionar
   `summary`/`description` apontando o substituto, e registrar entrada no
   `docs/api/CHANGELOG.md` com data de anúncio e data prevista de remoção.
2. **Headers de depreciação (quando implementados — ver handoff ao 00):** respostas
   da rota deprecada devem emitir:
   - `Deprecation: @<unix-timestamp>` (RFC 8594) — ou data HTTP conforme a RFC;
   - `Sunset: <HTTP-date>` (RFC 8594/9745) — data após a qual a rota pode responder
     410/404;
   - `Link: <url-do-substituto>; rel="deprecation"` quando houver substituto direto.
3. **Janelas mínimas:**
   - mudança quebradora com consumidor externo conhecido: **≥ 90 dias** entre o
     anúncio e a remoção;
   - endpoint já `deprecated: true` sem consumidor externo: janela de **≥ 30 dias**
     com anúncio no changelog antes da remoção;
   - aditivo nunca é deprecado — só removido via MAJOR com janela acima.
4. **Remoção:** só após a janela, com bump MAJOR do `info.version`, entrada
   `Removed` no changelog e remoção do path do `openapi.yaml` **no mesmo commit** —
   o gate `verify:openapi-drift` falha se o documento e a rota divergirem.

Enquanto os headers não estiverem montados (pendência de bootstrap — arquivo fora da
propriedade do Agente 18), o anúncio oficial é o `deprecated: true` + changelog +
entrada no `info.description` do OpenAPI. O handoff
`.agents/handoffs/onda-6-20261114/18-para-00-api-versioning-headers-e-v1.md` carrega
o middleware pronto para montagem.

## 5. O que exige decisão do Agente 00 / usuário

- Introduzir `/api/v1` (novo prefixo de path para todo o tráfego) — muda a URL
  pública, exige redirect ou janela dupla e afeta o frontend (dono: 02) e o mobile
  (dono: 09).
- Remover qualquer rota ou campo já documentado sem janela de depreciação cumprida.
- Tornar público (fora do cookie de sessão) qualquer endpoint hoje interno.
- Qualquer mudança em `server.ts`/`src/bootstrap/**` necessária para emitir headers
  ou montar prefixo de versão.

## 6. Verificação contínua (living documentation)

- `npm run verify:openapi-drift` — falha quando rota real e `openapi.yaml` divergem.
- Regra de bolso: **contrato alterado sem `openapi.yaml` + changelog atualizados no
  mesmo PR é contrato quebrado de processo** — o diff deve conter os três artefatos
  (código, spec, changelog) ou ser rejeitado na revisão.
- Exemplo de payload em documentação/spec **nunca** contém dado pessoal real
  (telefone, e-mail, CPF reais) — contrato de API é também contrato de privacidade.
