# Backlog Priorizado e Gap Analysis

Estado: PROPOSTO. Nenhum item de código foi implementado nesta missão.

## Backlog

| ID | Prioridade | Item | Justificativa | Dono sugerido | Aprovação humana |
|---|---|---|---|---|---|
| B-01 | **P0** | Revisar/rotacionar o `.env` do Desktop (`Migracao-BirthHub-2026-10-10_rar__.env`) e impedir versionamento | Possível segredo exposto (AGENTS §24) | 15 | Não |
| B-02 | **P1** | Decidir cor primária/fundo/texto do tema claro e corrigir `DESIGN.md` (C-01..C-03) | Identidade contraditória entre doc e runtime | 03 + humano | Sim |
| B-03 | **P1** | Decidir status do lime `#D4F434` e migrar variantes de `Button` para tokens; adicionar CTA oficial | 55 usos fora da paleta; CTA do DESIGN.md inexistente | 03 | Sim |
| B-04 | **P1** | Eliminar/mapear hex fora de token (622 distintos; 29 componentes) | Consistência, tema claro/escuro | 03 | Parcial |
| B-05 | **P1** | Matriz módulo×estado (loading/empty/error/stale) com testes | Imperativo de produto não verificado | 08 + 22 | Não |
| B-06 | **P1** | Resolver C-10 (duas árvores `docs/brand-system`) antes do merge | Fonte única da verdade | 00 | **Sim** |
| B-07 | P2 | Unificar tokens de motion CSS×TS e remover aliases idênticos | C-07 | 03 | Não |
| B-08 | P2 | Ler integralmente: HTML/MD do Desktop (`v2/*`, auditorias a11y), `globals.css @theme`, `@font-face`, Sidebar/CommandPalette | Cobertura incompleta | 11/03 | Não |
| B-09 | P2 | Capturas visuais (app + Playwright) claro/escuro, desktop/mobile | Nada foi observado visualmente | 08 + 14 | Não |
| B-10 | P2 | Consolidar duplicados `Modal/Dialog/ConfirmDialog`, `EmptyState/BlockedState/VisualState` | Redução de variantes | 03 | Não |
| B-11 | P2 | Adicionar logos dark/light/favicon ao repo de identidade; documentar área de proteção e mínimos | Lacunas de marca | 11 | Sim |
| B-12 | P2 | Alinhar nomenclatura `PRODUCT.md` × `moduleRegistry.ts` (C-08) | Naming de produto | 02 | Sim |
| B-13 | P3 | Gerar tokens no formato DTCG | Interoperabilidade | 03 | Não |
| B-14 | P3 | Formalizar/validar a hipótese de "100 agentes" (C-12) | Não encontrado | 13 | Não |

## Gap analysis (resumo)

| Área | Existe | Falta |
|---|---|---|
| Tokens | cor, fonte, raio, sombra, motion | escala de espaço, breakpoints, z-index, DTCG |
| Componentes | 130 arquivos | specs por componente, stories (4/130), testes (7/130) |
| Motion | variants + `MotionConfig user` | padrões de modal/tab/skeleton/toast |
| Marca | logos, tokens, 29 personagens | missão/valores aprovados, regras de uso do logo, imagery |
| UX | rotas e módulos mapeados | jornadas ponta a ponta, erros por fluxo, mapa de estados |
