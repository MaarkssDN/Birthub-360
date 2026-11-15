import {
  BarChart3,
  BrainCircuit,
  Compass,
  Layers,
  LayoutGrid,
  Orbit,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BentoEditorialView,
  GridModularView,
  HubOrbitalView,
  WorkflowPipelineView,
} from './CentralModulesHomeViews.js';
import { PRODUCT_MODULES, type ProductModule } from '../../components/layout/moduleRegistry.js';
import { getModuleTheme } from '../../components/layout/moduleThemes.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useOptionalTheme } from '../../contexts/ThemeContext.js';
import { SoundFX } from '../../lib/soundEffects.js';

export type HomeLayoutType = 'bento' | 'grid' | 'hub' | 'flow';

const STORAGE_KEY = '@birthhub:home-layout';

function getInitialLayout(paramLayout: string | null): HomeLayoutType {
  if (
    paramLayout === 'bento' ||
    paramLayout === 'grid' ||
    paramLayout === 'hub' ||
    paramLayout === 'flow'
  ) {
    return paramLayout;
  }
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'bento' || saved === 'grid' || saved === 'hub' || saved === 'flow') {
      return saved as HomeLayoutType;
    }
  }
  return 'bento';
}

export function CentralModulesHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const themeContext = useOptionalTheme();
  const theme = themeContext?.theme ?? 'dark';
  const isDark = theme === 'dark';

  const [layout, setLayout] = useState<HomeLayoutType>(() =>
    getInitialLayout(searchParams.get('layout')),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleSelectLayout = (newLayout: HomeLayoutType) => {
    SoundFX.play('navigate');
    setLayout(newLayout);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('layout', newLayout);
      return next;
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newLayout);
    }
  };

  const categories = useMemo(() => {
    return [
      { id: 'all', label: 'Todos os Módulos (11)' },
      { id: 'vendas', label: 'Vendas & CRM' },
      { id: 'ia', label: 'Inteligência & IA' },
      { id: 'operacoes', label: 'Operações & Canais' },
    ];
  }, []);

  const filteredModules = useMemo(() => {
    return PRODUCT_MODULES.filter((module) => {
      const modTheme = getModuleTheme(module.id);
      const matchesSearch =
        searchQuery.trim() === '' ||
        module.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modTheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modTheme.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCategory === 'vendas') {
        return ['p01', 'p02', 'p03', 'p04'].includes(module.id);
      }
      if (activeCategory === 'ia') {
        return ['p05', 'p06', 'p07'].includes(module.id);
      }
      if (activeCategory === 'operacoes') {
        return ['p08', 'm09', 'm10', 'm11'].includes(module.id);
      }
      return true;
    });
  }, [searchQuery, activeCategory]);

  const handleNavigateToModule = (module: ProductModule) => {
    if (module.availability === 'mobile' || !module.home) {
      return;
    }
    SoundFX.play('confirm');
    if (module.external) {
      window.location.assign(module.home);
    } else {
      void navigate(module.home);
    }
  };

  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || 'Comandante';

  return (
    <div className="relative min-h-full w-full bg-bg text-ink px-4 py-6 md:px-8 lg:px-12">
      {/* Background decorativo com grids sutis */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-25"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(139,125,255,0.06) 0%, transparent 40%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header da Home */}
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-line/70 pb-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
              <Sparkles className="h-3 w-3" />
              <span>Portal de Entrada · Birth Hub 360°</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">
              Olá, {firstName} — Central de Módulos
            </h1>
            <p className="mt-1 text-sm md:text-base text-ink-2 max-w-2xl">
              Navegue pelos 11 workspaces oficiais do sistema comercial integrado. Escolha o módulo
              desejado ou alterne a proposta de visualização no laboratório.
            </p>
          </div>

          {/* Atalho para o Dashboard Operacional e Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:border-brand/50 hover:bg-surface-2 transition-all shadow-sm"
            >
              <BarChart3 className="h-4 w-4 text-brand" />
              <span>Dashboard de Métricas</span>
            </Link>
            <Link
              to="/app/intelligence"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:border-iris/50 hover:bg-surface-2 transition-all shadow-sm"
            >
              <BrainCircuit className="h-4 w-4 text-iris" />
              <span>Hub de IA</span>
            </Link>
          </div>
        </header>

        {/* Laboratório de Organização — Seletor das 3 Alternativas */}
        <section
          aria-label="Laboratório de Propostas de Organização da Home"
          className="mb-8 rounded-2xl border border-line/80 bg-surface/90 p-4 shadow-sm backdrop-blur-md"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                Laboratório Visual — Escolha a Proposta de Home:
              </span>
            </div>

            {/* Alternativas A, B e C */}
            <div className="inline-flex flex-wrap rounded-xl border border-line/90 bg-bg p-1 text-xs">
              <button
                type="button"
                onClick={() => handleSelectLayout('bento')}
                aria-pressed={layout === 'bento'}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                  layout === 'bento'
                    ? 'bg-surface text-brand font-semibold shadow-sm border border-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Alternativa A: Bento Editorial 360°</span>
                <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                  Preferencial
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLayout('grid')}
                aria-pressed={layout === 'grid'}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                  layout === 'grid'
                    ? 'bg-surface text-brand font-semibold shadow-sm border border-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Alternativa B: Grid Modular</span>
                <span className="rounded bg-neon-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon-gold">
                  Balanceado
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLayout('hub')}
                aria-pressed={layout === 'hub'}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                  layout === 'hub'
                    ? 'bg-surface text-brand font-semibold shadow-sm border border-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Orbit className="h-3.5 w-3.5" />
                <span>Alternativa C: Hub 360° Interativo</span>
                <span className="rounded bg-iris/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-iris">
                  Orbital
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLayout('flow')}
                aria-pressed={layout === 'flow'}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                  layout === 'flow'
                    ? 'bg-surface text-brand font-semibold shadow-sm border border-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Workflow className="h-3.5 w-3.5" />
                <span>Alternativa D: Esteira de Ciclo de Vendas</span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Pipeline
                </span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros e Busca Rápida */}
          <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-line/50 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand/15 text-brand border border-brand/40 font-semibold'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface hover:text-ink border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar módulos ou recursos..."
                aria-label="Filtrar módulos ou recursos"
                className="w-full rounded-xl border border-line bg-surface py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink-2/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            RENDERIZAÇÃO DA PROPOSTA SELECIONADA
        ═════════════════════════════════════════════════════════════════════ */}

        {layout === 'bento' && (
          <BentoEditorialView
            modules={filteredModules}
            onNavigate={handleNavigateToModule}
            isDark={isDark}
          />
        )}

        {layout === 'grid' && (
          <GridModularView
            modules={filteredModules}
            onNavigate={handleNavigateToModule}
            isDark={isDark}
          />
        )}

        {layout === 'hub' && (
          <HubOrbitalView
            modules={filteredModules}
            onNavigate={handleNavigateToModule}
            isDark={isDark}
          />
        )}

        {layout === 'flow' && (
          <WorkflowPipelineView
            modules={filteredModules}
            onNavigate={handleNavigateToModule}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}
