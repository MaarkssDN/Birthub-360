- De: 02 — Produto e UX (em nome da auditoria da landing)
- Para: 01 — Plataforma, Segurança e Dados
- Onda: landing-360-auditoria
- Status: aberto
- Prioridade: bloqueador

## Problema

A landing page captura leads (nome, e-mail corporativo, WhatsApp, tamanho de
equipe, consentimento LGPD) mas **não existe endpoint que receba esses dados**.
O formulário hoje é cenográfico — ver `auditoria-para-02-form-lead-fake.md`.

## Arquivo(s) envolvido(s)

- Novo endpoint (sugestão: `POST /api/leads` ou equivalente no domínio de
  prospecção/CRM já existente — verificar se já há model `Lead`/`Prospect`
  reaproveitável em `prisma/schema.prisma` antes de criar tabela nova)
- `src/features/landing/pages/Landing360.tsx` (consumidor — propriedade do 02)

## Alteração necessária

1. Verificar se já existe fluxo de captura de lead (prospecção, marketing,
   PublicBookingPage `/book/:slug`) e reutilizar o contrato — não duplicar.
2. Se for endpoint novo: validação Zod dos campos (nome, email, whatsapp,
   equipe, consent), rate limit, persistência com finalidade declarada
   (agendamento de demonstração) e trilha de consentimento LGPD.
3. Resposta deve distinguir sucesso real de erro; nada de 200 fake.
4. Definir para onde o lead vai (fila de SDR? CRM? notificação?) — alinhar com 05/17
   se houver cadência de contato envolvida.

## Teste esperado

- POST com payload válido → registro persistido + resposta 2xx.
- POST com e-mail inválido / sem consent → 4xx com erro claro.
- Rate limit dispara após N requisições.
- Nenhum PII em logs (ver skill lgpd-pii-sanitizer).

## Contexto adicional

- O 02 depende deste contrato para fechar o item 1 da auditoria.
- Consentimento: o texto atual promete "tratamento estritamente para
  agendamento da demonstração" — a finalidade registrada deve bater com isso
  ou o texto deve ser corrigido pelo 21/02.
