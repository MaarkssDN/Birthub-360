De: Agente 00 — Coordenador
Para: Agente 15 (Segurança Aplicada e Rotação de Segredos)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-010)
Status: resolvido

Status: em-andamento
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Criptografia de credenciais em repouso sem suporte a envelope encryption e versionamento de chaves**

- **Dívida técnica:** BT360-DT-0073
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O formato de envelope criptográfico não previu metadados de versionamento de chaves (Key Rotation Grace Period).

**Impacto:** Risco elevado de corrupção ou perda permanente de acesso a tokens de integração do Bitrix24 e telefonia durante processos de rotação de chaves.

## Arquivo(s) envolvido(s)

`docs/security/ROTACAO_SEGREDOS.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-010`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-010` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 15 — 2026-11-12, branch `agente/15-w3-envelope-enc`)

Implementado envelope keyed `enc:v1:<keyId>:<iv>:<authTag>:<ciphertext>` em
`src/lib/crypto/secretFields.ts` (caminho canônico — Bitrix/Google/PII/integration settings)
e `src/lib/security/credentialCrypto.ts` (utilitário de credenciais/telefonia). `keyId` é o
fingerprint SHA-256 (12 hex) da chave encryptante. Decriptação tolera o envelope legado de
3 segmentos e a chave anterior via nova env `CREDENTIALS_ENCRYPTION_KEY_PREVIOUS` (grace
period de rotação — BT360-DT-0073). Prefixo `enc:v1:` preservado: todos os detectores
(`startsWith('enc:v1:')` em prisma-interceptors/prisma.ts) seguem funcionando; parsers
antigos falham fechado em ciphertext keyed. `scripts/security/credential-envelope.ts`
atualizado para emitir/aceitar o formato keyed (rotação OLD_KEY→NEW_KEY e backfills).
SOP de rotação em `docs/security/ROTACAO_SEGREDOS.md` §3.1. Evidências: 37 testes unit
envelope verdes + 108 testes adjacentes (interceptors, integration settings, backfill,
reencrypt, whatsapp auth state); `npx tsc --noEmit` limpo; biome limpo nos arquivos
tocados (baseline de warnings pré-existente inalterado). Run report:
`.agents/runs/agente-15-tarefa-saneamento-010.md`. Pendente: revisão formal do Agente 24.

### Fechamento (Agente 15 — 2026-11-12)

Implementação mergeada em `main` via **PR #239** (`55424831b`, wave 3 saneamento)
e revisada pelo Agente 24 com parecer **APROVADO**
(`.agents/reviews/24-revisao-pr239-w3-saneamento-8a775c4.md` no branch
`agente/24-review-pr239-8a775c4`, commit `e4a2ec98d`; complementado por
`24-revisao-w3-saneamento-pos-pr239.md`, commit `f48da75eb`). Verificado
em `origin/main`: envelope keyed `enc:v1:<keyId>:...` em
`src/lib/crypto/secretFields.ts:13-22` e `src/lib/security/credentialCrypto.ts`;
`scripts/security/credential-envelope.ts` e `docs/security/ROTACAO_SEGREDOS.md`
§3.1 presentes. Status → `resolvido`.


