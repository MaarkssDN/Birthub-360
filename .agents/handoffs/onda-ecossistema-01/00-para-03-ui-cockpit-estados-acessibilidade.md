De: 00 — Coordenador
Para: 03 — Design e Acessibilidade
Onda: onda-ecossistema-01
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-03-ECO-001 (B-06)
Sprint destino: Onda 01 do Ecossistema

## Problema
`ModuleAgentWidget.tsx` simula a esteira de passos de raciocínio de IA através de um `setInterval` rígido de 2 segundos (L118-124), gerando falsa sensação de processamento ao usuário. Além disso, exibe botões com microfone e orientações de voz falsas ("Diga 'Ei Orbit'") sem que exista engine de reconhecimento de fala ativada, gerando quebra de expectativa e não-conformidade com acessibilidade.

## Arquivo(s) envolvido(s)
- `src/components/ui/ModuleAgentWidget.tsx`
- `src/components/ui/AiReasoningPipeline.tsx`

## Evidência
- `ModuleAgentWidget.tsx` L114-124: animação em `setInterval` de 2s.
- `ModuleAgentWidget.tsx` L25: `command: 'Ei Orbit'` e botão com ícone `Mic` puramente decorativo.

## Alteração necessária
1. Remover o `setInterval` de 2 segundos e ligar a esteira visual aos eventos reais de progresso reportados pelo hook de SSE (desenvolvido com o Agente 07).
2. Tratar e estilizar com precisão os 4 estados obrigatórios: `idle`, `loading/streaming`, `empty` e `error` (com botão de retry acessível via teclado).
3. Remover comandos de voz enganosos e ícones de microfone sem listener funcional, substituindo por affordance textual clara de interação ou atalho de teclado (`Cmd+K` / `Enter`).
4. Garantir contraste de cores WCAG AA (mínimo 4.5:1) em temas dark e light nos avatares e badges.

## Teste esperado
- Teste unitário de componente com `@testing-library/react` verificando renderização correta de cada estado (`idle`, `streaming`, `error`).
- Verificação de foco pelo teclado (`Tab`, `Enter`, `Escape` para fechar).

## Contexto adicional
Trabalha em conjunto com o Agente 02 para encaixe no layout e Agente 07 para recepção dos dados reais.

## Resolução
- Data: 2026-11-09.
- Agente: 03 — Design e Acessibilidade.
- Evidência:
  1. Erradicado o `setInterval` de 2s e os avanço artificiais de passos em `ModuleAgentWidget.tsx`.
  2. Implementado consumo real de SSE via `readSseStream` apontando para `/api/agent/swarm/stream`.
  3. Removidos textos e botões com comandos falsos de voz ("Diga 'Ei Orbit'"), substituídos por feedback honesto de interação do copiloto.
  4. Adicionado fechamento acessível via tecla `Escape`, botões com `aria-expanded` e `aria-label`, foco acessível e badges semânticos.
  5. Testes unitários cobrindo renderização, ausência de comando de voz fake e abertura acessível em `tests/unit/components/ui/ModuleAgentWidget.test.tsx` (4 testes passando).
  6. Status promovido para `resolvido`.

