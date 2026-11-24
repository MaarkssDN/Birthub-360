# Handoff — 34 → 60: dívida de acessibilidade no Voice Hub (lint a11y)

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 60 — Aurora (coordenador de Voz & Omnichannel; `voice-hub/ui/**` é do
  Agente 65 — executor a designar)
- Onda: 3 (ONDA3-34-ACCESSIBILITY, demanda DEM-20261123-001)
- Status: aberto
- Prioridade: médio
- Bloqueador-ref: `.agents/runs/onda-3/34-relatorio.md`
- Sprint destino: a definir pelo 00

## Problema

`npx biome lint src` (regras `lint/a11y/*`) encontrou **18 diagnósticos** em
`src/features/voice-hub/**`, segunda maior concentração do repositório.
`voice-hub/components/**` e `voice-hub/pages/**` não constam nominalmente na
`.agents/MATRIZ_PROPRIEDADE.md` (só `voice-hub/ui/**` → Agente 65; o AGENTS.md
local do diretório usa numeração legada "Agente 12", divergente do roster de
100 agentes). Escalado ao coordenador da squad para designar o executor.

## Arquivo(s) envolvido(s) e evidências

### `useSemanticElements` — role que deveria ser elemento nativo (13×)

Padrão: `<div role="button"|"listitem"|...>` ou `role` redundante em elemento
que já tem semântica — WCAG 1.3.1 (Info and Relationships).

- `components/AgentForm.tsx:257`
- `components/CommandPalette.tsx:515`
- `components/design-system/index.tsx:800`
- `components/design-system/CommandPalette.tsx:515` (parece duplicata do
  palette acima — verificar se um é legado)
- `components/studio/panels/TopBar.tsx:48`
- `components/studio/panels/LayersPanel.tsx:203,266,340`
- `components/studio/panels/BottomDrawer.tsx:491,509`
- `pages/Dashboard/AgentRegistry.tsx:179`
- `pages/Dashboard/Organization.tsx:371`
- `pages/Dashboard/Results.tsx:181`
- `pages/Results.tsx:330`

### `useMediaCaption` — mídia sem legenda/faixa (3×)

WCAG 1.2.2 (captions) para conteúdo de áudio/vídeo pré-gravado:

- `pages/Dashboard/Telephony.tsx:128` — `<audio controls>` de pré-visualização
  de música gerada. Se for conteúdo musical decorativo, documentar isenção;
  se for fala/aviso, precisa de transcrição/legenda.
- `pages/Dashboard/Organization.tsx:451` — `<video controls autoPlay>` —
  avaliar `<track kind="captions">` ou isenção documentada.
- `components/FieldMeetingRecorder.tsx:438` fica em `src/features/mobile/**`
  (handoff separado ao 30/80).

### `useAriaPropsSupportedByRole` (1×)

- `components/NotificationCenter/NotificationCenter.tsx:158` — `aria-label`
  em container de skeleton de loading (`<div>` sem role compatível).
  Trocar por `role="status"`/`aria-busy` ou remover o atributo.

## Alteração necessária

Corrigir cada ocorrência no arquivo dono. Prioridade: `useMediaCaption` (única
regra que toca WCAG 1.2) e `useAriaPropsSupportedByRole`; `useSemanticElements`
é majoritariamente troca de `role` por elemento nativo ou remoção de role
redundante — verificar caso a caso que o papel ARIA não é o único portador de
semântica (ex.: `role="button"` em `<div>` clicável continua exigindo
`tabIndex` + handler de teclado — não "corrigir" removendo só o role).

## Teste esperado

- `npx biome lint src/features/voice-hub` sem diagnósticos `lint/a11y/*`.
- Componentes interativos resultantes navegáveis por teclado (Tab/Enter/Escape).
- Mídias com decisão de legenda documentada (track ou isenção justificada).

## Contexto adicional

- Handoffs anteriores relacionados já em `.agents/handoffs/`: `00-para-12-…`
  (aria incompleto no TableVoiceHub — numeração legada; tratar como desta squad)
  e `03-para-12-voice-hub-contraste-tema-claro.md` (onda 1, contraste — owner
  de tokens é o 03/33, não este handoff).
- `CommandPalette` existe em `components/` e `components/design-system/` —
  confirmar qual é o usado antes de corrigir (possível duplicação).
