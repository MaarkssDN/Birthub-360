import { AlertTriangle, Globe2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.js';
import { Card } from '../../../components/ui/Card.js';
import { cn } from '../../../lib/utils.js';
import type {
  RegionIdentifier,
  RegionTelemetry,
} from '../../../shared/contracts/multiRegionResilience.contract.js';

/**
 * Painel conceitual de resiliência multi-região.
 *
 * IMPORTANTE — honestidade operacional (EXP-05, auditoria forense):
 * a telemetria abaixo é ILUSTRATIVA e o failover NÃO é executável por esta
 * tela — não existe endpoint operacional de controle de regiões conectado.
 * Os dados servem apenas para visualizar a arquitetura proposta; nenhum
 * valor aqui representa medição real de infraestrutura.
 */
const ILLUSTRATIVE_REGIONS: Record<RegionIdentifier, RegionTelemetry> = {
  'sa-east-1': {
    region: 'sa-east-1',
    status: 'healthy',
    latencyMs: 34,
    errorRatePercent: 0.02,
    activeWorkersCount: 24,
    cacheHitRatio: 0.974,
    lastHealthCheckIso: new Date().toISOString(),
  },
  'us-east-1': {
    region: 'us-east-1',
    status: 'healthy',
    latencyMs: 118,
    errorRatePercent: 0.01,
    activeWorkersCount: 16,
    cacheHitRatio: 0.952,
    lastHealthCheckIso: new Date().toISOString(),
  },
  'us-west-2': {
    region: 'us-west-2',
    status: 'healthy',
    latencyMs: 156,
    errorRatePercent: 0.01,
    activeWorkersCount: 12,
    cacheHitRatio: 0.941,
    lastHealthCheckIso: new Date().toISOString(),
  },
};

const REGION_LABELS: Record<RegionIdentifier, { name: string; location: string; flag: string }> = {
  'sa-east-1': { name: 'São Paulo (Primário)', location: 'América do Sul (Brasil)', flag: '🇧🇷' },
  'us-east-1': { name: 'N. Virginia (Secundário)', location: 'Costa Leste (EUA)', flag: '🇺🇸' },
  'us-west-2': { name: 'Oregon (Disaster Recovery)', location: 'Costa Oeste (EUA)', flag: '🇺🇸' },
};

const PRIMARY_REGION: RegionIdentifier = 'sa-east-1';

export function MultiRegionFailoverPanel() {
  return (
    <div className="space-y-6">
      {/* ── HEADER DE RESILIÊNCIA MULTI-REGIÃO ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-surface-elevated to-surface border border-sky-500/30 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold text-xs gap-1"
            >
              <Globe2 className="h-3.5 w-3.5" /> Multi-Region High Availability
            </Badge>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold text-xs gap-1"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Demonstração visual
            </Badge>
            <span className="text-xs font-semibold text-ink-2">
              Eixo 19 · Arquitetura SRE & Failover
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight mt-1 flex items-center gap-2">
            Visualizador de Failover Multi-Região
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Arquitetura conceitual de monitoramento regional e failover com estado preservado.
          </p>
        </div>
      </div>

      {/* ── AVISO DE HONESTIDADE OPERACIONAL ────────────────────────── */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-ink-2 leading-relaxed">
            <p className="font-bold text-ink mb-1">
              Painel ilustrativo — sem controle operacional real
            </p>
            <p>
              A telemetria de regiões, o histórico de failovers e o disparo de failover{' '}
              <strong>não estão conectados a uma infraestrutura operacional</strong>. Os valores
              exibidos são exemplos da arquitetura proposta e não representam medições reais de
              latência, workers ou tráfego. O failover automático de integrações (WhatsApp, voz,
              filas) é gerenciado pela camada de resiliência do backend, fora desta tela.
            </p>
          </div>
        </div>
      </Card>

      {/* ── CARDS DAS 3 REGIÕES CANÔNICAS ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(['sa-east-1', 'us-east-1', 'us-west-2'] as RegionIdentifier[]).map((regionId) => {
          const telemetry = ILLUSTRATIVE_REGIONS[regionId];
          const info = REGION_LABELS[regionId];
          const isPrimary = PRIMARY_REGION === regionId;

          return (
            <Card
              key={regionId}
              className={cn(
                'p-5 border-2 transition-all relative overflow-hidden',
                isPrimary
                  ? 'border-brand bg-brand/5 shadow-lg shadow-brand/5'
                  : 'border-line/70 bg-surface-elevated/70',
              )}
            >
              {/* Header do Card Regional */}
              <div className="flex items-center justify-between pb-3 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={info.name}>
                    {info.flag}
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-ink block">{regionId}</span>
                    <span className="text-[11px] text-ink-2">{info.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isPrimary && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-brand/15 text-brand border-brand/30"
                    >
                      PRIMÁRIO
                    </Badge>
                  )}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                      telemetry.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : telemetry.status === 'degraded'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30',
                    )}
                  >
                    {telemetry.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Grid de Telemetria */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-2.5 rounded-xl border border-line bg-surface/50">
                  <span className="text-[10px] text-ink-3 block">Latência RTT</span>
                  <span
                    className={cn(
                      'text-base font-extrabold tabular-nums font-mono',
                      telemetry.latencyMs < 50
                        ? 'text-emerald-500'
                        : telemetry.latencyMs < 130
                          ? 'text-amber-500'
                          : 'text-indigo-400',
                    )}
                  >
                    {telemetry.latencyMs} ms
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-line bg-surface/50">
                  <span className="text-[10px] text-ink-3 block">Workers Ativos</span>
                  <span className="text-base font-extrabold text-ink tabular-nums font-mono">
                    {telemetry.activeWorkersCount} pods
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-line bg-surface/50">
                  <span className="text-[10px] text-ink-3 block">Taxa de Erro</span>
                  <span className="text-base font-extrabold text-ink tabular-nums font-mono">
                    {telemetry.errorRatePercent}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-line bg-surface/50">
                  <span className="text-[10px] text-ink-3 block">Cache Hit Ratio</span>
                  <span className="text-base font-extrabold text-brand tabular-nums font-mono">
                    {(telemetry.cacheHitRatio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── HISTÓRICO DE FAILOVERS ─────────────────────────────────── */}
      <Card className="p-5 border-line/70 bg-surface-elevated/70">
        <div className="flex items-center justify-between pb-3 border-b border-line/60">
          <h3 className="font-display font-bold text-sm text-ink">
            Registro de Transições & Auditoria de Failover
          </h3>
          <span className="text-xs text-ink-3">Sem eventos operacionais registrados</span>
        </div>

        <div className="mt-4">
          <p className="text-xs text-ink-2 text-center py-6">
            Nenhum failover real foi registrado — o histórico operacional de failover ainda não está
            conectado a esta tela.
          </p>
        </div>
      </Card>
    </div>
  );
}
