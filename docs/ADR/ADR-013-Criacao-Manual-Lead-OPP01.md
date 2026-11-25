# ADR-013: Criação manual de lead/oportunidade na UI (OPP-01)

**Data:** 2026-11-21
**Status:** ESCOPO APROVADO — implementação condicionada à governança (§40 + handoffs)
**Autor:** Agente 00 — Engenharia de Experiência / Astra
**Origem:** `docs/audits/experience-360/11-UX-OPPORTUNITIES.md` (OPP-01),
`docs/audits/experience-360/12-PRIORITIZED-BACKLOG.md`

---

## 1. Contexto

A auditoria confirmou que **não existe caminho na UI para criar manualmente um
lead/oportunidade**, embora o backend já disponha de `createLead` e do motor de
distribuição weighted round-robin (C.2), hoje ociosos na prática. Operadores que
recebem indicação por telefone, evento ou indicação direta não têm como registrar
o contato sem contornos (importação ou edição de registro existente).

## 2. Decisão do Orquestrador Humano

> "ESCOPO APROVADO. IMPLEMENTAÇÃO CONDICIONADA À GOVERNANÇA. Autorizar a preparação
> do handoff da OPP-01 para os agentes proprietários. A solução deverá reutilizar os
> serviços de backend existentes, respeitar autenticação, permissões, validação de
> dados, tratamento de duplicidades, estados de carregamento, mensagens de erro e
> regras de distribuição de leads. Exigir testes unitários, de integração e E2E,
> além de validação de acessibilidade. Não criar endpoints ou fluxos paralelos sem
> justificativa técnica."

## 3. Diretrizes derivadas

1. **Reuso obrigatório:** o formulário deve consumir o contrato existente de
   `createLead` — nenhum endpoint novo sem justificativa documentada.
2. **Permissões:** o ponto de entrada deve respeitar as mesmas regras de papel do
   CRM (ver handoffs `01-para-04-role-gates-crm.md`); se a criação manual exigir
   papel específico, a decisão de UX deve ser explícita, não implícita.
3. **Duplicidade:** a UI deve tratar o erro de duplicidade retornado pelo backend
   de forma orientada (sugestão de fusão/edição do existente), nunca silenciar.
4. **Distribuição:** após criação, o lead deve seguir o round-robin existente —
   a UI não pode atribuir owner manualmente de forma que burle a regra, salvo se o
   backend já suportar e a decisão de produto confirmar.
5. **Estados:** loading, erro de rede, validação inline e sucesso com feedback
   (toast) são obrigatórios; formulário deve usar os primitivos compartilhados
   (`ui/`), não controles nativos.
6. **Acessibilidade:** labels, `aria-invalid`/`aria-describedby` em erros,
   navegação por teclado e foco gerenciado — alinhado ao padrão que será promovido
   do voice-hub para `ui/` na reconciliação do DS (ADR-012).
7. **Testes:** unit (validação/form), integração (contrato createLead + duplicata
   + permissão) e E2E (jornada criar → aparecer no pipeline), além de axe na rota.

## 4. Riscos

- Exposição de `createLead` pode revelar campos não validados para papéis
  restritos → mitigação: teste de autorização por papel no contrato.
- Duplicidade de UX com fluxos de importação → mitigação: reutilizar o mesmo
  diálogo/componente de formulário se houver sobreposição.
- Regressão no Kanban/board após criação → mitigação: invalidação de cache/query
  consistente com os demais fluxos de escrita do CRM.

## 5. Estado

Handoff de preparação emitido:
`.agents/handoffs/00-para-04-21-opp01-criacao-manual-lead.md`.
Implementação **não autorizada** até parecer do Agente 09 (Silas) e aprovação
dos handoffs.
