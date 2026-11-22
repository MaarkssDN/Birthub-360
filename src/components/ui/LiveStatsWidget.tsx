/**
 * LiveStatsWidget.tsx
 * Real-time platform stats from the PostgreSQL backend.
 * Shown on the home screen between the Clock and the 2 main cards.
 */

import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Building2,
  Loader2,
  RotateCw,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { analyticsDB } from '../../lib/db.js';

import { Badge } from './Badge.js';

interface Stats {
  totalCompanies: number;
  totalContacts: number;
  totalLeads: number;
  totalActivities: number;
  pendingActivities: number;
  overdueActivities: number;
  closedThisMonth: number;
  lostThisMonth: number;
  /** `null` porque o modelo Lead não tem campo de valor monetário — a UI exibe "—". */
  pipelineValue: number | null;
  conversionRate: number;
  averageScore: number | null;
}

export function LiveStatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsDB.overview();
      setStats(data);
      setConnected(true);
      setErrorMessage(null);
    } catch (error: any) {
      setStats(null);
      setConnected(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar dados executivos.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [load]);

  const statCards = [
    {
      label: 'Empresas',
      value: stats?.totalCompanies,
      icon: <Building2 className="w-5 h-5 text-brand" />,
      color: 'text-brand',
    },
    {
      label: 'Contatos',
      value: stats?.totalContacts,
      icon: <Users className="w-5 h-5 text-success-active dark:text-success" />,
      color: 'text-success-active dark:text-success',
    },
    {
      label: 'Leads Ativos',
      value: stats?.totalLeads,
      icon: <TrendingUp className="w-5 h-5 text-info-active dark:text-info" />,
      color: 'text-info-active dark:text-info',
    },
    {
      label: 'Atividades',
      value: stats?.totalActivities,
      icon: <Activity className="w-5 h-5 text-danger-active dark:text-danger" />,
      color: 'text-danger-active dark:text-danger',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full"
    >
      <div className="p-6 rounded-card-lg border border-line/80 bg-surface-elevated/85 backdrop-blur-2xl shadow-card relative overflow-hidden text-ink font-sans">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />

        {/* Header Row */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              Visão Geral da Plataforma
              <span className="text-[10px] uppercase tracking-wider text-brand font-extrabold px-1.5 py-0.5 rounded bg-brand/15 border border-brand/30">
                LIVE
              </span>
            </h3>
            <p className="text-xs text-ink-2 font-medium mt-0.5">
              {connected
                ? 'Métricas corporativas sincronizadas em tempo real com PostgreSQL'
                : 'Dados indisponíveis: nenhum valor demonstrativo será exibido'}
            </p>
          </div>

          {/* Database Connection Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={connected ? 'success' : 'warning'}
              dot
              className="flex items-center gap-2 px-3.5 py-1.5 font-bold"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : connected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span>
                {loading ? 'Conectando...' : connected ? 'PostgreSQL Conectado' : 'Modo Offline'}
              </span>
            </Badge>
            {!loading && !connected && (
              <button
                type="button"
                onClick={load}
                title="Tentar reconectar"
                aria-label="Tentar reconectar ao banco de dados"
                className="p-1.5 rounded-lg bg-surface-2 border border-line hover:border-brand text-ink-2 hover:text-brand transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!loading && !connected && (
          <div
            className="mb-4 p-4 rounded-xl border border-warning/30 bg-warning/10 flex items-start justify-between gap-3 backdrop-blur-md"
            role="status"
          >
            <div className="flex items-start gap-2.5 text-sm text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
              <div>
                <p className="font-bold">Métricas executivas offline.</p>
                <p className="text-xs text-ink-2">
                  Não há conexão confirmada com o backend; os cards abaixo mostram travessões, não
                  zeros reais.
                  {errorMessage ? ` Detalhe técnico: ${errorMessage}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * idx }}
              className="group p-4 rounded-xl border border-line/80 bg-surface/75 backdrop-blur-xl flex items-center gap-3.5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover"
            >
              <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 shadow-[0_0_12px_rgba(212,175,55,0.15)] shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-mono font-black tabular-nums ${s.color}`}>
                  {loading || s.value == null ? '—' : s.value.toLocaleString('pt-BR')}
                </p>
                <p className="text-[11px] text-ink-2 font-semibold uppercase tracking-wider truncate">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline Metrics Row */}
        {stats && !loading && (
          <div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-ink-2 font-medium">Fechados este Mês</p>
              <p className="text-lg font-black text-ok-active dark:text-ok">
                {stats.closedThisMonth}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-2 font-medium">Valor no Pipeline</p>
              {/* var(--brand-2) fixo, não token de marca dinâmico: este número sempre aparecia
                  azul fixo mesmo com a outra marca ativa (`text-iris` é uma classe
                  estática de marca, proibida fora de tela pré-seleção — CLAUDE.md regra visual
                  3). Achado e corrigido no Piloto 007, ver .claude/PILOTS.md. */}
              <p className="text-lg font-black text-brand-2">
                {stats.pipelineValue != null && stats.pipelineValue > 0
                  ? `R$ ${(stats.pipelineValue / 1000).toFixed(0)}k`
                  : 'R$ —'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-2 font-medium">Taxa de Conversão</p>
              <p className="text-lg font-black text-brand">
                {stats.conversionRate > 0 ? `${stats.conversionRate.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
