# Runbook — Rotação do Segredo de Autenticação (`BETTER_AUTH_SECRET`)

**ID:** RB-SEC-012  
**Criticidade:** Tier 1 (Identidade e Sessão)  
**Propriedade:** Agente 15 (Segurança Aplicada) em coordenação com Agente 01 e 02 (UX)  
**Status:** Operacional  

---

## 1. Contexto e Impacto (Blast Radius)

`BETTER_AUTH_SECRET` assina os cookies de sessão de todos os usuários logados na plataforma (`better-auth.session_token`).
Ao rotacionar esse segredo:
- **Todas as sessões ativas são invalidadas instantaneamente.**
- Usuários conectados no momento da troca receberão erro de autenticação e serão redirecionados para a tela de login.

> [!IMPORTANT]
> **Planejamento Obrigatório:** A rotação rotineira deve ser executada exclusivamente em janela de manutenção previamente informada aos usuários. Em caso de comprometimento ou incidente de segurança (vazamento), a rotação é emergencial e imediata.

---

## 2. Procedimento de Execução

### Passo 1: Geração do Novo Segredo
Gere uma string com alta entropia (mínimo 32 caracteres):
```bash
NEW_AUTH_SECRET=$(openssl rand -hex 32)
```

### Passo 2: Atualização de Ambiente
1. Atualize a variável `BETTER_AUTH_SECRET` no Infisical / Render.
2. Inicie o redeploy imediato.

---

## 3. Validação Positiva
1. Abra uma janela anônima no navegador ou utilize cURL.
2. Realize login com credenciais válidas.
3. Confirme que o cookie de sessão é emitido com sucesso e as rotas autenticadas respondem HTTP `200 OK`.

---

## 4. Validação Negativa (Invalidação Comprovada)
1. Tente realizar requisição autenticada utilizando um cookie emitido com o segredo antigo:
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  --cookie "better-auth.session_token=<COOKIE_ANTIGO>" \
  https://<APP_URL>/api/auth/get-session
```
- **Critério de Sucesso:** Deve retornar HTTP `401 Unauthorized` ou payload nulo `{ session: null }`. Se retornar `200` com sessão ativa, a rotação falhou.
