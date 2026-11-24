# ADR-015: Migração de /app/characters para os temas oficiais com acessibilidade AA

**Data:** 2026-11-21
**Status:** APROVADO — migração autorizada condicionada a WCAG 2.2 AA e testes
visuais antes do merge
**Autor:** Agente 00 — Engenharia de Experiência / Astra
**Origem:** `docs/audits/experience-360/07-ACCESSIBILITY-AUDIT.md`,
`08-RESPONSIVE-AUDIT.md`

---

## 1. Contexto

A auditoria mediu **contraste de heading de 1,52:1** em `/app/characters`
(evidência do inventário visual do Agente 14) e identificou que a página
(`src/features/characters/CharacterGalleryView.tsx` e componentes adjacentes)
**força uma paleta escura mesmo no tema claro**, violando os tokens do Design
System e WCAG 2.2 AA. O feature não possui `AGENTS.md` local — ownership de
feature a confirmar pelo Agente 00.

## 2. Decisão do Orquestrador Humano

> "APROVADA A MIGRAÇÃO PARA OS TEMAS OFICIAIS, COM ACESSIBILIDADE AA. A página
> deverá funcionar corretamente nos temas claro e escuro, respeitando os tokens e
> o Design System oficial. Corrigir contrastes insuficientes, estados de
> interação, navegação por teclado e comportamentos responsivos. Não manter um
> tema escuro forçado como solução para os problemas atuais. Exigir validação
> WCAG 2.2 AA e testes visuais antes do merge."

## 3. Diretrizes derivadas

1. **Temas oficiais:** a página deve consumir os tokens semânticos de tema
   (claro/escuro) como as demais telas — proibido paleta hardcoded ou dark-mode
   forçado como workaround.
2. **Contraste AA:** todo texto (incluindo headings, labels, metadados e estados)
   deve atingir 4,5:1 (texto) / 3:1 (componentes e texto grande) em ambos os
   temas — medição obrigatória, não estimativa.
3. **Estados e teclado:** hover/focus/disabled visíveis e consistentes com o DS;
   navegação completa por teclado; `prefers-reduced-motion` respeitado.
4. **Responsivo:** sem overflow horizontal, alvos de toque ≥ 24px (preferência
   44px em mobile), layouts íntegros de 360px a desktop.
5. **Dependência de tokens:** como a página consumirá tokens globais, a
   implementação deve aguardar ou coordenar-se com a reconciliação do DL
   (ADR-012) para não codificar valores que serão remapeados.
6. **Validação pré-merge:** screenshots light/dark em breakpoints representativos,
   axe-core sem violações serious/critical na rota, e comparação com baselines
   visuais atualizadas conscientemente (o visual **vai** mudar — baseline nova
     deve ser justificada no PR).

## 4. Riscos

- A paleta dark atual pode ser intencional para o "personagem" (identidade do
  módulo) → mitigação: proposta visual deve preservar a identidade via tokens,
  não via hex hardcoded; se identidade exigir tratamento especial, escalar ao
  Orquestrador antes de implementar.
- Feature sem AGENTS.md local → ownership deve ser designado antes do handoff
  de implementação.
- Baselines visuais existentes falharão → esperado; exige aprovação de baseline
  nova no PR, não silenciamento.

## 5. Estado

Handoff de preparação emitido:
`.agents/handoffs/onda-1/00-para-02-03-characters-tema-oficial-aa.md`.
Implementação **não autorizada** até parecer do Agente 09 (Silas) + aprovação
da reconciliação de tokens (ADR-012).
