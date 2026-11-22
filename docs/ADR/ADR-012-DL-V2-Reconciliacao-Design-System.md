# ADR-012: Reconciliação documental do Design Language v2.0 com a implementação real

**Data:** 2026-11-21
**Status:** APROVADO COM CONDIÇÃO — decisão do Orquestrador Humano (deliberação C, item 1)
**Autor:** Agente 00 — Engenharia de Experiência / Astra
**Escopo:** `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`, tokens em `src/styles/**`,
primitivas em `src/components/ui/**` e `src/features/voice-hub/components/design-system/**`

---

## 1. Contexto

A auditoria Experience 360 (`docs/audits/experience-360/`, commits `bb015914b` e
`2637c5144`) confirmou divergência material entre o Design Language v2.0 declarado
como autoridade visual e o que está implementado:

- Fontes: implementação usa Sora/Inter/IBM Plex Mono self-hosted
  (`--font-brand-sans`, `--font-brand-display`, `--font-brand-mono`); o DL documenta
  referências divergentes.
- Raios, tons de heading (cyan `#0369a1`, pink `#d91b7c`, gold `#b45309`) e estados
  interativos divergem do texto normativo.
- Existem **duas design systems paralelas**: `src/components/ui/` (~89 primitivos) e
  `src/features/voice-hub/components/design-system/index.tsx` (~1.098 linhas, 19
  componentes redefinidos com ARIA divergente — em `Input`, o voice-hub tem
  `aria-invalid`/`aria-describedby` **superiores** aos de `ui/Input`).
- Três mecanismos de tema CSS convivem (tokens `src/styles`, `ThemeContext` raiz,
  ThemeContexts do voice-hub).

## 2. Decisão do Orquestrador Humano

> "APROVADA A RECONCILIAÇÃO DOCUMENTAL. Não ratificar automaticamente a implementação
> atual como padrão oficial. O Agente 03, juntamente com os responsáveis por UX e
> identidade da marca, deverá comparar o DL v2.0 com a implementação real e propor
> uma versão reconciliada, identificando explicitamente quais tokens, tipografias,
> raios, cores, componentes e comportamentos devem prevalecer. Resolver
> documentalmente a existência de dois Design Systems paralelos, preservando os
> padrões de acessibilidade mais completos. A proposta deverá ser submetida à minha
> aprovação antes de mudanças estruturais de tokens ou migração em massa."

## 3. Consequências

1. **Nenhuma migração em massa de tokens ou consolidação do DS paralelo está
   autorizada** até aprovação da proposta de reconciliação
   (`docs/audits/experience-360/16-DL-RECONCILIATION-PROPOSAL.md`).
2. A proposta deve nomear explicitamente, por categoria (tokens de cor, tipografia,
   radius, espaçamento, elevação, motion, componentes), qual fonte prevalece:
   DL v2.0, implementação atual, ou fusão justificada.
3. Para o DS paralelo: a direção proposta é `src/components/ui/` como camada única,
   **absorvendo** os padrões de acessibilidade superiores do voice-hub
   (`aria-invalid`, `aria-describedby`, semântica de Table) — nunca o contrário.
4. Correções P1 da Onda 1 que não dependem de tokens globais podem prosseguir após
   auditoria do Silas; itens que tocam tokens/tema global ficam bloqueados até a
   reconciliação ser aprovada.
5. Este ADR não altera código. Implementação permanece bloqueada até o gate §40.

## 4. Alternativas rejeitadas

- **Ratificar a implementação como oficial sem revisão:** rejeitado pelo
  Orquestrador — a implementação contém desvios não deliberados e dívida de tokens.
- **Reescrever o DL do zero:** rejeitado — a maior parte do DL v2.0 permanece
  válida; o problema é drift documental, não identidade.

## 5. Pendências

- Proposta de reconciliação (Agente 03 + UX/marca) → aprovação humana.
- Decisão sobre destino do `design-system/` do voice-hub após consolidação.
