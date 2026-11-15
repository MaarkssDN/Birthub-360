import { AnimatePresence } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CharacterDetailPanel } from './CharacterDetailPanel.js';
import type {
  CharacterApiEntry,
  CharactersApiResponse,
  SwarmAuditLogEntry,
} from './characterApiTypes.js';
import { CHARACTER_STATES, type CharacterLayer, type CharacterState } from './characterCatalog.js';

/**
 * Central de Personagens e Agentes — `/app/characters` (rota autenticada,
 * fora da navegação principal). Galeria visual homologada + vínculo runtime
 * real (GET /api/agent/characters) + execuções recentes do enxame.
 */

const LAYER_LABELS: Record<CharacterLayer, string> = {
  pillar: 'Pilares (9 originais)',
  'commercial-agent': 'Agentes Comerciais (15)',
  'channel-agent': 'Canais e Voz (4)',
  orchestration: 'Orquestração (1)',
};

const LAYER_ORDER: CharacterLayer[] = [
  'pillar',
  'commercial-agent',
  'channel-agent',
  'orchestration',
];

const STATE_LABELS: Record<CharacterState, string> = {
  idle: 'Repouso',
  listening: 'Escuta',
  processing: 'Processamento',
  speaking: 'Resposta',
  success: 'Sucesso',
  error: 'Erro',
};

const RUNTIME_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponível', color: 'var(--ok)' },
  degraded: { label: 'Degradado', color: 'var(--warn)' },
  unavailable: { label: 'Indisponível', color: 'var(--ink-2)' },
};

function CharacterCard({
  entry,
  state,
  onSelect,
}: {
  entry: CharacterApiEntry;
  state: CharacterState;
  onSelect: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const badge = RUNTIME_BADGE[entry.runtime.status] ?? RUNTIME_BADGE.unavailable;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="bh-character-card flex flex-col items-center gap-3 text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand"
      data-testid={`character-card-${entry.id}`}
      aria-label={`${entry.name} — ${entry.role}. Abrir detalhes.`}
    >
      <div className="flex flex-col items-center gap-2 w-full">
        <div
          className="bh-character-avatar flex items-center justify-center w-14 h-14 rounded-full"
          data-state={state}
          style={{
            background: `linear-gradient(135deg, ${entry.palette.primary}33, ${entry.palette.secondary}1f)`,
            boxShadow: entry.palette.halo,
          }}
        >
          {imgFailed ? (
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: entry.headingColor }}
              aria-hidden="true"
            >
              {entry.name.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <img
              src={entry.svg}
              alt={entry.ariaLabel}
              className="w-9 h-9"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>
        <div className="text-center w-full">
          <h3
            className="font-bold text-sm leading-tight"
            style={{ color: entry.headingColor, fontFamily: 'Sora, sans-serif' }}
          >
            {entry.name}
          </h3>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: entry.subheadingColor }}>
            {entry.role}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border"
            style={{
              color: badge.color,
              borderColor: `color-mix(in srgb, ${badge.color} 33%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${badge.color} 8%, transparent)`,
            }}
          >
            {badge.label}
          </span>
          {entry.linkedAgentId && (
            <span className="text-[9px] font-mono text-white/40 truncate max-w-[140px]">
              {entry.linkedAgentId}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function CharacterGalleryView() {
  const [data, setData] = useState<CharactersApiResponse | null>(null);
  const [activity, setActivity] = useState<SwarmAuditLogEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<CharacterLayer | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visualState, setVisualState] = useState<CharacterState>('idle');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [charsRes, actRes] = await Promise.all([
        fetch('/api/agent/characters', { credentials: 'include' }),
        fetch('/api/agent/characters/activity?limit=15', { credentials: 'include' }),
      ]);
      if (!charsRes.ok) throw new Error(`HTTP ${charsRes.status}`);
      const charsJson = (await charsRes.json()) as {
        success: boolean;
        data: CharactersApiResponse;
      };
      setData(charsJson.data);
      if (actRes.ok) {
        const actJson = (await actRes.json()) as {
          success: boolean;
          data: { logs: SwarmAuditLogEntry[] };
        };
        setActivity(actJson.data?.logs ?? []);
      }
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Falha ao carregar a central de personagens.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const chars = data?.characters ?? [];
    const q = search.trim().toLowerCase();
    return chars.filter((c) => {
      if (layerFilter !== 'all' && c.layer !== layerFilter) return false;
      if (statusFilter !== 'all' && c.runtime.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.linkedAgentId ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, search, layerFilter, statusFilter]);

  const grouped = useMemo(
    () =>
      LAYER_ORDER.map((layer) => ({
        layer,
        label: LAYER_LABELS[layer],
        characters: filtered.filter((c) => c.layer === layer),
      })).filter((g) => g.characters.length > 0),
    [filtered],
  );

  const selected = useMemo(
    () => data?.characters.find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" data-testid="character-gallery">
      <header className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-brand">
          Birth Hub 360° · Central de Personagens e Agentes
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--warn)', fontFamily: 'Sora, sans-serif' }}
        >
          29 Personagens Oficiais
        </h1>
        <p className="text-sm text-white/70 max-w-3xl">
          Catálogo canônico integrado ao runtime real: cada personagem declara seu vínculo
          verificável com agente, motor ou Supervisor. Status e execuções vêm de registros reais da
          plataforma — nunca de simulação.
        </p>
        {data?.swarm && (
          <p className="text-[11px] font-mono text-white/50">
            Enxame: {data.swarm.concurrency.active}/{data.swarm.concurrency.maxConcurrent} missões
            ativas
            {data.swarm.concurrency.waiting > 0 && ` · ${data.swarm.concurrency.waiting} na fila`}
            {data.swarm.circuitBreaker && ` · circuit breaker: ${data.swarm.circuitBreaker.state}`}
          </p>
        )}
      </header>

      {/* Busca e filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, id, papel ou agente..."
            aria-label="Buscar personagem"
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand/50"
          />
        </div>
        <select
          value={layerFilter}
          onChange={(e) => setLayerFilter(e.target.value as CharacterLayer | 'all')}
          aria-label="Filtrar por camada"
          className="bg-white/5 border border-white/10 rounded-full px-3 py-2 text-[11px] font-mono text-white/80 focus:outline-none focus:border-brand/50"
        >
          <option value="all">Todas as camadas</option>
          {LAYER_ORDER.map((l) => (
            <option key={l} value={l}>
              {LAYER_LABELS[l]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por status de runtime"
          className="bg-white/5 border border-white/10 rounded-full px-3 py-2 text-[11px] font-mono text-white/80 focus:outline-none focus:border-brand/50"
        >
          <option value="all">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="degraded">Degradado</option>
          <option value="unavailable">Indisponível</option>
        </select>

        {/* Prévia visual dos estados (homologação) */}
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Estado visual de prévia</legend>
          {CHARACTER_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setVisualState(s)}
              aria-pressed={visualState === s}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                visualState === s
                  ? 'bg-brand/20 border-brand text-brand'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {STATE_LABELS[s]}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
          aria-pressed={previewTheme === 'light'}
          className="px-3 py-1.5 rounded-full text-[11px] font-mono border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
        >
          {previewTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-xs"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {loadError}
          <button type="button" onClick={() => void load()} className="ml-auto underline">
            Tentar novamente
          </button>
        </div>
      )}

      {!data && !loadError && (
        <p className="text-sm text-white/50 font-mono">Carregando catálogo de personagens...</p>
      )}

      {/* Grid por camada */}
      {grouped.map(({ layer, label, characters }) => (
        <section key={layer} aria-labelledby={`layer-${layer}`} className="space-y-4">
          <h2
            id={`layer-${layer}`}
            className="text-lg font-semibold flex items-center gap-3"
            style={{ color: 'var(--brand)', fontFamily: 'Sora, sans-serif' }}
          >
            {label}
            <span className="text-[11px] font-mono text-white/40 font-normal">
              {characters.length} personagem(ns)
            </span>
          </h2>
          <div
            className={
              previewTheme === 'light'
                ? 'theme-light grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            }
          >
            {characters.map((entry) => (
              <CharacterCard
                key={entry.id}
                entry={entry}
                state={visualState}
                onSelect={() => setSelectedId(entry.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {data && filtered.length === 0 && (
        <p className="text-sm text-white/50">Nenhum personagem corresponde aos filtros.</p>
      )}

      {/* Atividade recente do enxame */}
      {activity.length > 0 && (
        <section aria-labelledby="recent-activity" className="space-y-3">
          <h2
            id="recent-activity"
            className="text-lg font-semibold"
            style={{ color: 'var(--brand)', fontFamily: 'Sora, sans-serif' }}
          >
            Atividade recente do enxame
          </h2>
          <ul className="space-y-1.5">
            {activity.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 text-[11px] font-mono bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2"
              >
                <span className={log.result === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                  {log.result === 'success' ? '✓' : '✗'}
                </span>
                <span className="text-white/80">{log.action}</span>
                <span className="text-white/40">{log.agentType}</span>
                {log.sessionId && (
                  <span className="text-white/30 truncate max-w-[180px]">{log.sessionId}</span>
                )}
                <span className="ml-auto text-white/30">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-[11px] font-mono text-white/40 pt-4 border-t border-white/10">
        Registro canônico: src/features/characters/characterCatalog.ts · Runtime:
        /api/agent/characters · Execuções: /api/agent/swarm/stream (Supervisor 00)
      </footer>

      {/* Painel de detalhe + execução */}
      <AnimatePresence>
        {selected && (
          <CharacterDetailPanel
            key={selected.id}
            entry={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
