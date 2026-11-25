# Decisões de produto — ciclo pós-Onda 02/04 (2026-11-15)

Registrado pelo Agente 00 com decisão direta do usuário (produto). Fecha as ressalvas R8/R9 da Onda 02 e a exceção de design do painel dark-glass.

## D1 — Depoimentos na landing: MANter SEM depoimentos

- **Decisão**: a landing pública não exibe seção de depoimentos.
- **Fundamento**: depoimentos fabricados já foram removidos na Onda 02; não existem clientes reais autorizados no momento.
- **Regra permanente**: nenhuma prova social fictícia (depoimento, métrica, logo, case) pode ser publicada. Se no futuro houver clientes reais dispostos, a seção pode ser reintroduzida mediante fornecimento dos textos reais pelo responsável de Marca (11) + UX (02).

## D2 — MultimodalRoleplaySimulatorService: DOCUMENTAR como test-only

- **Decisão**: o serviço permanece no código, marcado explicitamente como simulador de teste.
- **Evidência**: `src/features/roleplay/services/multimodalRoleplaySimulator.service.ts` só é referenciado por `tests/unit/roleplay/` e `tests/integration/onda05ComprehensiveFlow.integration.test.ts` + `tests/load/k6-ai-voice-stress.js` — nenhuma rota ou import de produção.
- **Ação**: Agente 07 adiciona cabeçalho/README no arquivo declarando que personas e scores são simulados e que não há persistência real (handoff `07-para-00` inverso: `00-para-07-roleplay-simulator-testonly`).

## D3 — Painel dark-glass do CharacterDetailPanel: MIGRAR para tokens

- **Decisão**: o painel `#0B0F1A` com texto branco fixo em `src/features/characters/CharacterDetailPanel.tsx` deve migrar para tokens de tema.
- **Ressalva**: exige redesign interno do painel (hoje assume superfície escura com texto claro) — não é troca mecânica de cor.
- **Ação**: Agente 03 executa o redesign tokenizado (handoff `00-para-03-character-panel-tokens`).

## D4 — LEAD_CAPTURE_EMAIL

- **Estado**: documentado em `.env.example:282` (`LEAD_CAPTURE_EMAIL=marcelinmark@gmail.com`) e referenciado no OpenAPI. A rota `/api/public/lead-capture` responde 503 honesto sem a variável.
- **Pendente**: confirmação de que a variável está configurada no ambiente de deploy real + lead de teste ponta a ponta — dono Agente 10/00 no checklist de deploy.
