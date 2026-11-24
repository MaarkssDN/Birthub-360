# AGENTS.md — Voice Hub (Birthub Voices)

## Dono

Squad 60 conforme `.agents/MATRIZ_PROPRIEDADE.md` (revisão 2026-11-24): este arquivo
declarava "Agente 12" como dono exclusivo de todo `src/features/voice-hub/**`
(numeração legada). A divisão oficial é: 60 (coordenação + `index.ts`/`types.ts`),
61 (`voip/`, `sip/`, serviços de telefonia), 62 (`recording/`, `infra/`,
`callRecord.service.ts`), 63 (`transcription/`, `realtimeTranscription.service.ts`),
64 (`commands/`), 65 (`ui/`, `components/`, `pages/`, `store/`, `hooks/`, `lib/`,
`api/`). O backend legado `src/lib/voice-hub/**` pertence ao Agente 60 até
deliberação de decommission (ordem humana 2026-11-24: preservar temporariamente).

## Escopo

Este diretório contém a funcionalidade de Voice Hub do Birth Hub 360º, incluindo:

- Landing page de voz
- Studio de gravação e edição
- Dashboard de overview
- Store de estado do studio
- Componentes de interface de voz

## Propriedade

Agente 12 é o dono exclusivo de todos os arquivos em `src/features/voice-hub/**`, incluindo:

- Componentes React (`.tsx`)
- Hooks customizados
- Store Zustand (`useStudioStore.ts`)
- Páginas e rotas
- Estilos específicos do Voice Hub

## Interações

- Handoffs com Agente 02 (Produto/UX) para definição de fluxos de voz
- Handoffs com Agente 03 (Design/Acessibilidade) para review de componentes
- Handoffs com Agente 07 (IA/Automações) para integração com IA de voz
- Handoffs com Agente 16 (Runtime/Workers) para processamento de áudio em background

## Observações

- Voice Hub é uma feature crítica do produto Birth Hub 360º
- Este módulo também roda como aplicativo Android via Capacitor
- Performance e acessibilidade são considerações importantes (voz como interface)
