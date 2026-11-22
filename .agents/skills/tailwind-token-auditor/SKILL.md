---
name: tailwind-token-auditor
description: Governança do Tailwind CSS v4 (@tailwindcss/vite e @theme em src/styles/globals.css) no Birth Hub 360. Audita classes arbitrárias, proíbe aliases legados em componentes novos e exige os tokens semânticos canônicos do projeto.
---

# Tailwind Token Auditor — Birth Hub 360

## Objetivo
Garantir fidelidade ao Design System no Tailwind CSS v4 (configurado via `@theme` em `src/styles/globals.css`, sem arquivo `tailwind.config.js`) e impedir o uso de classes arbitrárias (`w-[340px]`, `text-[#0a192f]`) ou tokens legados depreciados.

## Quando Usar
- Ao criar ou revisar componentes React em `src/components/`, `src/pages/` ou `src/features/`.
- Em revisões visuais do Agente 03 (Design e Acessibilidade) e Agente 24 (Revisão Independente).

## Regras Obrigatórias
1. **Tokens Semânticos Canônicos (`src/styles/globals.css`):**
   - Superfícies: `bg-bg`, `bg-surface`, `bg-surface-2`
   - Tipografia: `text-ink`, `text-ink-2`
   - Marca e Destaque: `bg-brand`, `text-brand-ink`
   - Bordas e Inputs: `border-line`, `border-input`
2. **Proibição de Aliases Legados em Componentes Novos (`A03-P2-07` em `src/styles/globals.css:668-676`):**
   - **Não utilizar** `bg-background`, `text-foreground`, `bg-primary`, `border-border` ou `text-muted-foreground` em componentes novos. Esses nomes existem apenas para compatibilidade legada ou não fazem parte do `@theme`.
3. **Sem Dimensões Mágicas ou Hexadecimais Hardcoded:**
   - Evite colchetes arbitrários (`w-[273px]`, `bg-[#123456]`). Use a escala do tema e layouts flexíveis (`flex-1`, `w-full`).
4. **Suporte Dual a Temas (Light/Dark):**
   - Nunca declare `bg-white` ou `text-black` em superfícies que alternam entre Light e Dark mode.

## Checklist de Verificação
- [ ] O componente usa exclusivamente os tokens canônicos (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-ink-2`, `border-line`)?
- [ ] Nenhum componente novo foi criado sobre os aliases legados proibidos em `src/styles/globals.css:668-676`?
- [ ] O contraste de cores atende ao WCAG AA mínimo (4.5:1 para texto normal) em Light e Dark mode?
