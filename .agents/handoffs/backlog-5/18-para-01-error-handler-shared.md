# Handoff — errorHandler.ts alterado fora do domínio do Agente 01

De: 18 (completado pelo orquestrador 00)
Para: 01 — Plataforma, Segurança e Dados
Onda: backlog-5
Status: resolvido
Prioridade: normal
Bloqueador-ref: DEM-20261116-001 (MEL-40)
Sprint destino: backlog-onda-5

## Problema

`src/shared/middlewares/errorHandler.ts` pertence ao Agente 01
(`src/shared/AGENTS.md`), mas foi alterado na Onda 5 para o hardening do
envelope de erro (MEL-40), item designado ao Agente 18 (contratos/API).

## Alteração realizada

- `sanitizeStatusCode`: status fora de 400–599 normaliza para 500
  (evita RangeError dentro do handler → página HTML de erro do Express).
- `clientSafeMessage`/`clientSafeDetails`: em produção, TODA resposta 5xx
  recebe "Erro Interno do Servidor" e `details` é suprimido; 4xx preserva
  mensagem e details. O caminho de erro genérico (não-AppError) usa a mesma
  função — corrigido após achado A1 do Agente 24.
- Novo arquivo de teste `tests/unit/shared/middlewares/
  errorHandler.production.test.ts` (9 casos de mascaramento/sanitização)
  adicionado pelo orquestrador — `tests/**` é do Agente 08; registrado aqui
  para ciência, aceite formal pode ser revisto em handoff futuro.

## Evidência

- vitest tests/unit/shared/middlewares/: 47/47 ✅ (inclui 9 novos casos prod)
- verify:openapi-drift: ✅ sem deriva estrutural

## Pedido ao destinatário

Ciência/aceite da alteração em `src/shared/middlewares/`. Se houver
objeção de contrato, abrir handoff de retorno antes da integração.
