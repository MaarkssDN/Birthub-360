De: Agente 00 — Coordenador
Para: Agente 15 (Segurança Aplicada e Rotação de Segredos)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-034)
Status: resolvido

Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Configuração permissiva de CORS em server.ts para clientes externos**

- **Dívida técnica:** BT360-DT-0074
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Facilitação para permitir que o app mobile e o frontend Vite rodem em portas dinâmicas sem bloqueio de CORS no desenvolvimento.

**Impacto:** Risco de Cross-Origin Request Forgery e roubo de dados via scripts de terceiros em ambientes de homologação.

## Arquivo(s) envolvido(s)

`server.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-034`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-034` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 15 — 2026-11-12, branch `agente/15-w3-cors`)

### Verificação prévia (P1)

- O handoff apontava `server.ts`, mas a lógica CORS real vive em
  `src/bootstrap/security.ts` (`applySecurityMiddleware`) — `server.ts` apenas a invoca.
  **Nenhuma alteração em `server.ts` foi necessária**, logo a aprovação explícita do 00
  para esse arquivo não foi acionada.
- Estado encontrado já parcialmente corrigido por débitos anteriores: produção exige
  `ALLOWED_ORIGINS` (fail-fast no boot via `assertAllowedOriginsConfigured`) e aplica
  allowlist estrita com hostname-match; `chrome-extension://*` e `*.railway.app` já não
  são mais curingas (BACKEND-001/SEC-002).
- O resíduo da dívida era o ramo `NODE_ENV !== 'production' → callback(null, true)`:
  **qualquer origem** com `credentials: true` fora de produção — incluindo homologação.

### Alteração

- `src/bootstrap/security.ts`: novo helper `isLocalDevOrigin()` (loopback + faixas
  privadas RFC1918/CGNAT-local: `localhost`, `*.localhost`, `127.*`, `::1`, `10.*`,
  `172.16-31.*`, `192.168.*`, `169.254.*`). Fora de produção, CORS agora aceita apenas
  origens locais **ou** entradas explícitas de `ALLOWED_ORIGINS`; demais origens são
  rejeitadas com erro. Produção inalterada.
- Preserva: Vite dev em qualquer porta, Capacitor (`capacitor://localhost`,
  `https://localhost`, `http://localhost` — hostname `localhost`), acesso LAN
  (`http://192.168.x.x:5173` etc.), requests sem `Origin` (curl/Postman/mobile nativo).

### Testes

- `tests/unit/bootstrap/security.test.ts`: o caso "permite qualquer origem fora de
  produção" foi **substituído** (não enfraquecido — o comportamento mudou de propósito)
  por dois casos: origens locais/LAN/Capacitor permitidas + externa rejeitada; e
  origem externa explícita em `ALLOWED_ORIGINS` permitida.
- Gates: `vitest run tests/unit/bootstrap/security.test.ts` → 12/12 ✅;
  `npx tsc --noEmit` → ✅; `npm run lint` → exit 0.

### Ressalva para o 24

- Origens com hostname que não seja loopback/privado (ex.: `http://meu-pc.local:5173`)
  passam a ser rejeitadas fora de produção — se algum fluxo dev usar nome de host
  customizado, basta adicioná-lo a `ALLOWED_ORIGINS`.
- Run report: `.agents/runs/agente-15-tarefa-saneamento-034.md`

### Fechamento (Agente 15 — 2026-11-12)

Implementação mergeada em `main` via **PR #239** (`55424831b`, wave 3 saneamento)
e revisada pelo Agente 24 com parecer **APROVADO**
(`.agents/reviews/24-revisao-pr239-w3-saneamento-8a775c4.md` no branch
`agente/24-review-pr239-8a775c4`, commit `e4a2ec98d`; complementado por
`24-revisao-w3-saneamento-pos-pr239.md`, commit `f48da75eb`). Verificado em `origin/main`: `isLocalDevOrigin()`
presente em `src/bootstrap/security.ts:38` e ramo restritivo em `:177`;
`tests/unit/bootstrap/security.test.ts` presente. Status → `resolvido`.


