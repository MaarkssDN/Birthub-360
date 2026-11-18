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

## Resolução (Agente 08, 2026-11-18)

- **Implementado:** Em `tests/unit/components/ui/CommandPalette.test.tsx`, o helper `renderPalette` foi atualizado para aceitar `initialEntries = ['/']`.
- **Casos de teste adicionados:**
  1. `/app/crm`: exibe grupo "Nesta página" com "Nova oportunidade", "Ir para contatos", e navegação via clique em "Ir para empresas" (`/app/companies`).
  2. `/app/companies`: exibe "Nesta página" e navega para `/app/contacts`.
  3. `/app/activities`: exibe "Nesta página" e aciona "Criar nova atividade" com intent `open-create`.
  4. `/app/settings`: exibe "Nesta página" com "Voltar ao dashboard" e "Abrir integrações" (`/app/integrations`).
  5. `/app/usage` (rota protegida): exibe no grupo "Nesta página" estritamente a ação segura "Voltar ao dashboard".
  6. `/app/knowledge` (rota não mapeada): não exibe o grupo "Nesta página".
- **Evidência:**
  - `npx vitest run tests/unit/components/ui/CommandPalette.test.tsx` → 13/13 testes aprovados.
- **Status:** resolvido.
