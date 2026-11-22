import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useActivities } from '../../hooks/useDatabase.js';
import { SoundFX } from '../../lib/soundEffects.js';

export function ClockCalendarWidget() {
  const [time, setTime] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dayName = time.toLocaleDateString('pt-BR', { weekday: 'long' });
  const fullDate = time.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const currentMonthName = time.toLocaleDateString('pt-BR', { month: 'long' });

  const monthStart = useMemo(
    () => new Date(time.getFullYear(), time.getMonth(), 1).toISOString().split('T')[0],
    [time],
  );
  const monthEnd = useMemo(
    () => new Date(time.getFullYear(), time.getMonth() + 1, 1).toISOString().split('T')[0],
    [time],
  );
  const {
    activities,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useActivities({ from: monthStart, to: monthEnd, limit: 200 });

  const scheduledEvents = useMemo(
    () =>
      activities
        .filter((a) => !!a.date)
        .map((a) => ({
          day: new Date(a.date).getDate(),
          title: a.observations?.trim() || `${a.type} — ${a.owner}`,
          time: a.time || '—',
          badge: a.status,
        })),
    [activities],
  );

  return (
    <div
      data-testid="clock-calendar-widget"
      className="p-6 rounded-card-lg border border-line/80 bg-surface-elevated/90 backdrop-blur-2xl shadow-card relative overflow-hidden text-ink font-sans"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-line/70 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand flex items-center justify-center text-on-brand shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
            Cronômetro de Operação
          </p>
          <p className="text-xs text-ink capitalize font-bold">
            {dayName}, {fullDate}
          </p>
        </div>
      </div>

      {/* Relógio Ao Vivo HUD 2026 */}
      <div className="p-4 rounded-xl bg-surface/80 border border-brand/20 relative overflow-hidden text-center sm:text-left backdrop-blur-md shadow-xs">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand block mb-1 flex items-center justify-center sm:justify-start gap-1.5">
          <Sparkles className="w-3 h-3 text-brand" /> Fuso Horário Oficial · Horário de Brasília
        </span>
        <div className="flex items-baseline justify-center sm:justify-start gap-1 font-mono">
          <span className="text-5xl font-black text-ink tracking-tight tabular-nums drop-shadow-xs">
            {hours}:{minutes}
          </span>
          <span className="text-xl font-bold text-brand tabular-nums">:{seconds}</span>
        </div>
      </div>

      {/* Calendário Mensal Compacto */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold capitalize">
          <span className="flex items-center gap-1.5 text-sm font-black text-ink">
            <CalendarIcon className="w-4 h-4 text-brand" /> {currentMonthName} {time.getFullYear()}
          </span>
          <span className="text-[10px] text-ink-2 bg-surface px-2.5 py-1 rounded-lg border border-line/80 font-medium">
            Selecione uma data
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="py-1 text-ink-2 text-[10px] uppercase tracking-wider">
              {d}
            </div>
          ))}

          {Array.from(
            { length: new Date(time.getFullYear(), time.getMonth() + 1, 0).getDate() },
            (_, i) => i + 1,
          ).map((day) => {
            const hasEvent = scheduledEvents.some((e) => e.day === day);
            const isToday = day === time.getDate();
            const isSelected = day === selectedDate;

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  SoundFX.play('click');
                  setSelectedDate(day);
                }}
                aria-label={`Ver compromissos do dia ${day}`}
                aria-pressed={isSelected}
                className={`py-2 rounded-xl transition-all duration-200 relative flex flex-col items-center justify-center cursor-pointer ${
                  isToday
                    ? 'bg-gradient-to-br from-brand via-brand-2 to-brand text-on-brand font-black shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105'
                    : isSelected
                      ? 'bg-surface border-2 border-brand text-ink font-bold shadow-xs'
                      : 'bg-surface/60 hover:bg-surface hover:border-brand/30 border border-transparent text-ink-2 hover:text-ink'
                }`}
              >
                <span>{day}</span>
                {hasEvent && (
                  <span className="w-1.5 h-1.5 rounded-full absolute bottom-1 animate-pulse bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compromissos do Dia Selecionado */}
      <div className="mt-5 space-y-3">
        <h4 className="font-bold text-ink text-xs uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-ok" /> Compromissos do Dia {selectedDate}
        </h4>
        {eventsError ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-critical">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Não foi possível carregar a agenda
              do mês.
            </div>
            <button
              type="button"
              onClick={() => refetchEvents()}
              className="text-[10px] font-bold text-critical hover:underline cursor-pointer shrink-0"
            >
              Tentar novamente
            </button>
          </div>
        ) : eventsLoading ? (
          <p className="text-xs text-ink-2">Carregando agenda...</p>
        ) : scheduledEvents.filter((e) => e.day === selectedDate).length === 0 ? (
          <p className="text-xs text-ink-2 italic">Nenhum evento registrado para este dia.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {scheduledEvents
              .filter((e) => e.day === selectedDate)
              .map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface/80 border border-line/80 space-y-1.5 backdrop-blur-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-ink-2">{evt.time}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-brand/10 text-brand border-brand/25">
                      {evt.badge}
                    </span>
                  </div>
                  <p className="font-bold text-ink leading-tight">{evt.title}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
