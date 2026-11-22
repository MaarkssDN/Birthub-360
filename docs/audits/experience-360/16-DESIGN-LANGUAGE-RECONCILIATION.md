# 16 — Proposta de Reconciliação do Design Language v2.0

**Data:** 2026-11-21 · **Status:** PROPOSTA — requer aprovação do Orquestrador
**Base:** ADR-012 · Evidências: `04-DESIGN-SYSTEM-AUDIT.md`, `05-CSS-TECH-DEBT.md`,
`06-COMPONENT-AUDIT.md` (auditoria Experience 360)
**Responsável pela execução da proposta:** Agente 03 + responsáveis UX/marca

---

## 1. Objetivo

Produzir o **DL v2.1 reconciliado**: versão do `BIRTHHUB-360-DESIGN-LANGUAGE.md`
que declare explicitamente o que prevalece em cada categoria, eliminando o drift
documento × implementação. Nenhuma mudança de código de token/migração está
autorizada por este documento — ele é a *proposta* a ser aprovada.

## 2. Fontes comparadas

| Fonte | Papel |
|---|---|
| `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 | Autoridade normativa declarada |
| `src/styles/globals.css` + tokens `--font-brand-*`, cores, radius | Implementação real |
| `src/components/ui/**` (~89 primitivos) | DS primário em uso |
| `src/features/voice-hub/components/design-system/index.tsx` (~1.098 linhas) | DS paralelo (dívida) |
| `DESIGN.md`, `BIRTHHUB-360-DESIGN-SYSTEM.md`, `BIRTH_HUB_DESIGN_CONSTITUTION.md`, `BrandConstitution.md` | Referências complementares |

## 3. Divergências confirmadas → recomendação por categoria

### 3.1 Tipografia — PREVALECE A IMPLEMENTAÇÃO (ratificar)

- Real: `--font-brand-sans` Inter/system, `--font-brand-display` Sora,
  `--font-brand-mono` IBM Plex Mono — self-hosted, sem fontes remotas.
- DL v2.0 documenta famílias divergentes.
- **Recomendação:** adotar as três famílias self-hosted como stack oficial no
  DL v2.1, com fallbacks system-stack documentados como intencionais.

### 3.2 Cores de heading/acento — PREVALECE A IMPLEMENTAÇÃO (com condição)

- Real: cyan `#0369a1`, pink `#d91b7c`, gold `#b45309` em headings; gradientes
  de título restritos ao permitido pela decisão DS-001.
- **Recomendação:** ratificar como tokens semânticos nomeados
  (`--color-heading-accent-*`), **proibindo hex solto** em componentes.
  **Condição:** medir contraste AA dos três tons nos dois temas antes de
  ratificar — não assumir.

### 3.3 Raios / espaçamento / elevação — AUDITORIA TOKEN-A-TOKEN

- Divergências pontuais sem padrão claro.
- **Recomendação:** o Agente 03 produz tabela DL × implementação × uso real;
  por item decide: adota DL, adota implementação, ou depreca. Nenhuma mudança de
  valor nesta etapa — só decisão documental.

### 3.4 Componentes — `src/components/ui/` É A CAMADA ÚNICA

- `ui/` é o DS primário consumido pela maioria das features.
- Voice-hub `design-system/index.tsx` redefine 19 componentes com ARIA divergente
  — em `Input`, o voice-hub tem `aria-invalid`/`aria-describedby` **superiores**
  a `ui/Input`.
- **Recomendação:**
  1. `ui/` permanece a única camada de primitivos.
  2. **Promover para `ui/`** os padrões a11y superiores do voice-hub
     (`aria-invalid`, `aria-describedby`, semântica de Table, focus trap/Escape
     de Dialog) — nunca o contrário.
  3. Migrar consumidores do voice-hub incrementalmente (Onda 3+), sem big-bang;
     cada migração com axe + visual.
  4. Deprecar `design-system/index.tsx` só após migração completa.

### 3.5 Temas — FONTE ÚNICA OBRIGATÓRIA

- Hoje: 3 mecanismos — tokens `src/styles`, `src/contexts/ThemeContext.tsx` e
  ThemeContexts do voice-hub (2 arquivos).
- **Recomendação:** fonte única = `src/contexts/ThemeContext.tsx` + tokens
  `src/styles`; voice-hub consome o contexto raiz; deprecar os ThemeContexts
  locais na migração do DS.

### 3.6 Motion — FRONTEIRA DOCUMENTADA

- `src/lib/motion.ts` (Framer Motion) × tokens CSS de motion coexistem.
- **Recomendação:** tokens CSS para transições declarativas; `motion.ts` para
  orquestração. Proibir `transition`/`animation` ad-hoc em CSS de componente
  quando token existir.

### 3.7 Regras a ratificar como proibições

- Gradientes decorativos arbitrários (exceto título permitido por DS-001).
- `!important` fora de `src/features/landing/**` (área protegida — as ~772
  ocorrências históricas não são dívida acionável agora).
- Hex/rgb literal em componentes quando token semântico existir.
- `role="button"`/`role="dialog"` manuais sem teclado/focus trap equivalentes.

## 4. Entregável do Agente 03 + marca

1. DL v2.1 revisado aplicando as decisões acima (ou contra-proposta fundamentada
   item a item).
2. Tabela de reconciliação token-a-token (anexo).
3. Plano de deprecação do `design-system/` voice-hub com marcos.
4. Lista explícita: "o que muda no código" × "o que muda só no documento" —
   mudanças de código só após aprovação.

## 5. Bloqueios vigentes até aprovação

- Alteração de valor de token global (`src/styles/**`).
- Migração de componentes voice-hub → `ui/` em massa.
- Consolidação dos ThemeContexts.
- Itens da Onda 1 que dependem de tokens/tema (ver `17-RISK-DEPENDENCY-MATRIX.md`).
