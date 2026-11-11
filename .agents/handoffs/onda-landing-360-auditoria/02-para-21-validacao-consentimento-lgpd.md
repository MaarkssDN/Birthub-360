- De: 02 — Produto e UX (em nome da auditoria da landing)
- Para: 21 — Privacidade e LGPD
- Onda: landing-360-auditoria
- Status: aberto
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
