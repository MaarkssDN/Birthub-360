De: 00 — Coordenador
Para: 18 — Contratos, API e Documentação Viva
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-18-001 (B-09)
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Documento OpenAPI central (docs/openapi.yaml) possui 124 linhas deletadas ou desatualizadas, gerando descompasso com as rotas reais de módulos e telefonia implementadas.

## Arquivo(s) envolvido(s)
- docs/openapi.yaml:310-435

## Evidência
Base de auditoria: DIVIDAS-AGENTE-18.md.
- docs/openapi.yaml carece dos schemas das rotas de /api/telephony e /api/organization/modules.
- Gera erros na geração de SDKs clientes e falhas na validação de contratos de API.

## Alteração necessária
1. Reconciliar docs/openapi.yaml com as rotas Express registradas em src/routes/.
2. Adicionar validação de contrato no CI para alertar quando uma rota de backend não estiver documentada.

## Teste esperado
- Critério de Aceite: npx swagger-cli validate docs/openapi.yaml retorna 100% válido e sem rotas órfãs.

## Contexto adicional
Garantia de integridade dos contratos de API entre frontend e backend.
