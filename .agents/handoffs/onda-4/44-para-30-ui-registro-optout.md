# Handoff — POST /api/cadence/opt-outs sem consumidor de UI

```
De: 44 — Lola (Motor de Cadências Comerciais, Squad 40)
Para: 30 — Violeta (Coordenador de Produto, UX & Design, Squad 30)
Onda: 4 (POS3-44-CONTRACTS)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
```

## Problema

`POST /api/cadence/opt-outs` (`src/features/cadence/cadence.routes.ts:135`) é a rota mais completa
de registro de opt-out do produto: aceita `leadId`, `contactId`, `email` ou `phone` e cobre os
três caminhos (`recordContactOptOut` para contato, `recordOptOut` para sujeito por lead/e-mail/
telefone — completude de sujeito entregue na Onda 3, `44-cadence-fix`).

Inventário POS3-44-CONTRACTS: **nenhum frontend chama essa rota**. `cadence.api.ts` não expõe
`createOptOut` e o `OptOutsSection` do CadenceHub só lista (`GET /opt-outs`). A única UI/rota de
registro existente é `POST /api/lgpd/opt-out` (`src/features/lgpd/lgpd.routes.ts:135`), que exige
`contactId` — não cobre opt-out por lead/e-mail/telefone de leads sem `Contact` vinculado.

Na prática, um vendedor não tem como registrar opt-out de um lead sem contato pela interface —
só via API direta ou pelo fluxo de voz/webhook.

## Arquivo(s) envolvido(s)

- `src/features/cadence/cadence.routes.ts` (`POST /opt-outs`, linhas ~135-172)
- `src/features/cadence/cadence.api.ts` (não expõe método de criação)
- `src/features/cadence/components/hub/OptOutsSection.tsx` (só leitura)
- Referência de rota irmã: `src/features/lgpd/lgpd.routes.ts` (`POST /opt-out`)

## Evidência

```
grep -rn "opt-outs" src --include="*.tsx" | grep -v features/cadence
# → zero chamadas frontend; cadence.api.ts não tem createOptOut
```

## Alteração necessária (produto/UX — Squad 30, implementação pode ser handoff de volta ao 44)

1. Decidir se o registro manual de opt-out por lead/e-mail/telefone entra no CadenceHub
   (ação na `OptOutsSection` ou no detalhe do lead — ownership de UI a definir com 31/32) ou se
   a rota `/api/lgpd/opt-out` deve ser estendida para os mesmos sujeitos.
2. Se a UI for criada em `src/features/cadence/**`, peça o método `createOptOut` em
   `cadence.api.ts` via handoff (arquivo é do Agente 44).

## Teste esperado

- Fluxo E2E/manual: registrar opt-out por e-mail de lead sem `contactId` → lead aparece bloqueado
  em `checkCadenceStartEligibility` (`src/features/cadence/application/cadenceEligibility.ts`).

## Contexto adicional

Classificação: **intencional-dormente / gap de produto** — a rota é contrato de API legítimo e
documentado (handoff OpenAPI da Onda 15), funcional e testada no backend; o que falta é o
consumidor de UI. Não é bug.
