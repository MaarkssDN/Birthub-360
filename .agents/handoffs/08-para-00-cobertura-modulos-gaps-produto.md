# Handoff — Gaps de produto dos ACs de market-intelligence / mesa-tratamento / social-selling

De: 08 — QA e Release
Para: 00 — Coordenador
Onda: decorrente de `.agents/handoffs/00-para-08-cobertura-testes-modulos.md` (Onda F5)
Status: aberto
Prioridade: normal

## Problema

Ao executar o handoff de cobertura de testes dos módulos restantes, verifiquei que todos os
seis módulos já possuem specs dedicadas, mas três critérios de aceite priorizados pelo
handoff original **não têm implementação de produto** — portanto não há comportamento real
para testar (e criar mocks que simulem o comportamento violaria "não mascarar integração
real"):

1. **AC-MKT-003 — ledger de créditos de enriquecimento:** não existe model de saldo/ledger
   no `prisma/schema.prisma` (busca por `Credit|Quota|Ledger|Balance` → nada aplicável;
   `EnrichmentLog` é só auditoria de campo enriquecido, sem débito/crédito). O débito
   atômico antes da chamada externa (RN-MKT-03) não está implementado.
   → Provável dono: 01 (schema) + 05 (prospecção/enriquecimento).
2. **AC-MKT-002 — badge FONTE_PARCIAL em respostas de market-intelligence:** o termo só
   existe em `src/features/commercial-intelligence/*` e `src/features/hub/*` (domínio
   diferente). `market-intelligence/server/*` não emite marcação de fonte parcial mesmo
   quando usa fallback (`marketIntelligenceCompany.service.ts` ~linha 799 `useFallback`).
   → Provável dono: 04/05 conforme matriz de módulos.
3. **mesa-tratamento SLA:** a feature não possui conceito de SLA/tempo-de-resposta
   (busca por `sla|responseTime` sem lógica). Se SLA constar do Documento Mestre para o
   módulo, é gap de produto.
   → Provável dono: 04 (CRM) ou 17 (cadência), a criterio do 00.

## Evidência

- `prisma/schema.prisma`: sem model de créditos/quota/ledger.
- `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts:799-818`:
  fallback `useFallback` sem exposição de badge.
- `src/features/mesa-tratamento/`: nenhum símbolo de SLA.
- Cobertura de testes já existente por módulo: ver seção "Resolução (parcial)" do handoff
  `00-para-08-cobertura-testes-modulos.md`.

## Alteração necessária

Decisão do 00: (a) se os ACs são escopo vigente, abrir handoffs de implementação para os
donos de produto e, após implementado, o 08 escreve os specs de aceite; ou (b) se estão
fora de escopo/revogadas no Documento Mestre, registrar a decisão para o 08 encerrar o
handoff de cobertura como resolvido.

## Teste esperado

Quando a implementação existir: specs unit/integration cobrindo caminho de sucesso e de
falha dos três ACs, verdes em `npm run test:unit` / `test:integration`.
