- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: Em andamento — cliente ligado ao contrato do 01 (PR #216), aguardando merge na main, OK do Marcelo no texto legal e revisão/merge
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
- Cliente isolado: `src/features/landing/services/submitLead.ts`
- Validação de cliente: `src/features/landing/services/leadFormValidation.ts`

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

## Resolução

Cliente da landing ligado ao contrato final do Agente 01 (PR #216,
`POST /api/public/demo-leads`) na branch `agente-02/landing-form-lead-real`.
O funcionamento ponta a ponta depende do #216 estar na `main` (ainda não
mesclado neste momento).

### O que foi feito

- Confirmado (itens 1 e 2 do Agente 21): `consent` inicia `false`, a guarda JS
  bloqueia o envio sem opt-in e o checkbox tem `required` / `aria-required`.
- `LEAD_CAPTURE_ENDPOINT` é a única constante da rota e aponta para
  `/api/public/demo-leads`. Sucesso somente com HTTP 202 e `{ ok: true }`.
  200/201 ou 202 sem `ok:true` não exibem sucesso.
- Payload alinhado ao contrato: `nome`, `email`, `whatsapp` (omitido se vazio),
  `equipe` (`"1 a 5" | "6 a 15" | "16 a 50" | "50+"`, chips da UI usam
  `LEAD_TEAM_SIZES`), `consent: true`, `consentTextVersion: "landing-demo-v1"`,
  `purpose: "agendamento_demonstracao"` e `website` (honeypot, string vazia).
- Honeypot `website` no form: campo de texto fora da tela, `tabIndex={-1}`,
  `aria-hidden`, fora do fluxo de teclado. A UI envia `""`.
- Erros: 400 `{ error: "invalid_payload", fields }` mapeados para os campos
  quando possível; 429 `rate_limited` (mensagem específica de 5 envios / 15
  min); 503 `unavailable` (mensagem específica); rede (mensagem genérica).
- Texto de consentimento provisório cita nome, e-mail, WhatsApp opcional,
  finalidade (contato sobre a demonstração do BirthHub 360°), IP guardado só
  como hash, retenção operacional de 90 dias sem avanço ou 30 dias após a
  demo, e link para `/privacy`. Marcado no código como TEXTO LEGAL PROVISÓRIO
  — aguarda OK do Marcelo. A versão enviada permanece o literal do contrato
  (`landing-demo-v1`); o texto canônico gravado no servidor (PR #216) é mais
  curto e precisará ser alinhado quando o texto legal final for aprovado.
- Promessas não cumpridas removidas: "15 minutos" na coluna esquerda e
  "Cancelamento fácil com 1 clique". Tela de sucesso honesta, sem Google Agenda
  genérico.
- "Direitos do Titular" aponta para `/privacy#direitos-do-titular` (rota
  pública existente; `id` adicionado na seção já presente em
  `PrivacyPolicy.tsx`).
- Testes unitários: 202/`ok:true`, 400 com `fields`, 429, 503, rede, honeypot
  vazio, WhatsApp opcional, consentimento desmarcado e bloqueio.

### O que falta

- Merge do PR #216 na `main` para o endpoint existir no ambiente integrado.
- **OK do Marcelo** para o texto legal final do consentimento (e alinhamento
  com o texto canônico / versão no servidor) e para o prazo de retenção
  descrito.
- Teste ponta a ponta com persistência, depois do #216 na main.
- Decisão de produto sobre CTA de sucesso para `/book/:slug` (não inventar o
  slug).
