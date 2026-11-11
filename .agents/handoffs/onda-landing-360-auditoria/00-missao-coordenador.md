# Missão — Agente 00 (Coordenador)

Você é o Agente 00. Leia AGENTS.md e `.agents/prompts/00-coordenador.md` antes de planejar.

## Contexto

Foi concluída uma auditoria ad-hoc da landing page (`/`, `/welcome`, `/login`)
com 22 achados documentados. Os handoffs já estão criados e indexados em:

`.agents/handoffs/onda-landing-360-auditoria/README.md`

## Onda

- Onda: `landing-360-auditoria` (pasta de handoffs já criada)
- Branch de integração sugerida: `integracao/landing-360-auditoria`
- Branch do executor frontend: `agente/02-fix-landing-360`

## Objetivo

Levar os 22 achados da auditoria da landing a zero, respeitando propriedade
de arquivos, dependências entre agentes e gates do AGENTS.md.

## Handoffs a despachar (ler o README primeiro — ele tem o mapa completo)

| Handoff | Destino | Prioridade | Dependência |
|---|---|---|---|
| `auditoria-para-02-form-lead-fake.md` | 02 | bloqueador | endpoint do 01 |
| `02-para-01-endpoint-captura-lead.md` | 01 | bloqueador | — |
| `02-para-21-validacao-consentimento-lgpd.md` | 21 (depois 02) | alto | endpoint do 01 |
| `auditoria-para-02-verdade-no-copy.md` | 02 | alto | **decisão de negócio pendente** |
| `auditoria-para-02-bugs-funcionais.md` | 02 | alto | — |
| `auditoria-para-02-limpeza-deadcode.md` | 02 | normal | confirmar com 00 se `Landing360Impeccable.tsx` pode ser deletado |
| `auditoria-para-02-ux-mobile-a11y.md` | 02 (consulta 03) | normal | — |

## Ordem de execução sugerida

1. **Decisão prévia (humano/00)**: itens 3, 4, 5, 11 e 20 do handoff
   `verdade-no-copy` dependem de dados reais de negócio — métricas, depoimentos,
   certificações e o número oficial de agentes. Sem essa decisão, o 02 executa
   tudo dos outros handoffs e deixa o copy sensível para o final.
2. **01**: endpoint de captura de lead (desbloqueia o item 1).
3. **21**: validação do consentimento LGPD (rápida, destrava o merge do form).
4. **02**: executa em commits pequenos por pacote —
   a) bugs funcionais (itens 6, 7, 8, 9, 12, 19, 21);
   b) limpeza dead code + imports (13, 14, 15);
   c) UX mobile/a11y (16, 17, 18, 22);
   d) form + CTA de agenda (1, 2) — por último, depende do endpoint;
   e) verdade-no-copy (3, 4, 5, 11, 20) — após decisão de negócio.
5. **03**: consultado pelo 02 apenas nos itens de navegação mobile e política
   de ícones/emoji (não executa em paralelo no mesmo working tree).
6. **24**: revisão independente obrigatória de todo o diff antes de integrar.

## Restrições

- Todos os itens tocam `src/features/landing/pages/Landing360.tsx` e
  `src/features/landing/components/**` — **um único executor (02)** para evitar
  conflito de propriedade. Não paralelizar 02 com 03 no mesmo arquivo.
- `prisma/schema.prisma` e migrações são do 01 — o 02 não cria schema.
- `server.ts`, `package.json` e lockfile exigem aprovação explícita sua (00).
- Se o endpoint de lead exigir migration, a ordem de integração do §19 se aplica:
  schema primeiro, consumidor depois.
- `npx tsc --noEmit` já passa — o gate local do 02 deve incluir typecheck +
  build; sugiro ao 08/QA smoke test das rotas `/`, `/welcome`, `/login` no final.

## Critério de sucesso final

- 22/22 achados com status `resolvido` nos handoffs ou decisão registrada.
- Form de lead persiste dados de verdade (evidência do 22 se aplicável).
- Nenhuma claim quantitativa sem fonte ou rótulo de ilustração.
- `tsc --noEmit` + `npm run build` verdes; parecer do 24 registrado em
  `.agents/reviews/`.

## Suposições decididas (validar com o humano se discordar)

- `Landing360Impeccable.tsx` e componentes mortos serão deletados após
  confirmação — há chance de serem versão alternativa intencional.
- Experimento A/B: se for ferramenta interna, dock deve ser escondido em
  produção; variante C será removida ou implementada de verdade.
- Rotas `/`, `/welcome` e `/login` são as superfícies auditadas; a landing
  `LandingInnovative` (`/landing-new`) está fora de escopo.
