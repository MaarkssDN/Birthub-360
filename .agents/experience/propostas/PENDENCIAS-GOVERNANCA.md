# Propostas de governança — STATUS: TODAS APLICADAS

> **Atualização 2026-11-18:** o usuário aprovou a aplicação de todas as
> propostas ("todas"). Os itens abaixo registram o que foi efetivamente
> alterado. Arquivos protegidos só foram modificados após autorização
> explícita, conforme AGENTS.md §5 e §40.

## P-01 — ✅ APLICADO — Prompts oficiais dos 4 perfis do Agente 02

Criados em `.agents/prompts/`:

| Arquivo oficial | Origem |
|---|---|
| `02A-ux-research-usability.md` | `PROMPT-02A-ux-research-usability.md` |
| `02B-customer-journey-flows.md` | `PROMPT-02B-customer-journey-flows.md` |
| `02C-information-architecture.md` | `PROMPT-02C-information-architecture.md` |
| `02D-landing-conversion.md` | `PROMPT-02D-landing-conversion.md` |

Adaptações na promoção: cabeçalho de status alterado de "PROPOSTA" para
especialista oficial aprovado; referência `inventario-mestre.md` do 02B
corrigida para o caminho completo
`/.agents/runs/audit-2026-11-18/inventario-mestre.md`.

Nomenclatura adotada: sufixo de letra (02A–02D), mesmo padrão de
`01A`/`06A` — mantém o número oficial do agente e deixa explícito que são
especialistas internos do mesmo slot. **Não** usa 19/20 (reservados).

## P-02 — ✅ APLICADO — Roster e slots no `AGENTS.md`

- §3: adicionados `02A`, `02B`, `02C`, `02D` sob `02 — Produto e UX`, cada um
  com a cláusula padrão de especialista do mesmo slot.
- §14: adicionada a linha `02 ↔ 02A/02B/02C/02D quando houver sobreposição
  de propriedade`.

## P-03 — ✅ APLICADO — Propriedade de landing no `AGENTS.md` §15

Acrescentado ao bloco de código:

```
src/features/landing/**
→ Agente 02
```

Ressalvas em prosa logo após o bloco (o parser do
`verify:ownership-coverage` exige dono em linha única): perfil 02D para
conversão, camada visual compartilhada segue do Agente 03, e exceção
`/landing-new` → `LandingInnovative` em `src/features/voice-hub/` →
Agente 12.

Manifesto `scripts/governance/ownership-coverage.manifest.json` recebeu a
entrada correspondente (`coverage: "review"` — proteção via revisão de
diff; o depcruise não modela propriedade de arquivo). Gate
`npm run verify:ownership-coverage` verde (19/19 escopos).

## P-04 — ✅ APLICADO — Seção em `COMO-CHAMAR-OS-AGENTES.md`

Adicionada a seção "Perfis de Experiência do Agente 02 (02A a 02D)" ao final
do arquivo, com um bloco `text` pronto para colar por perfil, no formato das
seções existentes (incluindo o enxame 03A–03G).

## P-05 — ✅ APLICADO — `AGENTS.md` local de `src/features/landing/`

Criado `src/features/landing/AGENTS.md` declarando:

- Dono: Agente 02 (perfil 02D para conversão);
- Pode alterar: páginas/componentes de landing, rotas públicas de captura,
  copy de proposta de valor — mediante missão e gates;
- Não pode: camada visual compartilhada (03), ativos de marca (11),
  `/landing-new` (12), schema (01), contrato de API (18);
- Landing/Login são superfícies protegidas: mudança visível exige
  autorização humana explícita;
- Gate mínimo: `npx tsc --noEmit`, `npm run lint`, testes do domínio,
  `npm run build`.

## P-06 — ✅ CONFIRMADO — Enxame 03A–03G: nenhuma mudança necessária

O domínio do Agente 03 já possui os 7 especialistas homologados com prompts,
constituição, skills e seção em `COMO-CHAMAR-OS-AGENTES.md`. A missão pedia
03-UI/03-DS/03-FE/03-A11Y/03-MOTION — todos mapeados para equivalentes
existentes (ver `02-arquitetura.md` §2). Nenhuma ação.

## Pendência residual identificada na aplicação

- `.agents/experience/**` não tem dono declarado no AGENTS.md §15 (criado
  nesta missão como pacote documental do Agente 00). Registrar
  `.agents/experience/** → Agente 00` no §15 + manifesto fica como
  **proposta futura** — não foi incluída nas P-01…P-06 aprovadas.
