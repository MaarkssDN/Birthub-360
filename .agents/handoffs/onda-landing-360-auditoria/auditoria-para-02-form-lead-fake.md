- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: em-andamento
- Prioridade: bloqueador

## Problema

O formulário de captura de lead da landing (`#demonstracao`) é cenográfico:
`handleLeadSubmit` executa apenas `setTimeout(650ms)` e exibe a tela de sucesso —
nenhum `fetch`, nenhum endpoint, nenhum lead persistido. Nome, e-mail e WhatsApp
são descartados. A tela de sucesso ainda afirma "Enviamos a confirmação para
{email}" e "entrará em contato via WhatsApp em até 15 minutos", o que não ocorre.

Além disso, o CTA "Abrir Google Agenda" aponta para `https://calendar.google.com`
genérico — não é link de agendamento e não carrega dados do lead.

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` — `handleLeadSubmit` (~L575-587),
  bloco do form (~L2072-2182), tela de sucesso (~L2039-2070)
- Dependência: `02-para-01-endpoint-captura-lead.md` (endpoint real)

## Alteração necessária

1. Substituir o `setTimeout` por chamada real ao endpoint de captura de lead
   (ver handoff para o 01). Enquanto o endpoint não existir, o submit deve
   falhar de forma observável — nunca mostrar sucesso falso.
2. Tela de sucesso deve refletir o que realmente aconteceu ("recebemos seus
   dados, entraremos em contato") sem prometer canal/prazo não implementado.
3. Substituir o link genérico do Google Agenda por link real de agendamento
   (rota pública `/book/:slug` já existe — `PublicBookingPage`) ou remover o botão.
4. Validar formato de WhatsApp (máscara/DDD) antes do submit.

## Teste esperado

- Submeter o form com dados válidos → lead chega ao backend (verificar persistência
  ou fila) e tela de sucesso corresponde ao fluxo real.
- Submeter com backend fora → erro visível ao usuário, sem falso positivo.
- Reload após submit → estado consistente.

## Contexto adicional

- O consentimento LGPD do form está pré-marcado — ver handoff
  `02-para-21-validacao-consentimento-lgpd.md`. Não fazer merge sem essa validação.

## Resolução parcial (Agente 02 — 2026-11-12, commit `510bce4bd`)

Feito:
- `setTimeout` fake removido: submit agora faz `POST /api/public/demo-requests` real; qualquer falha exibe `role="alert"` observável — nunca sucesso falso.
- Consentimento LGPD inicia desmarcado e é exigido no submit (validação formal do texto fica com Agente 21).
- WhatsApp validado (10–13 dígitos); e-mail `type="email" required"`.
- Copy de sucesso honesta (sem "em até 15 minutos"/"confirmação enviada"); botão genérico "Abrir Google Agenda" removido (rota real `/book/:slug` exige slug de tenant).
- Teste unitário atualizado mockando 200 do contrato + marcando consent.

Bloqueado em: endpoint público de captação (Agente 01 — handoff `01-para-02-contrato-api-leads`) e validação LGPD do consent (Agente 21). Até lá o form falha observavelmente.
