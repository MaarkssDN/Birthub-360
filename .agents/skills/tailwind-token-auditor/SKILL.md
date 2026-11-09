---
name: tailwind-token-auditor
description: Governança do Tailwind CSS no Birth Hub 360. Audita classes arbitrárias (ex: w-[342px], bg-[#123456]), força variáveis semânticas do tema (Light/Dark mode) e garante consistência com o Design System shadcn/Radix.
---

# Tailwind Token Auditor — Birth Hub 360

## Objetivo
Garantir fidelidade ao Design System e impedir o uso caótico de classes arbitrárias no Tailwind (`w-[340px]`, `text-[#0a192f]`, `p-[13px]`) que quebram temas Light/Dark e consistência visual.

## Quando Usar
- Ao criar ou revisar componentes React no diretório `src/components/`, `src/pages/` ou `src/features/`.
- Antes de submeter PRs que envolvam layout, tipografia, espaçamentos ou cores.
- Em revisões visuais do Agente 03 (Design e Acessibilidade) e Agente 24 (Revisão Independente).

## Regras Obrigatórias
1. **Sem Hexadecimais Hardcoded:** Cores devem usar tokens semânticos (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`).
2. **Sem Dimensões Mágicas:** Evite `w-[273px]` ou `h-[59px]`. Utilize a escala padrão (`w-64`, `w-72`, `max-w-md`, etc.) ou classes de layout flexível (`flex-1`, `w-full`).
3. **Suporte Dual a Temas:** Nunca declare `bg-white` ou `text-black` diretamente em superfícies que precisam alternar para dark mode. Use as variáveis configuradas em `globals.css` / `tailwind.config.js`.
4. **Alinhamento com Radix / shadcn:** Preserve a semântica de estados (`data-[state=open]`, `focus-visible:ring-2`, `disabled:opacity-50`).

## Checklist de Verificação
- [ ] O componente funciona visualmente tanto em tema Claro quanto Escuro?
- [ ] Foram eliminadas classes com colchetes arbitrários desnecessários?
- [ ] O contraste de cores segue o padrão WCAG AA mínimo (4.5:1 para texto normal)?
- [ ] Os estados de foco (`focus-visible`) e hover usam tokens padronizados?
