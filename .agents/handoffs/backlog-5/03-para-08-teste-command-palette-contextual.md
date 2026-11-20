De: Agente 03 — Design e Acessibilidade
Para: Agente 08 — QA e Release
Onda: Backlog Onda 5 / DEM-20261116-001
Status: resolvido
Prioridade: normal
Bloqueador-ref: MEL-35
Sprint destino: backlog-5

## Problema

MEL-35 foi implementado em `src/components/ui/CommandPalette.tsx` (propriedade do Agente 03): novo grupo "Nesta página" derivado da rota ativa via `deriveActiveTabFromPath` + `NAV_TAB_ALIASES`. `tests/**` é propriedade do Agente 08, então o teste de regressão fica como pedido.

## Arquivo(s) envolvido(s)

- `tests/unit/components/ui/CommandPalette.test.tsx` (adicionar casos)

## Evidência

Comportamento esperado:
- Em `initialEntries={['/app/crm']}`: grupo "Nesta página" aparece com "Nova oportunidade" (navega `/app/crm` com `state:{type:'open-create'}`), "Ir para empresas", "Ir para contatos".
- Em `/app/companies`: "Nova empresa" + "Ir para contatos".
- Em `/app/activities`: "Criar nova atividade".
- Em `/app/settings`: "Voltar ao dashboard" + "Abrir integrações".
- Em `/app/usage` (ADMIN-only): somente "Voltar ao dashboard" — nenhuma ação de módulo.
- Em rota sem mapeamento (ex.: `/app/knowledge`): grupo "Nesta página" ausente.
- Filtro por texto continua valendo para itens contextuais; setas/Enter inalterados.

Sugestão de teste (o helper `renderPalette` precisará aceitar `initialEntries`):

```tsx
function renderPaletteAt(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CommandPalette />
    </MemoryRouter>,
  );
}

it('mostra ações contextuais da página em /app/crm', async () => {
  renderPaletteAt('/app/crm');
  openWithCtrlK();
  expect(screen.getByText('Nesta página')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Ir para empresas'));
  expect(navigateMock).toHaveBeenCalledWith('/app/companies', undefined);
});
```

Atenção: `useLocation` não é mockado no arquivo (só `useNavigate`), então `initialEntries` funciona direto.

## Alteração necessária

Adicionar os casos acima ao describe existente.

## Teste esperado

`npx vitest run tests/unit/components/ui/CommandPalette.test.tsx` verde.

## Contexto adicional

Ambiente local atual tem `node_modules` compartilhado (symlink para o repo principal) com pacote `cssstyle` corrompido — `vitest`/`eslint` falham com MODULE_NOT_FOUND antes de rodar testes. O Agente 03 validou o arquivo via `biome lint` (limpo) e `tsc` isolado (sem erros no arquivo). O 08 pode precisar reparar o install antes de executar.

## Resolução (verificação Agente 03 — 2026-11-19, waveD)

Os casos pedidos foram implementados pelo Agente 08 na branch `agente/08-handoffs-20261117`
(PR #386, aberto em 2026-11-19) em `tests/unit/components/ui/CommandPalette.test.tsx`
(~200 linhas): `renderPalette` passou a aceitar `initialEntries`, e o describe cobre
"Nesta página" em `/app/crm`, `/app/companies`, `/app/activities`, `/app/settings`,
`/app/usage` (somente "Voltar ao dashboard") e rota sem mapeamento (grupo ausente).

Ajuste de expectativa (decisão posterior, handoff `04-para-03-command-palette-open-create-crm.md`,
resolvido): "Nova oportunidade" **não** aparece em `/app/crm` — a ação era no-op e foi
removida pelo commit `3356c2e65`. O teste na branch do 08 já reflete isso
(`queryByText('Nova oportunidade')` → `not.toBeInTheDocument()`).

Pendente apenas o merge do PR #386 para `main`; nenhuma ação adicional do 03.
