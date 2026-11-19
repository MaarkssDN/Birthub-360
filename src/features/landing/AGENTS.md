# AGENTS.md — Landing Pages e Conversão

## Dono

Agente 02 — Produto e UX (perfil 02D para auditoria de conversão;
ver `.agents/prompts/02D-landing-conversion.md`)

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- páginas e componentes de landing, rotas públicas de captura, copy de
  proposta de valor — mediante missão e gates.

## Não pode

- alterar camada visual compartilhada (`src/components/ui/**`,
  `src/styles/**` — Agente 03);
- alterar ativos de marca (`identidade-visual/**`, `public/brand/**` —
  Agente 11);
- alterar `/landing-new` → `LandingInnovative`, que vive em
  `src/features/voice-hub/` — Agente 12;
- criar migração ou alterar schema — Agente 01;
- alterar contrato de API de captura — Agente 18.

Landing/Login são superfícies protegidas: mudança visível exige
autorização humana explícita na missão.

## Coordenação

- Tokens/estilos compartilhados → handoff ao Agente 03.
- Contrato do formulário de captura (`routes/leadCapture.routes.ts` +
  backend) → handoff ao Agente 18/01 conforme o caso.
- Ativos de marca → handoff ao Agente 11.

## Definição de pronto local

- variante canônica identificada com evidência de rotas reais;
- formulário de captura testado ponta a ponta quando alterado;
- deep links e refresh verificados em cada rota afetada;
- zero métricas ou claims de conversão inventados.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
