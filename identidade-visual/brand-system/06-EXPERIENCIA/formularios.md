# Formulários

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** documentar os padrões de formulário do produto: stack, primitivos, validação, estados de erro e acessibilidade.
- **Escopo:** `src/components/ui/{Input,Textarea,Select,CyberInput,Label,Button}.tsx`, formulários em `src/features/`, `src/i18n/`.
- **Estado da informação:** CONFIRMADO em 2026-11-19; onde a adoção é parcial, marcado.
- **Fontes:** arquivos citados inline + auditoria `.agents/runs/audit-2026-11-18/ux-completude.md`.
- **Relacionados:** `feedback.md`, `acessibilidade.md`, `navegacao.md`.

---

## 1. Stack de formulários

- **Validação de schema:** `zod` amplamente adotado (108 arquivos em `src/features` referenciam zod/zodResolver).
- **Form state:** `react-hook-form` (`useForm`) presente em **7 formulários de feature**: `CompanyForm.tsx`, `ContactForm.tsx`, `PropostaForm.tsx` (crm360), `DsrRequestForm.tsx` (lgpd), `ObjectionItemForm.tsx`, `QualificationItemForm.tsx` (playbook), `MemoryGovernancePanel.tsx` (settings). **A maioria dos formulários do produto não usa RHF** — usa estado local + validação manual/zod avulsa (**PARCIALMENTE IMPLEMENTADO** como padrão; não há RHF global).
- **Primitivos de campo:** `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `CyberInput.tsx`, `Label.tsx` em `src/components/ui/`.

## 2. Primitivo `Input`

`src/components/ui/Input.tsx`:

- Props: `variant`, `inputSize`, `error?: boolean` (linhas 34-38).
- Estado de erro visual: `border-danger focus-visible:ring-danger` (linha 44).
- Acessibilidade: `aria-invalid={error || props['aria-invalid'] || undefined}` (linha 49).
- Aceita `asChild`/ref via `forwardRef`.

`CyberInput.tsx` é a variante "cyber" com motion (`useReducedMotion` na linha 35) — usada em contextos de destaque, não como campo padrão de formulário denso.

## 3. Padrões observados

| Padrão | Evidência |
|---|---|
| Rótulo explícito `htmlFor`↔`id` | Relatório de auditoria `docs/audits/prontidao-producao-20261017/08-relatorio-frontend-ux-acessibilidade-pwa.md` §2.2 |
| Erro inline com `aria-invalid` | `Input.tsx:49`; `aria-invalid` também em `DsrRequestForm.tsx`, `MemoryGovernancePanel.tsx`, `Landing360.tsx` |
| Submit com loading | `Button.tsx` prop `loading` + `ConfirmDialog`/forms aguardam resposta (auditoria ux-completude: "forms aguardam resposta") |
| Formulários críticos chamam API real com error handling | Company, Contact, Proposta, Cadência, Knowledge, PillarSettings (ux-completude "Saudável") |
| i18n de formulários | só `setup.*`/`firstSteps.*`/`common.*` (~60 strings, `src/i18n/index.tsx`); labels de feature forms são hardcoded pt-BR |

## 4. Estados obrigatórios (conexão com feedback)

Todo formulário operacional deve cobrir os 4 estados do módulo (DESIGN.md cap.5 / `OperationalStateContainer`): **Loading** (Skeleton no submit), **Empty** (após submit/reset), **Error** (mensagem inline + retry), **Stale** (timestamp quando aplicável). Ver `feedback.md`.

## 5. Autofill e browsers

- `autocomplete` nativo depende do `type`/`name` dos inputs — **não há wrapper de autofill dedicado** encontrado (**NÃO VERIFICADO** cobertura por formulário).
- Capacitor/Android: WebView herda comportamento de autofill do Android WebView; sem configuração específica encontrada.

## 6. Dívidas conhecidas (auditoria 2026-11-18)

- **UX-11:** deep link `?lead=<id>` inválido fecha drawer com toast genérico que não distingue "não existe" de falha de rede (`LeadDetailDrawer.tsx:184-187`).
- **UX-09:** perfil é somente leitura — sem edição de nome/senha/avatar na UI (`Settings.tsx:197-232`).
- **UX-01:** não existe criação manual de lead/oportunidade na UI — gap de formulário/fluxo, não de primitivo.
- **UX-08:** 3 de 4 abas de settings de pilar são placeholders não persistidos (`PillarSettingsPlaceholder.tsx`).

## 7. Regras **[PROPOSTO]** para novos formulários

1. Preferir `react-hook-form` + `zod` para formulários novos com ≥3 campos ou validação assíncrona (alinha com os 7 existentes).
2. Sempre propagar `error`/`aria-invalid` + `aria-describedby` apontando para a mensagem de erro.
3. Submit desabilita durante request e exibe estado `loading` no `Button`.
4. Nunca exibir erro de API como empty state (lição UX-03).
5. Labels em pt-BR; registrar strings novas em `src/i18n/index.tsx` se forem compartilhadas setup/firstSteps/common.
