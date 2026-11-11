# Proposta de consentimento LGPD — captura de lead da landing

**Status: proposta - aguarda OK do Marcelo**

Este documento **não é texto legal final**. Não publicar como Política de
Privacidade, Termos de Uso ou aviso ao titular até aprovação explícita do
Marcelo. É um rascunho de contrato e recomendações para os Agentes 01
(endpoint) e 02 (formulário em `Landing360.tsx`).

- **Base analisada:** `main` @ `5d75ffa9919145f22ae969c5ca3e2f032b2d050f`
  (2026-11-11, America/Sao_Paulo).
- **Handoff de origem:**
  `.agents/handoffs/onda-landing-360-auditoria/02-para-21-validacao-consentimento-lgpd.md`
  (Status: aberto).
- **Este PR não altera** `Landing360.tsx` (propriedade do Agente 02) nem
  cria o endpoint (propriedade do Agente 01).

---

## 1. Achados objetivos no formulário (main)

Arquivo: `src/features/landing/pages/Landing360.tsx`.

| Ponto | Evidência | Conformidade |
| --- | --- | --- |
| Checkbox inicia marcado | `leadForm` com `consent: true` (L570) | **Inválido.** Opt-in pré-marcado não é consentimento livre (LGPD art. 8º). O titular precisa de ato afirmativo. |
| Validação client | Atributo HTML `required` no checkbox (L2162). `handleLeadSubmit` (L575–587) **não** testa `leadForm.consent` | Frágil: o `required` nativo pode ser burlação (DOM/API). Falta guarda em JS. |
| Validação server | Inexistente: o submit só faz `setTimeout(650)` e marca sucesso; nenhum `fetch` | Sem recusa 4xx por ausência de consentimento. |
| Texto exibido | L2166–2167: «Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.» | Sem link para `/privacy`. Sem menção a WhatsApp, embora o campo seja obrigatório (L2123–2128) e a tela de sucesso prometa contato via WhatsApp em 15 minutos (L2048–2050). |
| Versão do texto | Nenhuma constante / `consentTextVersion` | Não registrável. |
| Data/hora, IP, finalidade | Nada é persistido com o lead (formulário cenográfico) | Sem prova do art. 8º, §2º. |
| Promessa de opt-out | Rodapé do form (L2179): «Cancelamento fácil com 1 clique» | Canal de 1 clique **não existe**. |

O footer tem link para `/privacy` (L2555–2557), mas «Direitos do Titular (LGPD Art. 18)» é um `<span>` morto, não um canal público de DSR (L2560).

`tests/unit/features/landing/Landing360.test.tsx` não cobre o checkbox de consentimento.

---

## 2. Endpoint público — estado atual e lacunas de contrato

**O endpoint pedido no handoff `02-para-01-endpoint-captura-lead.md` (Status: aberto) ainda não existe.**

Verificação em 2026-11-11 (America/Sao_Paulo):

- `gh pr list` (open): só o PR #214 (`fix/ci-actions-gates`) — não cria rota de lead público.
- `git branch -r`: nenhuma branch do Agente 01 com captura pública de lead da landing.
- `POST /api/leads` (`src/bootstrap/routes.ts` L100 + `src/features/crm/routes/lead.routes.ts` L49–51) exige `authenticateToken`, `requireTenant` e papel ADMIN/GESTOR/CLOSER/SDR. **Não serve** para a landing anônima.
- `leadSchema` (`src/lib/zod.ts` L105–128) não tem `consent`, texto, versão, finalidade, IP ou timestamp.
- `docs/DATA-CONTRACT-LEAD.md` descreve o modelo CRM autenticado, não a captura pública.
- `docs/lgpd-base-legal.md` e `docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md` tratam leads de prospecção sob **legítimo interesse / medidas preliminares de contrato**, não o fluxo inbound da landing com checkbox de consentimento e finalidade restrita a «agendamento da demonstração». Após o OK do Marcelo, esses inventários precisarão de linha específica (proposta abaixo) — sem alterar os documentos homologados neste PR.

Rotas `/api/lgpd/titular/:contactId` (exclusão e exportação) estão atrás de `authenticateToken` + `requireTenant` + papel ADMIN/GESTOR (`src/bootstrap/routes.ts` L171). O titular que preencheu a landing **não consegue** exercer sozinho os direitos do art. 18 por essas APIs.

Já existe infraestrutura reutilizável de prova: `ConsentAuditRecord` / `ConsentEventDetail` (`prisma/schema.prisma`, `purpose`, `termsVersion`, `occurredAt`) e o ADR-006. O Agente 01 deve ancorar a prova nela, no tenant controlador (organização comercial do próprio Birth Hub), **não** em tenant de cliente e **não** com `organizationId` vindo do browser.

---

## 3. Contrato proposto do endpoint (aguardando OK)

Sugestão de rota: `POST /api/public/demo-leads` (nome final a cargo do 01). Público, com rate limit, sem autenticação de usuário.

### 3.1 Minimização (campos de negócio)

| Campo | Obrigatório? | Nota |
| --- | --- | --- |
| `nome` | sim | Identificação mínima. |
| `email` | sim | Canal primário de confirmação e DSR. Validar formato. Preferir e-mail corporativo, sem rejeitar domínio pessoal só por política rígida sem base legal. |
| `whatsapp` | **propor como opcional** | Hoje é `required` no form. Para a finalidade declarada (agendar demo), o e-mail já basta. Manter obrigatório só se o Marcelo decidir que o WhatsApp é essencial ao agendamento — aí o texto de consentimento precisa citar o canal. |
| `equipe` | não | Dado de contexto comercial, não identificador direto. |
| `consent` | sim, deve ser `true` | Recusar com 4xx se ausente, `false` ou omitido. |
| tracking / UTM / user-agent completo | não por padrão | Só se houver finalidade explícita e aprovação. |

Não reutilizar o `leadSchema` do CRM. Não aceitar campos livres extras. Não enriquecer (Clearbit etc.) sem base e finalidade novas. Não inscrever automaticamente em cadência outbound do Agente 17.

### 3.2 Base legal (proposta)

- **Finalidade primária (única coberta por este consentimento):** tratar nome, e-mail e, se informado, WhatsApp **exclusivamente para agendar e confirmar a demonstração solicitada pelo titular**.
- **Base legal proposta para essa finalidade:** art. 7º, I (consentimento), desde que o opt-in seja válido (desmarcado por padrão + ato afirmativo). Em paralelo, o art. 7º, V (procedimentos preliminares a contrato a pedido do titular) também é invocável para o contato estritamente necessário ao agendamento — mas, se a UI promete consentimento, o consentimento precisa ser válido.
- **WhatsApp:** o texto deve dizer, de forma clara, que o número será usado para contato sobre a demo. Não usar o número para prospecção, cadência ou disparo de marketing sem consentimento (ou outra base) específico e opt-out.
- **IP:** dado pessoal. Coletar **somente no servidor**, só como prova do art. 8º, §2º, sem perfilização. Se o Marcelo preferir não guardar IP bruto, gravar truncado ou hasheado. Não enviar IP no body do client (facilmente forjável).

Qualquer uso além do agendamento da demo (newsletter, cadência, remarketing) exige finalidade e base distintas — fora deste contrato até novo OK.

### 3.3 Prova de consentimento (gravar com o lead)

O servidor deve registrar, no ato do POST bem-sucedido:

| Dado | Origem | Observação |
| --- | --- | --- |
| Texto exato apresentado | constante versionada no servidor (e ecoada no client) | Não confiar no texto enviado só pelo browser; o client manda a **versão**, o server resolve o texto canônico. |
| `consentTextVersion` | client + conferência server | Ex.: `lead-demo-2026-11-11`. Mudança de redação = nova versão. |
| Finalidade | server | Código estável, ex.: `agendamento_demonstracao`. |
| Data/hora | server (`occurredAt` UTC, exibir em America/Sao_Paulo quando for o caso) | Ignorar relógio do client. |
| IP | server (`req.ip` / forwarding confiável), quando autorizado | Ver §3.2. |
| `consent: true` | payload, validado | Sem isso, 4xx e nada persistido. |

Reaproveitar `ConsentAuditRecord` (`purpose`, `termsVersion`, `occurredAt`) e guardar o texto em `ConsentEventDetail` (expurgável). Nenhum PII desses campos em logs de aplicação.

### 3.4 Retenção (proposta, não homologada)

| Registro | Prazo proposto | Destino |
| --- | --- | --- |
| Dados do lead da demo (nome, e-mail, WhatsApp, equipe) | 90 dias sem interação, ou até a demo ocorrer + 30 dias, o que for maior — salvo nova base (ex.: o titular vira cliente) | Anonimização / exclusão (serviço já existente de erasure, no tenant controlador). |
| Prova de consentimento (cadeia append-only) | Pelo tempo necessário ao ônus da prova (art. 8º, §2º e art. 16, I), conforme ADR-006 | Crypto-shredding da chave do titular; linhas da cadeia só saem no fim do prazo legal. |
| IP (se coletado) | O mesmo da prova, ou menor se o Marcelo optar por não reter IP bruto | Não reutilizar para outro fim. |

Os 90/30 dias são **proposta operacional**, não prazo legal automaticamente exigido. Dependem do OK do Marcelo e de alinhamento com o ROPA.

### 3.5 Direito de exclusão e opt-out

O titular da landing precisa de canal **público**, independente de login:

1. Instruções no e-mail de confirmação (como pedir exclusão e como recusar novo contato).
2. Endereço/canal do encarregado visível junto ao form (link para `/privacy` e, quando existir, fluxo público de DSR).
3. Se houver contato por WhatsApp, honrar palavra-chave de opt-out já adotada na plataforma (`SAIR`) também para esse número.
4. A promessa de «cancelamento com 1 clique» só pode permanecer no copy **depois** de o 01/02 implementarem o link (token de opt-out no e-mail de confirmação).
5. Não apontar o titular da landing para `DELETE /api/lgpd/titular/:contactId` autenticado como se fosse o canal dele.

Resposta do POST: 2xx só com persistência real; 4xx se consentimento ausente, payload inválido ou rate limit; jamais 200 “fake”.

---

## 4. Recomendações ao Agente 02 (`Landing360.tsx`)

1. Iniciar com `consent: false` (nunca `true`).
2. Além do `required` HTML, recusar o submit em JS se `leadForm.consent !== true`; desabilitar o CTA enquanto desmarcado é aceitável, desde que o motivo fique visível.
3. Ajustar o texto (proposta de redação — **não usar em produção sem OK do Marcelo**):

   > Concordo com o tratamento do meu nome, e-mail e, se informado, WhatsApp, exclusivamente para agendar e confirmar a demonstração do Birth Hub 360°, nos termos da [Política de Privacidade](/privacy).

4. Incluir `consentTextVersion` no payload (constante compartilhada com o server).
5. Não prometer prazo/canal não implementado («WhatsApp em 15 minutos») nem «1 clique» de cancelamento enquanto o canal não existir. A tela de sucesso deve refletir o que o endpoint realmente fez.
6. Tornar WhatsApp opcional, salvo decisão em contrário do Marcelo.
7. Não misturar nesta alteração outros arquivos da onda (copy, dead code etc.), para reduzir conflito de merge.
8. Coordenar com o 01 o contrato do POST antes de trocar o `setTimeout` por `fetch`. Enquanto o endpoint não existir, não exibir sucesso falso (já pedido em `auditoria-para-02-form-lead-fake.md`).

Não editar `Landing360.tsx` neste PR.

---

## 5. Recomendações ao Agente 01 (endpoint)

1. Criar rota pública nova; **não** abrir `POST /api/leads` autenticado.
2. Validar Zod próprio (minimização + `consent === true` + versão de texto conhecida).
3. Rate limit; recusar payload sem consentimento com 4xx claro, sem persistir.
4. Fixar o tenant controlador por configuração de servidor, nunca pelo client.
5. Ancorar prova em `ConsentAuditRecord` / `ConsentEventDetail` (finalidade, versão, texto, `occurredAt`, IP se autorizado).
6. Não logar PII (skill `lgpd-pii-sanitizer`).
7. Não disparar cadência de marketing automaticamente.
8. Expor (ou documentar) canal público de exclusão/opt-out e o e-mail de confirmação com instruções de DSR.
9. Testes: payload válido persiste lead + prova; sem consentimento → 4xx e zero registro; rate limit; tenant isolation; nenhum PII em log.
10. Se precisar de migration, seguir a ordem do §19 do `AGENTS.md` e abrir handoff — não misturar com docs deste PR.

---

## 6. Conflitos e coordenação

- Handoffs da onda `landing-360-auditoria` para 01, 02 e 21 estão **abertos**.
- Não há PR aberto do 01 ou do 02 alterando o form/endpoint (único PR open no repo canônico: #214, CI).
- Branches remotas recentes do 02 (`agente/02-asany-layout`) **não** tocam `Landing360.tsx`. A branch local `agente-02/landing-form-lead-real` (clone do 02, ainda no mesmo SHA da `main`, sem diff) indica que o 02 deve passar a editar esse arquivo — **risco de conflito se o 21 também o alterar**. Por isso este trabalho fica só em `docs/`.
- Outros handoffs abertos do 21 (saneamento 2026-11-10: hotspot de `consentAuditChain.service.ts` e ROPA automatizado) são independentes desta proposta.

---

## 7. O que este documento não faz

- Não publica política, termos ou aviso final ao titular.
- Não altera código de produto, schema ou rotas.
- Não autoriza merge na `main` nem ação em produção.
- Qualquer redação da seção 4, prazos da seção 3.4 e a decisão sobre WhatsApp obrigatório / coleta de IP dependem do **OK do Marcelo**.
