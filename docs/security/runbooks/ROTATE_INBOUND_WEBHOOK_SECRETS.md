# Runbook — Rotação Bilateral de Webhooks de Entrada (Inbound Webhooks)

**ID:** RB-SEC-014  
**Criticidade:** Tier 2 (Integridade de Eventos e Comunicação Externa)  
**Propriedade:** Agente 15 (Segurança Aplicada) em coordenação com Agente 06 e Agente 12  
**Status:** Operacional  

---

## 1. Escopo e Webhooks Cobertos

Este runbook padroniza a rotação dos 6 segredos de webhooks receptores da plataforma, todos validados em tempo constante via `timingSafeEqual`:

| Variável | Endpoint de Entrada | Origem / Emissor Externo | Header de Assinatura |
| :--- | :--- | :--- | :--- |
| `BIRTH_VOICES_WEBHOOK_SECRET` | `/api/integrations/birth-voice` | Birth Voices Hub | `x-hub-signature` (HMAC-SHA256) |
| `BIRTHHUB360_WEBHOOK_SECRET` | `/api/webhooks/voice-result` | Bland AI / Gateway de Voz | `x-birthhub360-webhook-secret` |
| `THREECX_WEBHOOK_SECRET` | `/api/integrations/3cx/webhook` | PABX 3CX Call Control | `x-hub-signature` (HMAC-SHA256) |
| `CHATWOOT_WEBHOOK_SECRET` | `/api/integrations/chatwoot/webhook`| Chatwoot Omnichannel | `x-chatwoot-signature` |
| `EMAIL_INBOUND_WEBHOOK_SECRET`| `/api/webhooks/email/inbound` | Inbound Parse Provider | `x-webhook-secret` |
| `SIGNATURE_INBOUND_WEBHOOK_SECRET` | `/api/webhooks/signature/webhook` | Provedor de Assinatura | `x-signature-secret` |

---

## 2. Protocolo de Rotação Coordenada (Zero-Downtime)

Como os webhooks envolvem duas partes (quem envia e quem valida):
1. **Geração do novo segredo:**
   ```bash
   NEW_WEBHOOK_SECRET=$(openssl rand -hex 24)
   ```
2. **Atualização no emissor externo:** Configurar o novo segredo no painel do parceiro/serviço (ex.: configurações de Webhook do Chatwoot ou Birth Voices).
3. **Atualização na API Birth Hub 360:** Atualizar a variável de ambiente correspondente no Render / Infisical.
4. **Deploy e sincronização.**

---

## 3. Validação Positiva
Dispare um webhook de teste ou utilize cURL com a nova assinatura/segredo:
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://<APP_URL>/api/webhooks/voice-result \
  -H "Content-Type: application/json" \
  -H "x-birthhub360-webhook-secret: $NEW_WEBHOOK_SECRET" \
  -d '{"call_id": "test-verify", "status": "completed"}'
```
- **Critério de Aceite:** Retorno HTTP `200 OK`.

---

## 4. Validação Negativa (Invalidação Comprovada)
Envie payload com o segredo/assinatura antiga:
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://<APP_URL>/api/webhooks/voice-result \
  -H "Content-Type: application/json" \
  -H "x-birthhub360-webhook-secret: <SEGREDO_ANTIGO>" \
  -d '{"call_id": "test-verify", "status": "completed"}'
```
- **Critério de Sucesso:** Retorno HTTP `401 Unauthorized` ou `403 Forbidden`. O processamento deve ser terminantemente rejeitado.
