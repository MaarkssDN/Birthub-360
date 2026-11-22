import { motion } from 'framer-motion';
import { AlertTriangle, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import {
  FlameStreakIcon,
  Gem3DIcon,
  Trophy3DIcon,
} from '../../../components/ui/icons/Isometric3DIcons.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { fadeInUp, staggerContainer, staggerItem } from '../../../lib/motion.js';
import { SoundFX } from '../../../lib/soundEffects.js';

interface RankingRow {
  label: string;
  count: number;
  won: number;
}

interface TeamRankingWidgetProps {
  byOwner: RankingRow[];
  currentUserName?: string | null;
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
}

/**
 * Ranking comercial real com estética gamificada 2026:
 * Troféu 3D para o 1º lugar, gema facetada para o 2º lugar, e holofote de cursor em tempo real.
 */
export function TeamRankingWidget({
  byOwner,
  currentUserName,
  loading,
  error,
  onRetry,
}: TeamRankingWidgetProps) {
  const ranked = [...byOwner]
    .filter((row) => row.label)
    .sort((a, b) => b.won - a.won)
    .slice(0, 8);

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" className="rounded-card-lg">
      <Card variant="bento" padding="lg" spotlight soundHover>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-ink dark:text-brand">
                Performance da equipe · 2026
              </p>
              <h3 className="mt-0.5 text-base font-display font-bold text-ink flex items-center gap-1.5">
                Ranking Comercial & Fechamentos
              </h3>
            </div>
          </div>
          <span className="rounded-full bg-brand/15 border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand">
            Top Fechadores
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-critical" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Não foi possível carregar o ranking agora.
            </div>
            <Button
              type="button"
              onClick={onRetry}
              variant="link"
              size="sm"
              className="h-auto shrink-0 px-0 text-critical"
            >
              Tentar novamente
            </Button>
          </div>
        ) : ranked.length === 0 ? (
          <p className="text-sm text-ink-2">Ainda não há dados suficientes de ranking este mês.</p>
        ) : (
          <motion.div
            variants={staggerContainer()}
            initial="hidden"
            animate="show"
            className="space-y-2.5"
          >
            {ranked.map((row, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isCurrentUser =
                !!currentUserName &&
                row.label.trim().toLowerCase() === currentUserName.trim().toLowerCase();

              return (
                <motion.div
                  key={row.label}
                  variants={staggerItem}
                  onMouseEnter={() => {
                    SoundFX.play('hover');
                  }}
                  className={`group flex items-center gap-3.5 rounded-xl border p-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
                    isFirst
                      ? 'border-brand/50 bg-gradient-to-r from-brand/15 via-surface-elevated to-surface-elevated shadow-[0_4px_20px_rgba(0,229,255,0.15)]'
                      : isCurrentUser
                        ? 'border-brand/40 bg-brand/10'
                        : 'border-line/70 bg-surface/70 hover:border-brand/35 hover:bg-surface-interactive'
                  }`}
                >
                  {/* Posição / Ícone 3D */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                    {isFirst ? (
                      <Trophy3DIcon size={28} animate />
                    ) : isSecond ? (
                      <Gem3DIcon size={26} animate />
                    ) : isThird ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 border border-warning/30 font-black text-xs text-warning">
                        3
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 border border-line text-xs font-bold text-ink-2">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      {row.label}
                      {isCurrentUser && (
                        <span className="rounded-full bg-brand px-1.5 py-0.2 text-[9px] font-black text-on-brand">
                          VOCÊ
                        </span>
                      )}
                      {isFirst && (
                        <span className="text-[10px] text-brand flex items-center gap-0.5 font-bold">
                          <FlameStreakIcon size={14} animate /> LÍDER
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-ink-2">{row.count} leads sob gestão</p>
                  </div>

                  {/* Número de Ganhos / Fechamentos */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-brand [font-variant-numeric:tabular-nums]">
                      {row.won}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-ink-2">fechados</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
