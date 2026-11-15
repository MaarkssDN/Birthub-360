# Handoff — Revisão independente da leva W7 do coordenador

De: 00 — Coordenador
Para: 24 — Revisão Independente
Onda: W7
Status: aberto
Prioridade: alto (gate antes de merge/push da integração)
Sprint destino: imediato

## Problema

A branch `integracao/coordenador-20261112` acumulou merges da coordenação
(17 auto-stop, 04 desconto×2, 07 dry-run, 05 créditos+social, 12 voice-audit,
09 offline AES-GCM, 01 enrollment store + migração consumers + cleanup,
08 specs E2E, 23 cache L2 BI, 17 corte dialer-3cx, 02 settings honestos) +
merges paralelos das ondas W5/W6 de outros coordenadores + merge com
origin/main.

## Arquivo(s) envolvido(s

- Todo o diff `origin/main...integracao/coordenador-20261112`
- `.agents/reviews/` para registrar parecer

## Evidência

- `npm run typecheck` → exit 0 no HEAD atual.
- Revisão 24 anterior (70cbdaca0) cobriu só os 6 primeiros merges.
- Handoffs abertos gerados nesta leva: 00→04 hotspots, 00→08 mesa E2E,
  00→21 LGPD portal, 00→16 War Room SSE, 00→10 k8s, 12→01 voice adapters,
  12→05 outbound (ambos ainda abertos).

## Alteração necessária

Revisar os merges desde a última revisão 24 (especialmente: cache L2 do 23 —
chave inclui organizationId?; corte do dialer — remoção segura?; settings
honestos; merge com origin/main — conflitos resolvidos corretamente?).

## Teste esperado

- Parecer em `.agents/reviews/24-revisao-w7-coordenador-20261113.md` com
  veredito por merge e bloqueantes explícitos.

## Contexto adicional

Os agentes 01/05/08/16/21/10/04 da W7 foram perdidos por restart de sessão —
seus itens voltaram à fila como handoffs abertos (não há código novo deles
para revisar, exceto os salvage commits do 17 e 02).
