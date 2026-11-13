# Handoff — Onda 02 / Frente 07: Landing360 lead capture + claims honestos

De: Devin (execução Onda 02 — frente Landing/Login/M11)
Para: 00 — Coordenador
Onda: 02
Status: resolvido
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: Onda 02

## Problema

O formulário "Reserve sua Demonstração" da `Landing360.tsx` era cenográfico:
`setTimeout(650ms)` sem chamada de rede, sucesso falso com promessa de contato
via WhatsApp em 15 minutos, escassez fabricada ("4 vagas"), CTA "Abrir Google
Agenda" apontando para `calendar.google.com` genérico e métrica inventada
("3.8x").

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx`
- `src/features/landing/routes/leadCapture.routes.ts` (novo)
- `src/bootstrap/routes.ts`, `src/bootstrap/rateLimiters.ts`, `src/config/env.ts`
- `tests/unit/features/landing/leadCapture.routes.test.ts` (novo, 7 testes)

## Evidência

Commit `bff84912d` — **atenção**: o commit caiu na branch
`agente/21-w3-consent-chain-async` porque outro agente trocou o HEAD do working
tree compartilhado durante a sessão (violação do isolamento §17 do AGENTS.md).
O conteúdo é isolado e identificável pelo SHA; pode ser cherry-pickado para a
branch de integração da Onda 02 sem conflito esperado (arquivos disjuntos das
frentes de LGPD/Bitrix em andamento).

Gates executados:
- `npx tsc --noEmit` → 0 erros.
- `npx biome lint` nos arquivos alterados → 0 erros; 11 warnings a11y
  pré-existentes em `Landing360.tsx` (arquivo já listado em
  `docs/architecture/HOTSPOT_EXCEPTIONS.md`).
- `vitest run tests/unit/features/landing/leadCapture.routes.test.ts` → 7/7.

## Alteração necessária

1. **Configurar `LEAD_CAPTURE_EMAIL`** no ambiente (caixa comercial que recebe
   os leads). Sem ela, a rota cai para `SMTP_FROM`/`SMTP_USER`; sem nenhum dos
   três responde 503 honesto.
2. **Decisão de produto pendente (não implementada):** os 3 depoimentos da
   seção "provas sociais" (~linha 1917 de `Landing360.tsx`) são citados de
   pessoas/empresas aparentemente fictícias com valores específicos ("R$ 320
   mil", "NeoLog B2B"). Recomendo à Marca (11) e Produto (02) substituir por
   depoimentos reais ou remover — não alterei por ser decisão de conteúdo
   comercial, mas é o mesmo tipo de claim fabricado que a missão proíbe.
3. **Persistência estruturada de leads**: hoje o lead vai por e-mail (sem
   tabela). Se Produto quiser CRM dos leads da landing, abrir demanda para o
   Agente 01 (schema + RLS + rota autenticada de ingestão).
4. **Booking real**: o sucesso não promete agendamento porque não existe slug
   público de booking da marca. Se houver um `PublicBookingLink` oficial,
   o botão de sucesso pode apontar para `/book/<slug>`.

## Teste esperado

- POST `/api/public/lead-capture` com payload válido → 200 + e-mail SMTP.
- Payload sem `consent:true` → 400. Honeypot preenchido → 200 sem e-mail.
- Sem SMTP/destinatário → 503 com mensagem honesta na UI.

## Contexto adicional

- `Landing360Impeccable.tsx` (1020 linhas) existe mas **não é roteada** —
  candidata a remoção ou a referência de design; decisão do 00.
- A11y warnings remanescentes na landing (labels sem controle, anchors como
  botões) estão inventariados para a auditoria transversal da Frente 08.
