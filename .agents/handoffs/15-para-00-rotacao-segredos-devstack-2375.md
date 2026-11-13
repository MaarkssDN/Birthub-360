# Handoff — Rotação de segredos do dev stack expostos via Docker API 192.168.0.116:2375

De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 00 — Coordenador
Onda: pós-homologação 2026-11-10 / saneamento 2026-11-12
Status: **em-andamento** (depende de ação humana no host e nas estações)
Prioridade: alto
Bloqueador-ref: `.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md`;
runbook de contenção `.agents/runs/2026-11-10-ordem01-docker-2375-contencao.md`;
PR #240 (mergeado)

## Problema

O daemon Docker de `192.168.0.116:2375` ficou exposto sem autenticação na LAN.
Durante a janela de exposição, qualquer host podia `docker inspect` os
containers e ler variáveis de ambiente — ou seja, as credenciais do dev stack
(`POSTGRES_PASSWORD`/`APP_DB_PASSWORD`, `REDIS_PASSWORD`, `MEILI_MASTER_KEY`,
`MINIO_ROOT_*`, `LITELLM_MASTER_KEY` e, se presentes em env/volume, os segredos
de aplicação) devem ser consideradas comprometidas.

**Não existe handoff 10→15 formal sobre rotação** — a contenção foi entregue
pelo PR #240 e o próprio runbook de contenção (§3) delega a avaliação de
rotação ao "operador/Agente 15". Este handoff formaliza essa pendência.

## Arquivo(s) envolvido(s)

- Criado: `docs/security/runbooks/ROTATE_DEVSTACK_EXPOSED_SECRETS.md`
  (procedimento completo: inventário → contenção → rotação por serviço →
  validação positiva/negativa → registro).
- Correlatos: `ROTATE_BETTER_AUTH_SECRET.md`, `ROTATE_CREDENTIALS_ENCRYPTION_KEY.md`,
  `ROTATE_PII_BLIND_INDEX_KEY.md` (para segredos de aplicação, se confirmados
  no inventário do Passo 0).

## Evidência

- `curl http://192.168.0.116:2375/version` respondeu HTTP 200 em 2026-11-12
  (Engine 29.9.2) — daemon ainda acessível; `GET /containers/json` passou a
  dar timeout na mesma sessão (possível contenção parcial ou daemon ocupado —
  verificar no host).
- Inventário de variáveis de risco confirmado nos `docker-compose*.yml`
  (valores default são dev-only documentados; uso real depende do `.env` do
  host 116 — Passo 0 do runbook).

## Alteração necessária (ação humana)

1. Executar no host 116 o Passo 0 do runbook (inventário via `docker inspect`)
   para confirmar quais segredos estavam em env de container.
2. Confirmar que a contenção do 2375 está ativa antes de rotacionar (Passo 1).
3. Rotacionar os segredos em janela combinada — procedimento no runbook;
   segredos de aplicação seguem os runbooks individuais (grace period de
   envelope encryption obrigatório para `CREDENTIALS_ENCRYPTION_KEY`).
4. Atualizar `.env`/`.env.test` de **todas** as estações de trabalho e agentes.
5. Registrar conclusão neste handoff (data + validações ±, sem valores).

## Teste esperado

- Validações positiva e negativa do runbook §4/§5 para cada serviço rotacionado.
- `npm run test:integration` verde no workstation autorizado após propagação.

## Contexto adicional

- Se o inventário mostrar que os valores são os defaults dev-only dos composes,
  a rotação é de baixo custo (trocar defaults fracos por valores fortes).
- Se algum segredo for compartilhado com homologação/produção, tratar como
  incidente de credencial de produção — escalar antes de rotacionar.
- Resposta a incidente (revisão de logs do host, decisão sobre histórico git):
  run report §3 e `DECIDE_GIT_HISTORY_REWRITE.md`.
