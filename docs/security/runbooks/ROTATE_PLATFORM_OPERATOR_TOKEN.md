# Runbook — Rotação do Token de Operador de Plataforma (`PLATFORM_OPERATOR_TOKEN`)

**ID:** RB-SEC-013  
**Criticidade:** Tier 1 (Acesso a Infraestrutura, Filas e Métricas)  
**Propriedade:** Agente 15 (Segurança Aplicada) em coordenação com Agente 10 (SRE)  
**Status:** Operacional  

---

## 1. Contexto

`PLATFORM_OPERATOR_TOKEN` protege superfícies internas de monitoramento e orquestração:
- `GET /metrics` (Prometheus) quando `EXPOSE_METRICS=true`.
- `GET/POST /admin/queues` (BullBoard / Filas BullMQ).

Mesmo administradores de organização (`role = ADMIN`) têm acesso bloqueado a essas rotas sem a apresentação explícita deste token (Fail-Closed, SEC-001/SEC-002).

---

## 2. Procedimento de Execução

### Passo 1: Geração do Novo Token
```bash
NEW_OPERATOR_TOKEN=$(openssl rand -hex 32)
```

### Passo 2: Atualização de Variável de Ambiente
1. Atualize `PLATFORM_OPERATOR_TOKEN` no Render / Infisical.
2. Atualize o cabeçalho configurado no scraper do Prometheus / Datadog (se aplicável).
3. Efetue o restart do container de API.

---

## 3. Validação Positiva
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $NEW_OPERATOR_TOKEN" \
  https://<APP_URL>/admin/queues
```
- **Critério de Aceite:** Retorno HTTP `200 OK`.

---

## 4. Validação Negativa (Invalidação Comprovada)
```bash
# 1. Teste com token antigo:
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <TOKEN_ANTIGO>" \
  https://<APP_URL>/admin/queues

# 2. Teste sem token:
curl -s -o /dev/null -w "%{http_code}\n" \
  https://<APP_URL>/admin/queues
```
- **Critério de Sucesso:** Ambos os testes devem retornar HTTP `401 Unauthorized` ou `403 Forbidden`.
