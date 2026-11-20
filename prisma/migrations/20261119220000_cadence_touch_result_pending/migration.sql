-- AlterEnum: adiciona 'Pending' ao enum CadenceTouchResult
-- Permite persistir o estado 'pending' de toques assíncronos (voz) sem downgrade para 'Skipped'
-- Ref: handoff Trilha C 17-para-01-cadence-touchresult-enum-pending.md / DEBT-0009
ALTER TYPE "CadenceTouchResult" ADD VALUE IF NOT EXISTS 'Pending';
