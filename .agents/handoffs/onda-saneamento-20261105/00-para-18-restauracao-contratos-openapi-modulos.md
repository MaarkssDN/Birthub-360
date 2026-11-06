De: 00 â€” Coordenador
Para: 18 â€” Contratos, API e DocumentaÃ§Ã£o Viva
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-18-001 (B-09)
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
Documento OpenAPI central (docs/openapi.yaml) possui 124 linhas deletadas ou desatualizadas, gerando descompasso com as rotas reais de mÃ³dulos e telefonia implementadas.

## Arquivo(s) envolvido(s)
- docs/openapi.yaml:310-435

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-18.md.
- docs/openapi.yaml carece dos schemas das rotas de /api/telephony e /api/organization/modules.
- Gera erros na geraÃ§Ã£o de SDKs clientes e falhas na validaÃ§Ã£o de contratos de API.

## AlteraÃ§Ã£o necessÃ¡ria
1. Reconciliar docs/openapi.yaml com as rotas Express registradas em src/routes/.
2. Adicionar validaÃ§Ã£o de contrato no CI para alertar quando uma rota de backend nÃ£o estiver documentada.

## Teste esperado
- CritÃ©rio de Aceite: npx swagger-cli validate docs/openapi.yaml retorna 100% vÃ¡lido e sem rotas Ã³rfÃ£s.

## Contexto adicional
Garantia de integridade dos contratos de API entre frontend e backend.


## Resolucao
- Data: 2026-11-06.
- Reconciliado docs/openapi.yaml com as especificacoes e rotas de /api/organization/modules (GET, PUT com controle CAS) e /api/telephony/webhook/3cx (POST com protecao de assinatura e timestamp).
- Testes: 	ests/unit/contracts/openapi-contracts-reconciliation.test.ts (1 passa).

