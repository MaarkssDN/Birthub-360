import { Settings } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 09 — Admin & Operations
 * Visualizador contextual de governança, papéis, acesso por módulo e telemetria da plataforma.
 */
export function AdminOpsViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  const rows = [
    { label: 'Settings Globais', meta: 'Organização · 14 políticas', ok: true },
    { label: 'Equipe & Papéis', meta: 'RBAC · 6 perfis ativos', ok: true },
    { label: 'Module Access', meta: '11 módulos concedidos', ok: true },
    { label: 'Feature Flags', meta: '3 flags em rollout', ok: false },
  ];
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-cyan-500/30 bg-slate-900/80 text-slate-300'
          : 'border-cyan-300 bg-cyan-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-cyan-400' : 'text-cyan-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Governança · Admin & Operations
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : 'bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}
        >
          RBAC Ativo
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {r.label}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`text-[9px] font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {r.meta}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  r.ok ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerAdminOps = AdminOpsViewer;
