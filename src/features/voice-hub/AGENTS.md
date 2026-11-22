# AGENTS.md — Voice Hub (Birthub Voices)

## Dono

**Agente 12 — Voz e Telefonia (Birthub Voices)**

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
