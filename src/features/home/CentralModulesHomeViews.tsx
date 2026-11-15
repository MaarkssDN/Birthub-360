import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { BirthHubLogo } from '../../components/brand/BirthHubLogo.js';
import type { ProductModule } from '../../components/layout/moduleRegistry.js';
import { getModuleTheme } from '../../components/layout/moduleThemes.js';

// Views de layout da Central de Módulos — extraídas de CentralModulesHome.tsx
// (MEL-25, Agente 23) sem alteração de comportamento. Cada view recebe o mesmo
// contrato: modules filtrados, onNavigate e isDark.

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSTA A: BENTO EDITORIAL 360° (PREFERENCIAL)
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalProps {
  modules: ProductModule[];
  onNavigate: (module: ProductModule) => void;
  isDark: boolean;
}

export function BentoEditorialView({ modules, onNavigate, isDark }: ProposalProps) {
  // Define o mapeamento de classes bento para dar destaque editorial proporcional
  const getBentoSpan = (id: string) => {
    switch (id) {
      case 'p01': // Hub Comercial - Hero principal 1 (Amplo)
        return 'md:col-span-2 lg:col-span-8 lg:row-span-2';
      case 'p06': // Inteligência Artificial - Hero principal 2 (Inovação)
        return 'md:col-span-2 lg:col-span-4 lg:row-span-2';
      case 'p02': // Inteligência de Mercado - Destaque médio
        return 'md:col-span-1 lg:col-span-4';
      case 'p03': // Orquestração de Vendas
        return 'md:col-span-1 lg:col-span-4';
      case 'p04': // Performance Comercial
        return 'md:col-span-1 lg:col-span-4';
      case 'p05': // Previsibilidade
        return 'md:col-span-1 lg:col-span-4';
      case 'p07': // Automação
        return 'md:col-span-1 lg:col-span-4';
      case 'p08': // Engajamento
        return 'md:col-span-1 lg:col-span-4';
      case 'm09': // Admin
        return 'md:col-span-1 lg:col-span-4';
      case 'm10': // Mobile
        return 'md:col-span-1 lg:col-span-4';
      case 'm11': // Social Selling
        return 'md:col-span-1 lg:col-span-4';
      default:
        return 'md:col-span-1 lg:col-span-4';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[minmax(180px,auto)]">
      {modules.map((m) => {
        const theme = getModuleTheme(m.id);
        const Icon = m.icon;
        const isMobileOnly = m.availability === 'mobile';
        const isHero = m.id === 'p01' || m.id === 'p06';
        const themeStyles = isDark ? theme.dark : theme.light;

        return (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${
              themeStyles.border
            } ${themeStyles.borderHover} ${themeStyles.surface} p-6 transition-all duration-300 ${
              theme.hoverGlow
            } ${getBentoSpan(m.id)} ${
              isMobileOnly ? 'opacity-85' : 'cursor-pointer hover:-translate-y-1'
            }`}
            onClick={() => onNavigate(m)}
          >
            {/* Topo do Card */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-transparent shadow-sm transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 16%, transparent)`,
                    color: theme.primaryColor,
                    borderColor: `color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
                  }}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 14%, transparent)`,
                      color: theme.primaryColor,
                    }}
                  >
                    {theme.category}
                  </span>
                  {isMobileOnly && (
                    <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      App Mobile
                    </span>
                  )}
                </div>
              </div>

              {/* Título Oficial Comercial (sem prefixo técnico) */}
              <h3 className="font-display text-lg md:text-xl font-bold tracking-tight text-ink group-hover:text-[var(--brand)] transition-colors">
                {m.label}
              </h3>
              <p className="mt-1 text-xs md:text-sm text-ink-2 font-medium">{m.tagline}</p>
              <p className="mt-2 text-xs text-ink-2/80 line-clamp-2">{theme.description}</p>
            </div>

            {/* Recursos principais / Features reais */}
            <div className="mt-6 pt-4 border-t border-line/40">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {theme.features.slice(0, isHero ? 4 : 3).map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded-md bg-surface-2/80 px-2 py-0.5 text-[10px] font-medium text-ink-2"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              {/* Rodapé e Ação de Entrada */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span
                  style={{ color: theme.primaryColor }}
                  className="inline-flex items-center gap-1 group-hover:underline"
                >
                  {isMobileOnly ? (
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      <Smartphone className="h-3.5 w-3.5" />
                      Acesso pelo App Capacitor
                    </span>
                  ) : (
                    <>
                      <span>Acessar Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
                <span className="font-mono text-[10px] text-ink-2/50">
                  {m.external ? 'Top-level' : 'Workspace'}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSTA B: GRID MODULAR INTELIGENTE
// ─────────────────────────────────────────────────────────────────────────────

export function GridModularView({ modules, onNavigate, isDark }: ProposalProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {modules.map((m) => {
        const theme = getModuleTheme(m.id);
        const Icon = m.icon;
        const isMobileOnly = m.availability === 'mobile';
        const themeStyles = isDark ? theme.dark : theme.light;

        return (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`group relative flex flex-col justify-between rounded-2xl border ${
              themeStyles.border
            } ${themeStyles.borderHover} ${
              themeStyles.surface
            } p-5 transition-all duration-300 ${theme.hoverGlow} ${
              isMobileOnly ? 'opacity-85' : 'cursor-pointer hover:-translate-y-1'
            }`}
            onClick={() => onNavigate(m)}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-transparent shadow-sm"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 16%, transparent)`,
                    color: theme.primaryColor,
                    borderColor: `color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
                  }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <span
                  className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 14%, transparent)`,
                    color: theme.primaryColor,
                  }}
                >
                  {theme.category.split('&')[0]}
                </span>
              </div>

              <h3 className="font-display text-base font-bold text-ink group-hover:text-brand transition-colors">
                {m.label}
              </h3>
              <p className="mt-1 text-xs text-ink-2 font-medium line-clamp-1">{m.tagline}</p>
              <p className="mt-2 text-xs text-ink-2/80 line-clamp-2 leading-relaxed">
                {theme.description}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-line/40">
              <div className="flex flex-wrap gap-1 mb-3">
                {theme.features.slice(0, 2).map((feat, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-surface-2/80 px-1.5 py-0.5 text-[9px] text-ink-2"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              <div
                style={{ color: theme.primaryColor }}
                className="flex items-center justify-between text-xs font-semibold"
              >
                <span>{isMobileOnly ? 'Disponível no Mobile' : 'Entrar no Módulo'}</span>
                {!isMobileOnly && (
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSTA C: HUB 360° INTERATIVO (ORBITAL)
// ─────────────────────────────────────────────────────────────────────────────

export function HubOrbitalView({ modules, onNavigate, isDark }: ProposalProps) {
  // Organiza módulos em 3 constelações temáticas
  const clusters = useMemo(() => {
    return [
      {
        id: 'revenue',
        title: 'Cluster Comercial & Receita',
        description: 'Gestão direta de deals, clientes, contatos e jornadas de vendas.',
        color: '#00D4FF',
        ids: ['p01', 'p02', 'p03', 'm11'],
      },
      {
        id: 'intelligence',
        title: 'Cluster Cognitivo & Previsão',
        description: 'Copiloto de IA, radar de riscos, metas ponderadas e relatórios.',
        color: '#8B7DFF',
        ids: ['p04', 'p05', 'p06'],
      },
      {
        id: 'operations',
        title: 'Cluster Operacional & Conectividade',
        description: 'Automações com Bitrix24, telefonia, equipe e vendas em campo.',
        color: '#FF2D9B',
        ids: ['p07', 'p08', 'm09', 'm10'],
      },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Nó Central Orbital Birth Hub 360° */}
      <div className="relative overflow-hidden rounded-3xl border border-brand/40 bg-gradient-to-r from-brand/10 via-surface to-iris/10 p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/15 border border-brand/40 shadow-[0_0_25px_rgba(0,212,255,0.25)]">
              <BirthHubLogo variant="mark" animated className="h-9 w-9" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand" />
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand font-bold">
                Nó Central Operacional
              </span>
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-ink">
                Birth Hub 360° — Command Engine
              </h2>
              <p className="text-xs text-ink-2 max-w-xl">
                O centro neural sincroniza os 11 módulos em tempo real. Cada cluster abaixo agrupa
                capacidades convergentes do ecossistema comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-line bg-surface/90 px-3.5 py-2 text-center">
              <span className="block font-mono text-[10px] text-ink-2 uppercase">Módulos</span>
              <span className="font-display text-lg font-bold text-ink">11</span>
            </div>
            <div className="rounded-xl border border-line bg-surface/90 px-3.5 py-2 text-center">
              <span className="block font-mono text-[10px] text-ink-2 uppercase">Status</span>
              <span className="font-display text-xs font-bold text-emerald-500">100% ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seções por Cluster Orbital */}
      <div className="flex flex-col gap-8">
        {clusters.map((cluster) => {
          const clusterModules = modules.filter((m) => cluster.ids.includes(m.id));
          if (clusterModules.length === 0) return null;

          return (
            <div
              key={cluster.id}
              className="rounded-2xl border border-line/70 bg-surface/60 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between border-b border-line/40 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">{cluster.title}</h3>
                    <p className="text-xs text-ink-2">{cluster.description}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-ink-2">
                  {clusterModules.length} módulos ativos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {clusterModules.map((m) => {
                  const theme = getModuleTheme(m.id);
                  const Icon = m.icon;
                  const isMobileOnly = m.availability === 'mobile';
                  const themeStyles = isDark ? theme.dark : theme.light;

                  return (
                    <div
                      key={m.id}
                      onClick={() => onNavigate(m)}
                      className={`group flex flex-col justify-between rounded-xl border ${
                        themeStyles.border
                      } ${themeStyles.borderHover} ${
                        themeStyles.surface
                      } p-4 transition-all duration-200 ${theme.hoverGlow} ${
                        isMobileOnly ? 'opacity-85' : 'cursor-pointer hover:-translate-y-1'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg shadow-sm"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 16%, transparent)`,
                              color: theme.primaryColor,
                            }}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span
                            className="rounded px-2 py-0.5 text-[9px] font-bold uppercase"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
                              color: theme.primaryColor,
                            }}
                          >
                            {m.label.split(' ')[0]}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-ink group-hover:text-brand transition-colors">
                          {m.label}
                        </h4>
                        <p className="mt-1 text-[11px] text-ink-2 line-clamp-2">{m.tagline}</p>
                      </div>

                      <div
                        style={{ color: theme.primaryColor }}
                        className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between text-[11px] font-semibold"
                      >
                        <span>{isMobileOnly ? 'App Mobile' : 'Abrir'}</span>
                        {!isMobileOnly && (
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSTA D: ESTEIRA DA JORNADA DE VENDAS (PIPELINE FLOW)
// ─────────────────────────────────────────────────────────────────────────────

export function WorkflowPipelineView({ modules, onNavigate, isDark }: ProposalProps) {
  const stages = useMemo(() => {
    return [
      {
        id: 'discovery',
        step: '01',
        title: 'Atração & Inteligência de Mercado',
        subtitle: 'Mapeamento de TAM, prospecção ativa e sinais sociais de compra',
        color: '#FF2D9B',
        ids: ['p02', 'm11'],
      },
      {
        id: 'engagement',
        step: '02',
        title: 'Engajamento & Orquestração',
        subtitle: 'Playbooks, cadências multicanal, roteiros e mesa de tratamento',
        color: '#8B7DFF',
        ids: ['p03', 'p08'],
      },
      {
        id: 'closing',
        step: '03',
        title: 'Conversão & Inteligência Cognitiva',
        subtitle: 'Pipeline CRM 360°, propostas, decisores e copiloto IA em tempo real',
        color: '#00D4FF',
        ids: ['p01', 'p06'],
      },
      {
        id: 'predictability',
        step: '04',
        title: 'Previsibilidade & Escala de Performance',
        subtitle: 'Analytics de funil, ranking, metas e forecast ponderado',
        color: '#FFC107',
        ids: ['p04', 'p05'],
      },
      {
        id: 'ecosystem',
        step: '05',
        title: 'Operações, Campo & Governança',
        subtitle: 'Automações Bitrix24, vendas em campo offline e controle corporativo',
        color: '#FF6B35',
        ids: ['p07', 'm10', 'm09'],
      },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 rounded-2xl border border-line/80 bg-surface/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">
              Esteira da Jornada de Vendas — Revenue Flow 360°
            </h3>
            <p className="text-xs text-ink-2">
              Visualização sequencial dos 11 módulos distribuídos pelas 5 fases da esteira comercial
              de receita.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex rounded-full bg-surface-2 px-3 py-1 font-mono text-[10px] font-semibold text-ink-2">
          5 Etapas Consecutivas
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {stages.map((stage) => {
          const stageModules = modules.filter((m) => stage.ids.includes(m.id));
          if (stageModules.length === 0) return null;

          return (
            <div
              key={stage.id}
              className="rounded-2xl border border-line/70 bg-surface/60 p-5 md:p-6 backdrop-blur-sm transition-all"
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/40 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.step}
                  </span>
                  <div>
                    <h4 className="font-display text-base font-bold text-ink">{stage.title}</h4>
                    <p className="text-xs text-ink-2">{stage.subtitle}</p>
                  </div>
                </div>
                <span
                  className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full self-start sm:self-auto"
                  style={{
                    color: stage.color,
                    backgroundColor: `color-mix(in srgb, ${stage.color} 12%, transparent)`,
                  }}
                >
                  {stageModules.length} {stageModules.length === 1 ? 'módulo' : 'módulos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageModules.map((m) => {
                  const theme = getModuleTheme(m.id);
                  const Icon = m.icon;
                  const isMobileOnly = m.availability === 'mobile';
                  const themeStyles = isDark ? theme.dark : theme.light;

                  return (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onNavigate(m)}
                      className={`group flex flex-col justify-between rounded-xl border ${
                        themeStyles.border
                      } ${themeStyles.borderHover} ${
                        themeStyles.surface
                      } p-4 transition-all duration-200 ${theme.hoverGlow} ${
                        isMobileOnly ? 'opacity-85' : 'cursor-pointer hover:-translate-y-1'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 16%, transparent)`,
                              color: theme.primaryColor,
                              borderColor: `color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
                            }}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>

                          <span
                            className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
                              color: theme.primaryColor,
                            }}
                          >
                            {theme.category.split('&')[0]}
                          </span>
                        </div>

                        <h5 className="font-display text-base font-bold text-ink group-hover:text-brand transition-colors">
                          {m.label}
                        </h5>
                        <p className="mt-1 text-xs text-ink-2 font-medium line-clamp-1">
                          {m.tagline}
                        </p>
                        <p className="mt-2 text-xs text-ink-2/80 line-clamp-2 leading-relaxed">
                          {theme.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line/40">
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {theme.features.slice(0, 2).map((feat, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-surface-2/80 px-1.5 py-0.5 text-[9px] text-ink-2"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>

                        <div
                          style={{ color: theme.primaryColor }}
                          className="flex items-center justify-between text-xs font-semibold"
                        >
                          <span>
                            {isMobileOnly ? 'App Mobile (Capacitor)' : 'Acessar Workspace'}
                          </span>
                          {!isMobileOnly && (
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
