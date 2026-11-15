- De: 02 — Produto e UX (em nome da auditoria da landing)
- Para: 21 — Privacidade e LGPD
- Onda: landing-360-auditoria
- Status: resolvido (validado pelo Agente 21 em 2026-11-14)
- Prioridade: alto

## Problema

O checkbox de consentimento do formulário de demonstração inicia com
`checked={true}` (`leadForm.consent = true` no estado inicial). Opt-in
pré-marcado não configura consentimento válido na LGPD — o titular deve
realizar ato afirmativo livre.

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` — estado `leadForm` (~L565-571)
  e checkbox (~L2155-2169)

## Alteração necessária

1. Validar o desenho correto: checkbox desmarcado por padrão + texto de
   consentimento adequado à finalidade (agendamento de demo) — confirmar se
   o texto atual está suficiente ou precisa de ajuste de redação.
2. Confirmar se a coleta de WhatsApp exige consentimento adicional ou base
   legal distinta (contato ativo vs. prospecção).
3. Se o endpoint do 01 registrar consentimento, alinhar campos
   (timestamp, versão do texto, finalidade).

## Teste esperado

- Form não submete sem checkbox marcado.
- Registro de consentimento contém timestamp + finalidade + versão do texto.

## Contexto adicional

- Depende do endpoint do Agente 01 (`02-para-01-endpoint-captura-lead.md`)
  para persistir a prova de consentimento.

## Resolução (Agente 21 — 2026-11-14)

**O defeito reportado já está corrigido na base atual** (o form foi alterado
após a auditoria; comentário no código cita a validação do Agente 21 de
2026-11-13). Validação ponto a ponto:

1. **Checkbox desmarcado por padrão:** `consent: false` no estado inicial
   (`Landing360.tsx` L559–566). Não é mais opt-in pré-marcado.
2. **Guarda em JS além do `required` HTML:** `handleLeadSubmit` recusa o envio
   sem consentimento com mensagem de erro observável (L581–585); o checkbox é
   `required` (L1946) e o submit fica desabilitado durante loading.
3. **Texto de consentimento adequado à finalidade:** o texto exibido é a
   constante canônica `LANDING_DEMO_CONSENT_TEXT`
   (`src/shared/contracts/publicLead.constants.ts` L28–29): «Concordo com o
   tratamento dos dados estritamente para agendamento da demonstração conforme
   a LGPD.» — finalidade restrita e específica. **Ressalva:** a redação é
   rascunho aguardando OK legal do Marcelo (registrado em
   `docs/lgpd/consentimento-lead.md` §4 e no próprio constants L8); a versão
   recomendada com link para `/privacy` e menção explícita ao WhatsApp segue
   pendente de aprovação — não é gap de código.
4. **WhatsApp:** campo é **opcional** (decisão confirmada do Marcelo);
   validação de formato BR só quando preenchido (L587–590) e o payload omite o
   campo quando vazio (L604). O texto de consentimento cobre "dados" para a
   finalidade de agendamento — suficiente enquanto a redação final não for
   aprovada; ao aprovar a nova redação, incluir menção ao WhatsApp.
5. **Prova persistida pelo servidor (endpoint do 01, PR #216 — já implementado):**
   `POST /api/public/demo-leads` valida `consent: z.literal(true)`,
   `consentTextVersion` e `purpose` (`publicLead.schema.ts` L60–62), grava
   `PublicLeadConsent` com texto integral + versão + `grantedAt` do servidor
   (`publicLead.service.ts` L171–181) e ancora na cadeia
   `ConsentAuditRecord` com IP **hasheado** (`hashClientIp`) e timestamp do
   servidor (L188–195). Rate limit dedicado (`rateLimiters.ts` L123–135),
   honeypot e resposta 202 idêntica sem vazar validação
   (`publicLead.routes.ts` L20–54). O client envia
   `consentTextVersion`/`purpose` e nunca o texto (L598–610).
6. **Testes existentes cobrindo o comportamento:**
   `tests/unit/features/landing/Landing360.test.tsx` (submit bloqueado sem
   consentimento; payload com `consent:true` + `consentTextVersion`),
   `tests/unit/features/landing/leadCapture.routes.test.ts`,
   `tests/unit/features/public-leads/*` e
   `tests/integration/public-lead-capture.test.ts` (prova na cadeia, versão,
   finalidade, IP hasheado).

**Observação residual (não-bloqueante, dono Agente 02):** o copy de benefícios
menciona «Atendimento rápido em até 15 minutos» e contato via WhatsApp
(`Landing360.tsx` L1804–1808) — promessa operacional que a recomendação §4.5 do
doc de proposta pedia para não fazer enquanto o canal não estiver garantido.
Sem impacto no consentimento; registrar para o 02 avaliar.

**Conclusão:** opt-in inválido eliminado; desenho server-side de prova de
consentimento conforme LGPD art. 8º, §2º. Handoff encerrado como **resolvido**;
pendências remanescentes são de aprovação de texto legal (Marcelo) e copy (02),
não de conformidade técnica.
