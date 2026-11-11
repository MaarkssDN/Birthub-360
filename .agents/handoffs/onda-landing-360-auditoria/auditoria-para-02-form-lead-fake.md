- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: Em andamento — UI pronta, aguardando contrato do 01 e validação do 21
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

Parcial — UI e cliente prontos na branch `agente-02/landing-form-lead-real`.
O envio ainda não persiste lead de verdade porque o contrato HTTP do Agente 01
não foi publicado.

### O que foi feito

- Módulo isolado `submitLead(payload, { signal })` com `fetch` POST JSON.
  A constante `LEAD_CAPTURE_ENDPOINT` permanece no placeholder
  `PENDENTE_CONTRATO_AGENTE_01`, claramente comentada como pendente do contrato
  do Agente 01. Se a constante estiver vazia ou for o placeholder, a função
  rejeita com erro tipado `endpoint_unavailable` e **nunca** simula sucesso.
  Sucesso somente com resposta HTTP 2xx. Erros mapeados: rede, 4xx (mensagem
  genérica segura), 429 e 5xx.
- Payload enviado: nome, email, whatsapp (dígitos BR), equipe, consent e
  metadados de consentimento (`textVersion`, `purpose`, `timestamp` ISO gerado
  no cliente). Campos marcados para alinhar com 01/21.
- Consentimento inicia desmarcado e é obrigatório (`required`, `aria-required`).
  O texto legal exibido foi mantido; nenhum texto novo foi criado.
- Validação de cliente: nome, e-mail válido, WhatsApp com DDD (10–11 dígitos BR,
  aceitando máscara e DDI 55) e consentimento. Rótulos associados, `aria-invalid`,
  `aria-describedby`, região `role="alert"` / `aria-live` para erros, foco no
  primeiro campo inválido, botão `disabled` / `aria-busy` durante o envio,
  bloqueio de duplo submit.
- Estados honestos: carregando ("Enviando..."), erro com possibilidade de tentar
  de novo sem perder dados, e sucesso com a mensagem
  "Recebemos seus dados. Nossa equipe vai entrar em contato."
- Removidas a promessa de WhatsApp em 15 minutos e o botão genérico do Google
  Agenda na tela de sucesso. A rota `/book/:slug` existe (`PublicBookingPage`),
  mas não há slug de demonstração definido para a landing — o botão foi removido
  em vez de inventar um link.
- `trackLeadFormSubmitted` dispara apenas após sucesso real (2xx).
- Testes unitários reescritos/ampliados (sucesso 2xx, 4xx/5xx/rede/429, endpoint
  pendente, consentimento desmarcado e bloqueio, WhatsApp/e-mail inválidos,
  aria-live e ausência de duplo submit).

### O que falta

- Contrato e implementação do endpoint pelo Agente 01 (rota, shape da resposta,
  persistência, rate limit e trilha de consentimento). Depois disso, substituir
  `LEAD_CAPTURE_ENDPOINT` pelo caminho real — sem inventar a rota agora.
- Validação do Agente 21 / OK do Marcelo sobre o texto de consentimento e sobre
  os metadados (`textVersion`, `purpose`, `timestamp`), inclusive se a coleta de
  WhatsApp exige base legal ou consentimento adicional.
- Teste ponta a ponta com persistência ou fila, e consistência após reload,
  quando o endpoint existir.
- Decisão de produto: se houver um slug público estável de agendamento da demo,
  o CTA de sucesso pode voltar apontando para `/book/:slug`. Não inventar o slug.
