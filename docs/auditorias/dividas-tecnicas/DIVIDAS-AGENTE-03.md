# Relatório de Auditoria de Dívidas Técnicas — Agente 03

## IDENTIFICAÇÃO
- **ID do agente:** 03
- **Nome oficial:** Design e Acessibilidade (Design System & A11y Specialist)
- **Especialização:** Sistema de design compartilhado, tokens semânticos Tailwind/CSS, acessibilidade web WCAG 2.2 nível AA, navegação por teclado e leitores de tela, conformidade de contraste e motion design sem distração (`prefers-reduced-motion`)
- **Responsabilidades:** Governança dos componentes de UI compartilhados em `src/components/ui/**`, padronização visual, conformidade com a identidade de marca única Birth Hub 360°, auditoria automatizada de acessibilidade (axe-core, jsx-a11y, Biome a11y) e regressão visual no Playwright.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/styles/**`, `src/components/ui/**`, `src/components/brand/**`, componentes com alertas de linter no Biome, `playwright.visual.config.ts`.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Design system, tokens de tema (light/dark), componentes base (`Button`, `Card`, `Modal`, `Dialog`, `Input`, `ButtonGroup`), tipografia e ícones institucionais.
- **Arquivos relevantes:**
  - `src/styles/globals.css` (tokens de cores, gradientes e resets)
  - `src/styles/official-identity.css`
  - `src/components/ui/ButtonGroup.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/brand/title-icons/flowIcons.tsx`
  - `src/features/auth/components/NewLoginScreen.css`
  - `playwright.visual.config.ts`
- **Serviços existentes:** Gerenciador de temas (`useTheme`), classes utilitárias de contraste seguro WCAG AA, helpers de redução de movimento (`src/lib/motion.ts`).
- **APIs e integrações:** Tailwind CSS v3, Radix UI Primitives, Lucide Icons, Framer Motion.
- **Funcionalidades implementadas:** Alternância de modo claro/escuro, paleta de luxo corporativo com tokens semânticos, catálogo de 30 componentes auditados, suporte a navegação por teclado (tab index, focus visible).
- **Testes encontrados:** `tests/visual/landing.visual.spec.ts`, `tests/visual/crm.visual.spec.ts`, verificações de contraste no Playwright via axe-core.
- **Dependências externas:** `tailwindcss`, `@radix-ui/react-*`, `framer-motion`, `@axe-core/playwright`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-03-001
- **Título:** Proliferação de declarações !important em folhas de estilo quebrando a cascata CSS e tokens de tema
- **Categoria:** Design System e Qualidade de Código
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/auth/components/NewLoginScreen.css` (linhas 27-40), `src/styles/globals.css` (linhas 1037-1092), `src/styles/official-identity.css` (linha 473)
- **Evidência:** O linter oficial do projeto (Biome) reporta dezenas de avisos `lint/complexity/noImportantStyles` (ex.: `color: #ffffff !important;`, `background: var(--color-brand-primary) !important;`, `color: var(--subtitle-color-default) !important;`).
- **Problema:** A utilização generalizada de `!important` para forçar cores de texto e botões sobrepõe regras de especificidade do CSS, impedindo a herança limpa de classes do Tailwind e causando defeitos visuais quando o usuário alterna entre modo claro e escuro.
- **Causa raiz:** Correções emergenciais de contraste em auditorias de WCAG aplicadas via `!important` direto no CSS global em vez de calibração dos tokens semânticos na camada de utility classes.
- **Impacto:** Dificuldade extrema em manter a consistência visual em novos módulos; quebras inesperadas de layout ao customizar componentes; manutenção frágil e propensa a regressões.
- **Correção necessária:** Remover todas as diretivas `!important` não essenciais, refatorar a especificidade dos seletores em `globals.css` e padronizar o uso exclusivo de tokens semânticos do Tailwind (`text-foreground`, `text-muted-foreground`, `bg-brand-primary`).
- **Agente proprietário:** 03
- **Agentes dependentes:** 02 (UX de telas afetadas), 08 (Testes visuais)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** 0 ocorrências de `!important` em componentes de UI e telas de autenticação; Biome lint executa sem warnings em `src/styles/` e `NewLoginScreen.css`.
- **Teste necessário:** `npx @biomejs/biome lint src` com 0 violações de `noImportantStyles` e suíte de regressão visual aprovada em light e dark mode.
- **Dependências:** Nenhuma.

### ID: DIV-03-002
- **Título:** Elementos de navegação em grupo (ButtonGroup) sem semântica acessível e sem rótulo para leitores de tela
- **Categoria:** Acessibilidade (A11y)
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/components/ui/ButtonGroup.tsx` (linhas 36-42)
- **Evidência:** O componente renderiza `<div role="group" className="...">` sem fornecer `aria-label`, `aria-labelledby` e sem permitir substituição por elemento semântico nativo `<fieldset>`. O Biome acusa o diagnóstico `lint/a11y/useSemanticElements`.
- **Problema:** Leitores de tela (ex.: NVDA, VoiceOver, TalkBack) identificam o grupo de botões de forma genérica sem contextualizar a finalidade do agrupamento (ex.: "Filtro de período" ou "Seleção de visualização").
- **Causa raiz:** O componente foi desenvolvido priorizando estilização visual com bordas arredondadas sem inclusão das propriedades acessíveis obrigatórias do padrão WAI-ARIA.
- **Impacto:** Violação de critérios WCAG 2.2 AA (Critério 1.3.1 Info and Relationships e 4.1.2 Name, Role, Value); perda de acessibilidade para usuários com deficiência visual.
- **Correção necessária:** Adicionar propriedade obrigatória `aria-label` ou `aria-labelledby` nas props de `ButtonGroup`, e oferecer opção de renderização como `<fieldset>` com `<legend className="sr-only">`.
- **Agente proprietário:** 03
- **Agentes dependentes:** 08 (QA e Testes de A11y)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Verificação no Biome e no axe-core comprova que todo `ButtonGroup` instanciado possui identificador semântico acessível válido.
- **Teste necessário:** Teste unitário de acessibilidade com `axe-core` em `ButtonGroup.test.tsx`.
- **Dependências:** Nenhuma.

### ID: DIV-03-003
- **Título:** SVGs e ícones com cores hexadecimais fixas (hardcoded) e parâmetros inoperantes
- **Categoria:** Design System e Manutenibilidade
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `src/components/brand/title-icons/flowIcons.tsx` (linha 268)
- **Evidência:** No componente `FlowSectionIcon`, o parâmetro `color = '#F59E0B'` é declarado na assinatura da função, mas não é utilizado no corpo do JSX (`noUnusedFunctionParameters`). A cor amarela está hardcoded internamente nos elementos `<path>`.
- **Problema:** O desenvolvedor passa uma propriedade de cor customizada para o ícone, mas a cor nunca é aplicada na tela, quebrando a consistência cromática planejada.
- **Causa raiz:** Refatoração de exportação de SVG incompleta onde propriedades herdadas não foram propagadas para as tags `<path stroke={color}>`.
- **Impacto:** Inconsistência visual em cabeçalhos de fluxo de automação e impossibilidade de controlar cores de ícones dinamicamente via tokens de tema.
- **Correção necessária:** Propagar o parâmetro `color` para os atributos de preenchimento/contorno do SVG (`stroke={color || 'currentColor'}`).
- **Agente proprietário:** 03
- **Agentes dependentes:** Nenhum
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Passagem de prop `color` reflete corretamente na cor renderizada do SVG no DOM.
- **Teste necessário:** Teste de snapshot e inspeção de atributos SVG no componente.
- **Dependências:** Nenhuma.

### ID: DIV-03-004
- **Título:** Instabilidade e tolerância frouxa em testes de regressão visual devido a fontes do sistema operacional
- **Categoria:** Qualidade e Design Visual
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `playwright.visual.config.ts`, `tests/visual/**`
- **Evidência:** O arquivo de configuração do Playwright Visual possui limiares de tolerância aumentados (`maxDiffPixelRatio: 0.05` ou superior) para evitar falsos positivos provocados pela diferença de renderização de fontes entre o host local (Windows) e o ambiente de CI (Linux).
- **Problema:** Uma tolerância visual ampla mascara pequenas regressões reais de layout (deslocamento de botões, quebras de linha em cards de CRM, espaçamentos indevidos).
- **Causa raiz:** As fontes institucionais não estão totalmente embutidas localmente via WOFF2 com font-display estável, dependendo de fallbacks do sistema operacional.
- **Impacto:** Regressões visuais passam desapercebidas para a branch principal, degradando o acabamento visual do produto.
- **Correção necessária:** Embutir fontes canônicas em formato WOFF2 local em `public/fonts/` e configurar o Playwright Visual para executar em container Docker padronizado (`mcr.microsoft.com/playwright`).
- **Agente proprietário:** 03
- **Agentes dependentes:** 08 (QA e Testes), 14 (Harness de Testes)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Tolerância de pixel nos testes visuais reduzida para `maxDiffPixelRatio: 0.01` com 100% de estabilidade entre ambientes.
- **Teste necessário:** Execução de `npm run test:visual` em máquina Windows e no container Linux com resultados de snapshot idênticos.
- **Dependências:** Alinhamento com Agente 14.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (catálogo abrangente com mais de 30 componentes de UI padronizados).
- **Cobertura automatizada de testes:** Alta (Playwright Visual e verificações axe-core integradas no pipeline).
- **Segurança:** Alta (sem vulnerabilidades conhecidas na camada de apresentação visual).
- **Arquitetura:** Média (degradada pelo acúmulo de `!important` e estilos embutidos fora do Tailwind).
- **Confiabilidade:** Alta (componentes testados contra colapsos de layout e overflow).
- **Observabilidade:** Alta (relatórios de regressão visual com diff de imagem gerados pelo Playwright).
- **Manutenibilidade:** Média (regras CSS conflitantes aumentam o tempo de ajuste de estilos).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado.
2. **Segurança e integridade de dados:** Não aplicável diretamente ao domínio de UI/CSS.
3. **Falhas funcionais:** Corrigir a propagação de parâmetros de cores em ícones institucionais (DIV-03-003).
4. **Confiabilidade:** Padronizar renderização de fontes em ambiente isolado para o Playwright Visual.
5. **Testes:** Tornar obrigatória a validação axe-core em todos os testes unitários de componentes UI.
6. **Arquitetura:** Eliminar o uso de `!important` em `globals.css` e nos componentes de autenticação.
7. **Melhorias estruturais:** Adicionar documentação interativa dos componentes com Storybook.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-03-001, DIV-03-002, DIV-03-003)
- **Problemas compartilhados:** 1 (DIV-03-004 com 08 e 14)
- **Handoffs necessários:**
  - Handoff para 14: Padronização do container de execução do Playwright Visual.
- **Riscos mais importantes:** O uso de `!important` no CSS compromete a escalabilidade do sistema de design e dificulta a introdução de novos temas; falta de semântica no `ButtonGroup` prejudica a acessibilidade.
- **Recomendação final:** Sanear as regras CSS de alta especificidade e atualizar o componente `ButtonGroup` para atender integralmente ao WCAG 2.2 AA.
