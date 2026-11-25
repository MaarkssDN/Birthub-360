De: 00 — Astra
Para: 50 — Atlas (Coordenador Squad 50)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 item 3
Sprint destino: Onda 4 / ciclo imediato

## Problema

`src/features/integrations/bitrix/service/extraction.ts` possui exceção de hotspot arquitetural ativa que expira em 30/11/2026 (~1080 linhas vs limite excepcional de 1100). Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/service/extraction.ts` — motor monolítico de paginação, streaming de lotes e extração incremental Bitrix24. Propriedade: Agente 52 — Lino (Squad 50).

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 item 3 — causa raiz e plano de remediação.

## Alteração necessária

Separar em módulos distintos: cursor pagination, buffer streaming e parse de payload. Manter contratos públicos de extração inalterados.

## Teste esperado

- `npm run check:hotspots` verde sem exceção para o arquivo.
- Testes de integração Bitrix (extração incremental, paginação, retomada) sem regressão — validar em ambiente com credenciais de teste/stub.
- Atenção a B-11/B-12 (sync silencioso, extrações incompletas): não introduzir swallow de erros.

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branch de refatoração.
- Squad 50 entregou `hub-tasks authz` na Onda 3 (`5a1e85605`) — verificar interseção antes de iniciar.
- Registrar SHA congelado e submeter ao Agente 09 antes de integrar.
