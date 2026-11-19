# Guia para Agentes de IA e Checklist

Estado: PROPOSTO (regras novas) apoiado em fatos CONFIRMADOS citados.

## Ordem de precedência

1. `AGENTS.md` (global e local da pasta) → 2. tokens em `identidade-visual/birthhub360/tokens/` → 3. este brand-system (após aprovação) → 4. `DESIGN.md`/`PRODUCT.md` → 5. código existente → 6. protótipos HTML/Desktop (histórico).

## Regras de consumo

- Nunca editar `identidade-visual/**`, Landing ou Login; propor via handoff.
- Nunca hex literal: usar `var(--color-*)` ou classes de token.
- Reutilizar componentes de `src/components/ui/` antes de criar; não criar sexta variante de botão.
- Toda tela: 4 estados; zero mock; textos em PT-BR.
- Animação: apenas tokens de [motion](../05-MOTION/manual-de-animacoes.md); respeitar reduced motion.

## UX writing

PROPOSTO (sem fonte aprovada lida): imperativo curto em CTAs ("Salvar lead", "Tentar novamente"); erro = o que houve + o que fazer, sem culpar o usuário; vazio = por que está vazio + próxima ação; datas `dd/MM/yyyy`, moeda `R$ 1.482.000`; manter termos de produto (Playbook, Roleplay, Copiloto IA) consistentes com `moduleRegistry.ts`.

## Checklist de conformidade (por PR de UI)

- [ ] Sem cores fora dos tokens (`rg "#[0-9a-fA-F]{6}" <arquivos>`)
- [ ] Raios 12/16/20/pill conforme papel
- [ ] Claro e escuro verificados visualmente
- [ ] Loading/empty/error/stale presentes
- [ ] Foco visível; teclado completo; `aria-label` em ícone-only
- [ ] `prefers-reduced-motion` coberto
- [ ] Contraste AA medido
- [ ] Sem dado pessoal real em fixtures/prints (LGPD)
- [ ] `npx tsc --noEmit` e `npm run lint`
