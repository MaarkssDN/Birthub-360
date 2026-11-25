De: 00 — Astra
Para: 60 — Aurora (Coordenador Squad 60)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 6, 9
Sprint destino: Onda 4 / ciclo imediato

## Problema

Dois arquivos do Squad 60 possuem exceções de hotspot arquiteturais ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 6 | `src/features/voice-hub/components/design-system/index.tsx` | 1200 | ~1150 | Catálogo/barrel export agregador de componentes de telefonia/áudio |
| 9 | `src/lib/voice-hub/services/workflowRuntimeService.ts` | 1500 | ~1480 | Motor de execução de fluxos de chamada (IVR/URAs), eventos de áudio |

## Arquivo(s) envolvido(s)

- `src/features/voice-hub/components/design-system/index.tsx` (Agente 65 — Lena)
- `src/lib/voice-hub/services/workflowRuntimeService.ts` (Agente 61 — Nando)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo.

## Alteração necessária

1. `design-system/index.tsx`: desmembrar barrel em exportações pontuais ou sub-pastas por categoria (áudio, discador, controles).
2. `workflowRuntimeService.ts`: decompor lógica de transição de nós e adapters de TTS/STT em classes de execução separadas. Preservar comportamento do motor IVR e contratos de eventos de áudio.

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 2 arquivos.
- Testes unitários de voice-hub e do motor de workflow sem regressão.
- B-07: comandos de voz devem continuar executando ações comprovadas — não alterar semântica.

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branches de refatoração.
- Agente 65 (Lena) entregou na Onda 3 (`b8a39713e`, APROVADO) — coordenar ownership em `src/features/voice-hub/**`.
- Registrar SHAs congelados e submeter ao Agente 09 antes de integrar.
