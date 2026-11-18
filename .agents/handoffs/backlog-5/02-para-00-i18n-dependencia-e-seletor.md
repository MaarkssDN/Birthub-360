De: Agente 02 — Produto e UX
Para: Agente 00 — Coordenador
Onda: Backlog Onda 5 / DEM-20261116-001
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-36
Sprint destino: backlog-5

## Problema

MEL-36 pede preparar infraestrutura de i18n. `package.json`/lockfile exigem aprovação explícita do Agente 00 e nenhuma dependência de i18n (`i18next`, `react-i18next`, `next-intl` etc.) está instalada. O Agente 02 não pode adicionar dependência diretamente.

## Arquivo(s) envolvido(s)

- `package.json` e lockfile (dono: Agente 00 para alteração).
- Infraestrutura sem dependência já criada pelo Agente 02: `src/i18n/index.tsx` (`I18nProvider`, `useI18n`, `translate`, locale `pt-BR`/`en-US` persistido em `localStorage`).
- Consumidores iniciais: `src/App.tsx` (provider global), `src/features/onboarding/components/SetupWizard.tsx`, `src/features/onboarding/components/FirstStepsChecklist.tsx`.

## Evidência

- Busca no manifesto não confirmou pacote de i18n de aplicação.
- `src/i18n/index.tsx` implementa provider/contexto, fallback `pt-BR`, interpolação `{{var}}` e persistência de locale sem nova dependência.
- Cobertura atual é propositalmente pequena (setup + primeiros passos); não traduziu o app inteiro.

## Alteração necessária

Decidir se a base sem dependência é suficiente para o escopo atual ou se deve ser aprovada dependência real. Se aprovado, sugerência: `i18next` + `react-i18next` (ou equivalente já padronizado pelo time) para pluralização, namespaces, detecção de locale e interpolação rica; depois migrar `src/i18n` para wrapper compatível ou manter API `t()` estável.

Também é necessário um item de UX para seletor de idioma (hoje o locale é lido de `localStorage`/default `pt-BR`; não há UI de troca). Esse seletor deve ser desenhado com o Agente 03 e exposto em Settings/navigation conforme decisão de produto.

## Teste esperado

- Trocar locale persiste e componentes consumidores (`SetupWizard`, `FirstStepsChecklist`) renderizam `en-US`.
- Chaves ausentes caem em `pt-BR` sem quebrar.
- Se dependência for aprovada, rodar `npm install`, atualizar testes e garantir SSR/client consistentes.

## Contexto adicional

- Nenhuma dependência foi adicionada pelo Agente 02.
- A base criada evita bloquear MEL-36 e já permite adoção incremental por feature.

---

## Atualização e Resolução do Seletor (Agente 02 — 2026-11-18)

**Status do Seletor de UX:** RESOLVIDO na UI de Configurações.
**Status da Dependência Externa:** ABERTO para decisão do Agente 00 (`package.json`).

O componente seletor de idioma foi implementado em `src/features/settings/components/Settings.tsx` integrado ao `useI18n()`, permitindo alternância instantânea entre `Português (Brasil)` e `English (US)` com persistência em `localStorage` (`@birthhub360:locale`), acessibilidade com `role="group"` e `aria-pressed`, além de feedback sonoro `SoundFX.play('confirm')`.
Testes unitários adicionados em `tests/unit/features/settings/Settings.test.tsx` com 100% de aprovação.
A infraestrutura zero-dependency atual suporta os casos de uso existentes sem introduzir pacotes externos sem aprovação.
