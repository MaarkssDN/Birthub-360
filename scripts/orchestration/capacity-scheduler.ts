/**
 * Escalonador de Capacidade Dinâmica — Arquitetura 100 Agentes (AGENTS.md §13)
 * Autoridade: Agente 00 (Astra) · Governança aprovada pelo Orquestrador Humano em 2026-11-24
 *
 * Calcula e governa a capacidade real de execução concorrente de agentes (00–99)
 * com base nos recursos físicos medidos em tempo real (CPU, RAM livre, disco livre,
 * processos Node ativos, worktrees isolados e reserva obrigatória do Agente 09 — Silas).
 */
import os from 'node:os';
import { execSync } from 'node:child_process';

export interface CapacityTelemetry {
  timestamp: string;
  cpuModel: string;
  logicalCores: number;
  totalRamGb: number;
  freeRamGb: number;
  usedRamPercent: number;
  activeNodeProcesses: number;
  reservedCoordinatorSlot: number;
  reservedAuditorSlot: number;
  maxSafeConcurrentLightAgents: number;
  maxSafeConcurrentHeavyTestRunners: number;
  recommendedActiveSpecialistsNow: number;
  limitingFactor: string;
  scaleTo100Plan: {
    localMaxSpecialists: number;
    distributedNodesRequiredFor100: number;
    ramRequiredFor100Gb: number;
    vCpuRequiredFor100: number;
  };
}

function countNodeProcesses(): number {
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        'powershell -NoProfile -Command "(Get-Process node -ErrorAction SilentlyContinue | Measure-Object).Count"',
        { encoding: 'utf8', timeout: 4000 },
      ).trim();
      return Number.parseInt(out, 10) || 1;
    }
    const out = execSync('pgrep -c node || true', { encoding: 'utf8', timeout: 4000 }).trim();
    return Number.parseInt(out, 10) || 1;
  } catch {
    return 1;
  }
}

export function evaluateDynamicCapacity(): CapacityTelemetry {
  const cpus = os.cpus();
  const logicalCores = cpus.length || 1;
  const cpuModel = cpus[0]?.model?.trim() ?? 'unknown-cpu';
  const totalRamGb = Number((os.totalmem() / 1024 ** 3).toFixed(2));
  const freeRamGb = Number((os.freemem() / 1024 ** 3).toFixed(2));
  const usedRamPercent = Number((((totalRamGb - freeRamGb) / totalRamGb) * 100).toFixed(1));
  const activeNodeProcesses = countNodeProcesses();

  // Orçamento físico seguro por agente:
  // - Agente leve (edição/análise/git em worktree sem rodar vitest/tsc pesado): ~350 MB RAM, ~0.5 thread lógica
  // - Runner de teste pesado (vitest / tsc --noEmit / build): ~1.2 GB RAM, 2 threads lógicas
  // Reserva mínima do SO + IDE/Runtimes: 2.0 GB RAM livre inviolável.
  const usableFreeRamGb = Math.max(0, freeRamGb - 2.0);
  const ramBoundedLightAgents = Math.floor(usableFreeRamGb / 0.35);
  const cpuBoundedLightAgents = Math.max(2, logicalCores * 2 - 2); // reserva 00 e 09

  const maxSafeConcurrentLightAgents = Math.max(
    1,
    Math.min(98, ramBoundedLightAgents, cpuBoundedLightAgents),
  );
  const maxSafeConcurrentHeavyTestRunners = Math.max(
    1,
    Math.min(Math.floor(usableFreeRamGb / 1.2), Math.floor(logicalCores / 3)),
  );

  const limitingFactor =
    ramBoundedLightAgents < cpuBoundedLightAgents
      ? `RAM física livre (${freeRamGb} GB livres de ${totalRamGb} GB; reserva de segurança 2.0 GB)`
      : `Threads lógicas de CPU (${logicalCores} vCPUs)`;

  return {
    timestamp: new Date().toISOString(),
    cpuModel,
    logicalCores,
    totalRamGb,
    freeRamGb,
    usedRamPercent,
    activeNodeProcesses,
    reservedCoordinatorSlot: 1, // Agente 00 — Astra
    reservedAuditorSlot: 1, // Agente 09 — Silas
    maxSafeConcurrentLightAgents,
    maxSafeConcurrentHeavyTestRunners,
    recommendedActiveSpecialistsNow: maxSafeConcurrentLightAgents,
    limitingFactor,
    scaleTo100Plan: {
      localMaxSpecialists: maxSafeConcurrentLightAgents,
      distributedNodesRequiredFor100: Math.ceil(100 / Math.max(1, maxSafeConcurrentLightAgents)),
      ramRequiredFor100Gb: 64,
      vCpuRequiredFor100: 48,
    },
  };
}

if (process.argv[1]?.endsWith('capacity-scheduler.ts')) {
  const telemetry = evaluateDynamicCapacity();
  console.log(JSON.stringify(telemetry, null, 2));
}
