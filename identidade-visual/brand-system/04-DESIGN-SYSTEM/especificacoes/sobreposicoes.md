# Especificação — Sobreposições — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Sobreposição (Overlays)
- **Propósito:** Especificar Dialog, Drawer, Modal, BottomSheet, DropdownMenu, Tooltip, Popover e CommandPalette.
- **Escopo:** `src/components/ui/{Dialog,Drawer,Modal,BottomSheet,DropdownMenu,Tooltip,CommandPalette,AIContextPopover,ToolTechPopover}.tsx`.
- **Estado da informação:** CONFIRMADO — arquivos lidos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** arquivos citados; `package.json` (`@radix-ui/react-dialog`, `vaul`, `@floating-ui/react` implícito via Tooltip).
- **Documentos relacionados:** `../componentes.md`, `feedback.md`, `navegacao.md`, `acoes.md`.

---

## 1. Matriz de sobreposições

| Componente | Base | Uso |
|---|---|---|
| `Dialog` | `@radix-ui/react-dialog` | modal central desktop |
| `Drawer` | `@radix-ui/react-dialog` (painel lateral) | painel lateral desktop |
| `Modal` | implementação própria simples | modal mínimo `{isOpen,onClose,title,children}` |
| `BottomSheet` | `vaul` (`Drawer.Root`) | folha inferior mobile-like com snap points |
| `DropdownMenu` | implementação própria | menu dropdown simples |
| `Tooltip` | `@floating-ui/react` + framer-motion | dica contextual |
| `Popover` | **não existe primitive genérico** | `AIContextPopover`/`ToolTechPopover` são de domínio |
| `CommandPalette` | implementação própria | command menu global |

## 2. Dialog — `ui/Dialog.tsx`

- `DialogProps extends ComponentPropsWithoutRef<DialogPrimitive.Root>` (linha 7).
- Exports (linhas 188-199): `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` — API padrão Radix.
- Header/Footer/Title/Description estilizados (detalhes visuais **NÃO VERIFICADO** — arquivo ~199 ln; padrão: overlay `bg-overlay`, content `rounded-modal` 20px presumido — confirmar).

## 3. Drawer — `ui/Drawer.tsx`

- `DrawerProps extends ComponentPropsWithoutRef<DialogPrimitive.Root>` (linha 108) — **também Radix Dialog**, não vaul.
- Painel lateral; contém `FOCUSABLE_SELECTOR` próprio para focus trap (comentário em `CommandPalette.tsx:49-51` cita "mesmo seletor/estratégia de trap de foco já usada em Drawer.tsx").
- Exports **NÃO VERIFICADO** (lista completa não lida).

## 4. Modal — `ui/Modal.tsx`

- Props (`ModalProps`, linhas 6-12): `{ isOpen: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }`.
- Implementação simples própria (`React.FC`) — **sem portal/focus-trap evidentes nas linhas lidas**; uso preferencial deve ser `Dialog` (Radix) — **[PROPOSTO]** tratar `Modal` como legado/deprecado a menos que haja consumidores dependentes (**NÃO VERIFICADO** contagem de usos).

## 5. BottomSheet — `ui/BottomSheet.tsx`

- Props (`BottomSheetProps`, linhas 15-25): `{ open, onOpenChange, title?, description?, children, snapPoints? = [0.85], defaultSnapPoint? = 0.85 }` — snap points em fração da viewport.
- Base: `vaul` (`Drawer.Root/Portal/Overlay/Content/Title/Description`, linhas 37-84); overlay `fixed inset-0 z-40 bg-black/50 backdrop-blur-sm`; comentário: "deslizável nativo-like, mantendo o Drawer.tsx existente para desktop" (linhas 5-6) — **regra: mobile → BottomSheet, desktop → Drawer/Dialog**.

## 6. DropdownMenu — `ui/DropdownMenu.tsx`

- Props (`DropdownMenuProps`, linhas 4-7): `{ triggerLabel: string; items: Array<{ label: string; onClick: () => void }> }`.
- Implementação própria com `useState` (não Radix); `aria-haspopup`/`aria-expanded`/`aria-controls` presentes (linhas 15-21); **estilo base `bg-slate-800 text-white` hardcoded** — diverge dos tokens (dívida visual; slate-800 não é token da marca).

## 7. Tooltip — `ui/Tooltip.tsx`

- Props (`TooltipProps`, linhas 26-33): `{ content: ReactNode; children: ReactElement; placement?: Placement (default 'top'); delay?: number (default 200); className?; disabled? }`.
- `@floating-ui/react` para posicionamento + framer-motion para animação; `useId` para `aria-describedby`; `disabled` desativa.

## 8. Popover

- **Não existe** `Popover.tsx` genérico em `ui/`. Existem `AIContextPopover.tsx` e `ToolTechPopover.tsx` — popovers de domínio (IA/ferramentas), não reutilizáveis como primitive. **Lacuna do DS** — [PROPOSTO] extrair primitive se houver 3+ usos.

## 9. CommandPalette — `ui/CommandPalette.tsx`

- Sobreposição global de comando (ver `acoes.md` §6): Ctrl/⌘+K, evento `birthhub360:open-command-palette`, grupos de resultado, trap de foco próprio, busca em empresas/decisores via API.
- Não é "menu suspenso" — é palette de comando; tratar em ações E sobreposições.

## 10. Foco, teclado e camadas

- Overlays devem prender foco e fechar com Escape — confirmado em `MobileNavDrawer`, `CommandPalette`; presumido nos Radix (`Dialog`/`Drawer`/`BottomSheet` herdam do primitive).
- z-index: drawer mobile `z-40`, floating chat `z-[999]`, toaster `z-[100]` — **sem escala tokenizada** (ver `foundations.md` §9).
- `prefers-reduced-motion` desativa animações de entrada/saída globalmente.

## 11. Regras

1. Novo overlay: preferir `Dialog`/`Drawer` (Radix, acessíveis) ou `BottomSheet` (vaul) conforme viewport; evitar `Modal`/`DropdownMenu` simples para fluxos novos até revisão.
2. Todo overlay: `aria` correto, Escape, focus trap, backdrop clicável quando modal.
3. Não criar segundo sistema de popover/menu — consolidar em primitive única **[PROPOSTO]**.
