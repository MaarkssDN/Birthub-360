import { Settings2 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  isPillarSlug,
  PILLAR_SLUG_TO_NAME,
  PILLAR_SLUGS,
  type PillarSlug,
} from '../domain/pillarSettings.js';
import { PillarSettingsPlaceholder } from './PillarSettingsPlaceholder.js';

/**
 * Hub consolidado das configurações por pilar (MEL-30 / DEM-20261114-003, Onda 4).
 *
 * Antes desta consolidação existiam 8 rotas irmãs (`/app/settings_hub`,
 * `/app/settings_market`, …) cada uma renderizando `PillarSettingsPlaceholder`
 * isolada — o usuário não conseguia pular de um pilar para outro sem voltar à
 * navegação. Agora todas convergem para `/app/settings/pillars/:pillar`, que
 * mantém uma barra de pilares sempre visível acima do painel do pilar ativo.
 *
 * As rotas legadas `settings_*` viraram redirects `<Navigate>` em AppLayout.tsx
 * (nunca removidas — bookmarks, Command Palette, navigationBus e deep-links
 * continuam funcionando).
 */
export function PillarSettingsHub() {
  const { pillar } = useParams<{ pillar: string }>();

  // Slug inválido ou ausente → pilar default do hub (nunca 404 nem tela quebrada).
  const slug: PillarSlug = pillar && isPillarSlug(pillar) ? pillar : 'hub';

  // Slug ausente/inválido normaliza para a forma canônica — mantém deep-link
  // e activeTab consistentes (nunca 404 nem tela quebrada).
  if (pillar !== slug) {
    return <Navigate to={`/app/settings/pillars/${slug}`} replace />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      {/* Seletor de pilares — navegação interna do hub (deep-linkável). */}
      <nav
        aria-label="Pilares de configuração"
        className="shrink-0 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Settings2 className="w-4 h-4 shrink-0 text-[var(--ink-3)]" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)] mr-2 shrink-0">
            Pilares
          </span>
          {PILLAR_SLUGS.map((s) => {
            const isActive = s === slug;
            return (
              <Link
                key={s}
                to={`/app/settings/pillars/${s}`}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--nav-c-blue)]/10 text-[var(--nav-c-blue)] ring-1 ring-[var(--nav-c-blue)]/30'
                    : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                }`}
              >
                {PILLAR_SLUG_TO_NAME[s]}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Painel do pilar ativo — mesmo componente de antes, agora sob o hub. */}
      <div className="flex-1 min-h-0 flex flex-col">
        <PillarSettingsPlaceholder pillarName={PILLAR_SLUG_TO_NAME[slug]} />
      </div>
    </div>
  );
}
