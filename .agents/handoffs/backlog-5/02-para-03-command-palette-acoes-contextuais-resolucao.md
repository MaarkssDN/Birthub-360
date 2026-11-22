# Resolução — handoff 02→03 "command-palette-acoes-contextuais" (MEL-35)

De: Agente 03 — Design e Acessibilidade
Para: Agente 02 — Produto e UX (cópia: Agente 00)
Onda: Backlog Onda 5 / DEM-20261116-001
Status: resolvido
Prioridade: alto
Bloqueador-ref: MEL-35
Sprint destino: backlog-5

## Resolução

Implementado em `src/components/ui/CommandPalette.tsx` (branch `agente/03-backlog5-a11y`):

- Novo grupo `'Nesta página'` no union de `ResultItem.group`, posicionado após `'Ações rápidas'` e antes de `'Navegar'`.
- Rota ativa derivada por `deriveActiveTabFromPath(pathname)` (mesmo helper do MainLayout, cobre `/app/settings/pillars/<slug>`) + `NAV_TAB_ALIASES` (`dialer`→`cadence`).
- Ações implementadas:
  - `crm`: Nova oportunidade (`open-create`), Ir para empresas, Ir para contatos.
  - `companies`: Nova empresa (`open-create`), Ir para contatos.
  - `contacts`: Novo contato (`open-create`), Ir para empresas.
  - `activities`: Criar nova atividade (`open-create`).
  - `dashboard`/`analytics`: Abrir Relatórios, Buscar mercado (`market-intelligence`).
  - `settings`: Voltar ao dashboard, Abrir integrações.
  - `mesa-tratamento`/`forecast`/`metas`/`team`/`module-access`/`usage`: somente "Voltar ao dashboard" — páginas já gated por `RequireRole`; como o grupo só aparece quando o usuário está na rota, o gate já foi aplicado, e nenhuma ação de módulo é oferecida (decisão documentada em comentário no código).
- Filtro por query (`normalize`) aplicado aos itens contextuais; teclado/foco/Escape inalterados; zero cores cruas novas (reusa tokens `bg-surface`/`text-ink`/`ring-brand` já existentes).

## Ressalva registrada (handoff 03→04)

`CrmBoard` não consome `PaletteIntent`/`location.state` — "Nova oportunidade" em `/app/crm` é no-op hoje (mesmo comportamento da quick action global pré-existente). Abri `.agents/handoffs/backlog-5/03-para-04-analytics-contraste-temas.md` seção 3 para o Agente 04 decidir entre consumir o intent ou pedir remoção da ação contextual.

## Teste

Teste unitário sugerido em `.agents/handoffs/backlog-5/03-para-08-teste-command-palette-contextual.md` (tests/** é propriedade do Agente 08).
