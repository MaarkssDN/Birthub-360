import { useMemo, useState } from 'react';
import {
  CHARACTER_CATALOG,
  CHARACTER_STATES,
  getCharactersByLayer,
  type CharacterDefinition,
  type CharacterLayer,
  type CharacterState,
} from './characterCatalog.js';

/**
 * Galeria interna de validação dos 29 personagens digitais oficiais.
 *
 * Rota interna `/app/characters` — NÃO entra na navegação principal (Sidebar,
 * Command Palette, ModuleAgentWidget): é uma superfície de homologação para
 * designers, QA e revisão independente (Agente 24). Mostra todas as camadas do
 * ecossistema sem sugerir vínculos operacionais inexistentes.
 */

const LAYER_LABELS: Record<CharacterLayer, string> = {
  pillar: 'Camada 5 — Pilares (9 originais)',
  'commercial-agent': 'Camada 2 — Agentes Comerciais de Runtime (15)',
  'channel-agent': 'Camada 3 — Canais e Voz (4)',
  orchestration: 'Camada 7 — Orquestração (1)',
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

function CharacterCard({
  character,
  state,
  previewTheme,
}: {
  character: CharacterDefinition;
  state: CharacterState;
  previewTheme: 'dark' | 'light';
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      className="bh-character-card flex flex-col gap-3"
      data-testid={`character-card-${character.id}`}
      aria-label={`${character.name} — ${character.role}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${character.badgeGradient} shrink-0 bh-character-avatar`}
          data-state={state}
          style={{ boxShadow: character.palette.halo }}
        >
          {imgFailed ? (
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: character.headingColor }}
              aria-hidden="true"
            >
              {character.name.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <img
              src={character.svg}
              alt={character.ariaLabel}
              className="w-9 h-9"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>
        <div className="min-w-0">
          <h3
            className="font-bold text-sm leading-tight"
            style={{ color: character.headingColor, fontFamily: 'Sora, sans-serif' }}
          >
            {character.name}
          </h3>
          <p
            className="text-[11px] font-medium mt-0.5"
            style={{ color: character.subheadingColor }}
          >
            {character.role}
          </p>
          <p className="text-[10px] font-mono text-[#F8F9FF]/50 mt-1 truncate">
            id: {character.id} · {character.command}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-[#F8F9FF]/70 leading-relaxed">
        {character.accessibleDescription}
      </p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
        <div>
          <dt className="text-[#F8F9FF]/40 uppercase tracking-wide">Camada</dt>
          <dd className="text-[#F8F9FF]/80">{character.layer}</dd>
        </div>
        <div>
          <dt className="text-[#F8F9FF]/40 uppercase tracking-wide">Vínculo</dt>
          <dd className="text-[#F8F9FF]/80">
            {character.linkedAgentId ?? character.contextGroup ?? '—'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[#F8F9FF]/40 uppercase tracking-wide">Módulos</dt>
          <dd className="text-[#F8F9FF]/80 break-words">
            {character.modules.length > 0 ? character.modules.join(', ') : 'transversal'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[#F8F9FF]/40 uppercase tracking-wide">Arquítipo</dt>
          <dd className="text-[#F8F9FF]/80">{character.archetype}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[#F8F9FF]/40 uppercase tracking-wide">Assinatura</dt>
          <dd className="text-[#F8F9FF]/80">{character.animationSignature}</dd>
        </div>
      </dl>

      {/* Amostras de paleta */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[character.palette.primary, character.palette.secondary, character.palette.accent].map(
          (color) => (
            <span
              key={color}
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: color }}
            />
          ),
        )}
        <span className="text-[10px] font-mono text-[#F8F9FF]/50 ml-1">{previewTheme}</span>
      </div>

      <p className="text-[10px] text-[#F8F9FF]/40 font-mono">aria: {character.ariaLabel}</p>
    </article>
  );
}

export function CharacterGalleryView() {
  const [state, setState] = useState<CharacterState>('idle');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  const grouped = useMemo(
    () =>
      LAYER_ORDER.map((layer) => ({
        layer,
        label: LAYER_LABELS[layer],
        characters: getCharactersByLayer(layer),
      })),
    [],
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" data-testid="character-gallery">
      <header className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#00D4FF]">
          Birth Hub 360° · Superfície interna de homologação
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: '#FFC107', fontFamily: 'Sora, sans-serif' }}
        >
          Galeria Oficial de Personagens
        </h1>
        <p className="text-sm text-[#F8F9FF]/70 max-w-3xl">
          Catálogo canônico dos {CHARACTER_CATALOG.length} personagens digitais: 9 pilares originais
          preservados + 20 identidades vinculadas a agentes reais de runtime, canais de voz e
          orquestração. Nenhum vínculo operacional é inventado — personagens sem agente direto estão
          marcados como identidade de interface.
        </p>
      </header>

      {/* Controles de validação */}
      <div className="flex flex-wrap items-center gap-3">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="text-[11px] font-mono uppercase tracking-wide text-[#F8F9FF]/50 mr-2">
            Estado operacional
          </legend>
          {CHARACTER_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              aria-pressed={state === s}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                state === s
                  ? 'bg-brand/20 border-brand text-brand'
                  : 'bg-white/5 border-white/10 text-[#F8F9FF]/70 hover:border-white/30'
              }`}
            >
              {STATE_LABELS[s]}
            </button>
          ))}
        </fieldset>

        <fieldset className="flex items-center gap-2">
          <legend className="text-[11px] font-mono uppercase tracking-wide text-[#F8F9FF]/50 mr-2">
            Tema de prévia
          </legend>
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreviewTheme(t)}
              aria-pressed={previewTheme === t}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                previewTheme === t
                  ? 'bg-brand/20 border-brand text-brand'
                  : 'bg-white/5 border-white/10 text-[#F8F9FF]/70 hover:border-white/30'
              }`}
            >
              {t === 'dark' ? 'Escuro' : 'Claro'}
            </button>
          ))}
        </fieldset>
      </div>

      {/* Seções por camada */}
      {grouped.map(({ layer, label, characters }) => (
        <section key={layer} aria-labelledby={`layer-${layer}`} className="space-y-4">
          <h2
            id={`layer-${layer}`}
            className="text-lg font-semibold flex items-center gap-3"
            style={{ color: '#00D4FF', fontFamily: 'Sora, sans-serif' }}
          >
            {label}
            <span className="text-[11px] font-mono text-[#F8F9FF]/40 font-normal">
              {characters.length} personagem(ns)
            </span>
          </h2>
          <div
            className={
              previewTheme === 'light'
                ? 'theme-light grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }
          >
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                state={state}
                previewTheme={previewTheme}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="text-[11px] font-mono text-[#F8F9FF]/40 pt-4 border-t border-white/10">
        Registro canônico: src/features/characters/characterCatalog.ts · SVGs:
        /brand/characters/*.svg · Tokens: identidade-visual/birthhub360/tokens/characters.* ·
        Estados: bh-character-avatar[data-state]
      </footer>
    </div>
  );
}
