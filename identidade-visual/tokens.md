# Manual Canônico de Design Tokens — Birth Hub 360° (Tailwind CSS v4)

**Proprietário:** Agente 39 · Tina (Marca, Ativos e Documentação de Produto)  
**Governança de Componentes:** Agente 33 · Célia (`@tailwindcss/vite` + `@theme` em `src/styles/globals.css`)  
**Última Atualização:** 20/11/2026  

---

## 1. Arquitetura CSS-First no Tailwind v4
O Birth Hub 360° utiliza a diretiva `@theme` do Tailwind CSS v4 como fonte única de verdade para cores, tipografia, sombras e raios de borda. É estritamente proibido utilizar valores arbitrários (`bg-[#123456]`, `text-[13px]`) em novos componentes.

## 2. Tokens Semânticos de Superfície e Marca
| Token Semântico | Classe Tailwind Canônica | Uso Obrigatório |
| :--- | :--- | :--- |
| **Superfície Primária** | `bg-white dark:bg-slate-950` | Fundo principal do App Shell e páginas |
| **Superfície Elevada** | `bg-slate-50 dark:bg-slate-900` | Cards, painéis laterais e tabelas |
| **Ação Primária (Brand)** | `bg-indigo-600 hover:bg-indigo-500 text-white` | CTAs principais e botões de confirmação |
| **Feedback de Sucesso** | `text-emerald-600 dark:text-emerald-400` | Indicadores de gate verde e metas batidas |
| **Feedback de Alerta/Erro** | `text-red-600 dark:text-red-400` | Bloqueadores P0, erros de validação e alertas |

## 3. Acessibilidade e Motion (WCAG 2.2 AA)
- **Contraste mínimo:** 4.5:1 para texto normal e 3:1 para elementos gráficos e texto grande.
- **Foco visível:** Uso obrigatório de `focus-visible:ring-2` em todos os elementos interativos.
- **Reduced Motion:** Todo container animado respeita `<MotionConfig reducedMotion="user">`.
