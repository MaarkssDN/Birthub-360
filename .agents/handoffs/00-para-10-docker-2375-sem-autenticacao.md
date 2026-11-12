# Handoff — Docker daemon remoto 192.168.0.116:2375 sem autenticação

De: 00 — Coordenador
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: pós-homologação 2026-11-10
Status: aberto
Prioridade: **bloqueador**
Sprint destino: imediato

## Problema

O daemon Docker do host `192.168.0.116` está exposto via TCP 2375 **sem TLS e
sem autenticação** na LAN `192.168.0.0/24`. O workstation de desenvolvimento
(`192.168.0.179`) usa `DOCKER_HOST=tcp://192.168.0.116:2375`.

## Evidência (executada em 2026-11-10)

- `curl http://192.168.0.116:2375/version` → HTTP 200, Engine 29.9.2, ApiVersion 1.56.
- `curl http://192.168.0.116:2375/containers/json` → lista containers sem credencial.
- `curl http://192.168.0.116:2375/images/json` → lista imagens sem credencial.
- `https://192.168.0.116:2376/version` → sem resposta (TLS não configurado).

Qualquer host da LAN pode criar containers privilegiados, ler volumes e
interceptar o Postgres/Redis/Meilisearch de dev/teste que rodam nesse daemon.

## Alteração necessária

Escolher e aplicar UMA das opções (decisão do 10 + operador):

1. **Firewall (mitigação imediata):** Windows Firewall no host 116 —
   inbound TCP 2375 restrito ao IP `192.168.0.179` (ou à sub-rede de
   estações de dev autorizadas).
2. **SSH (correto):** desabilitar exposição TCP e usar
   `DOCKER_HOST=ssh://<host>` — o docker context `remote` já existe no
   workstation; bastaria apontar para ssh.
3. **TLS mútuo:** proxy/socat com certificados — mais trabalhoso, manter
   como evolução.

Não quebrar: `prepare-integration-env.js` já reescreve hosts de serviço
para o host do `DOCKER_HOST`; se a porta/host mudar, ajustar `.env`/`.env.test`
locais (gitignored) e os scripts que assumem 2375.

## Teste esperado

- `curl http://192.168.0.116:2375/version` de um IP não autorizado → timeout/recusado.
- `docker ps` do workstation autorizado → continua funcionando.
- `npm run test:integration` (pretest) → Postgres/Redis acessíveis.

## Contexto adicional

- Histórico: `docs/audits/technical-report-20261102.md` §6.1 documenta a
  conexão LAN autorizada pelo operador — a exposição parece intencional para
  dev, mas carece de restrição de rede.
- O host é Docker Desktop 4.96.3 em Windows/WSL2.
