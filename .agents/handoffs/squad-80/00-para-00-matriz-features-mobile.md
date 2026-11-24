# Handoff 80 → 00 — Proposta de owners para src/features/mobile/** (14 arquivos)

- De: Agente 80 — Navi · Para: Agente 00 — Astra
- Status: aberto · Prioridade: normal · Relacionado: R4 do plano squad-80

`src/features/mobile/**` não consta em `.agents/MATRIZ_PROPRIEDADE.md`. Proposta de rateio
(pendente aprovação do Astra antes de qualquer executor editar):

| Subconjunto | Owner proposto |
|---|---|
| `offlineSync.service.ts`, `services/offlineSyncQueue.service.ts`, `services/offlineStorageAdapter.ts` | 85 Bóris |
| `services/encryptedOfflineStorage.service.ts` | 88 Sasha (85 revisa) |
| `audioRecording.service.ts`, `components/FieldMeetingRecorder.tsx` | 87 Tomás (overlap c/ 62 Sol, 65 Lena) |
| `mobileEdgeAi.service.ts` | 85 Bóris (ou 74 Luca — decidir) |
| `server/mobileFieldMeeting.{routes,service}.ts` | 20 Ciro (backend) + revisão 85 |
| `index.ts`, `__tests__/` | 80 Navi |

Contexto: inventário e divergências em `.agents/runs/squads/squad-80-plano.md` e
`.agents/runs/squads/squad-80-reconciliacao-mobile.md`.
