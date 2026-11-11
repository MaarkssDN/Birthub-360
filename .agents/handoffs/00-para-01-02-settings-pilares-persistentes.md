# Handoff — Settings por pilar persistentes (Onda F1)

De: 00 — Coordenador
Para: 01 (endpoint/schema se preciso) + 02 (UI)
Onda: F1 (pós-navegação)
Status: em-andamento
Prioridade: alto
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §3.2, §6

## Problema

As 8 rotas `settings_<pillar>` (`/app/settings_hub`, `settings_market`,
`settings_sales`, `settings_performance`, `settings_predictability`,
`settings_ai`, `settings_automation`, `settings_engagement`) renderizam
`src/features/settings/components/PillarSettingsPlaceholder.tsx`, que usa
apenas `useState` local — **nenhuma chamada a API**: Salvar não persiste.

## Evidência

- `grep fetch|api|/api/|localStorage` no arquivo → zero ocorrências.
- Rotas em `src/App.tsx` L584–L612.

## Alteração necessária

1. Definir contrato de settings por organização/pilar (verificar se
   `/api/settings` ou `organization-modules` já cobre; estender se preciso
   via handoff 01→schema).
2. Substituir o placeholder por formulário real persistente por pilar,
   mantendo a identidade visual e os campos úteis já desenhados.
3. Não conceder permissão via configuração visual (regra do AGENTS.md de
   settings) — settings são preferências, RBAC permanece no backend.

## Teste esperado

- Unit: submit chama endpoint correto e reflete valor salvo.
- E2E: alterar setting de um pilar → reload → valor persistido.

## Fora de escopo

- Refatoração dos 49 hotspots; navegação modular (homologada).
