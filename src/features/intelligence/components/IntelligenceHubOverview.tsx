import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  LayoutGrid,
  ListFilter,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { Card, CardDescription, CardTitle } from '../../../components/ui/Card.js';
import { PageTitleCard } from '../../../components/ui/PageTitleCard.js';
import { staggerContainer } from '../../../lib/motion.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import {
  CATEGORIES,
  CATEGORY_SHORT_LABELS,
  type IntelligenceTab,
  TOOL_DEFINITIONS,
  type ToolCategory,
  type ToolDefinition,
  type ViewMode,
} from './intelligenceHub.catalog.js';

export interface IntelligencePillarCluster {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  tools: ToolDefinition[];
}

interface IntelligenceHubOverviewProps {
  filteredTools: ToolDefinition[];
  pinnedTools: ToolDefinition[];
  pillarClusters: IntelligencePillarCluster[];
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  pinnedIds: IntelligenceTab[];
  onTogglePin: (id: IntelligenceTab, e?: React.MouseEvent) => void;
  onOpenTool: (id: IntelligenceTab) => void;
}

export function IntelligenceHubOverview({
  filteredTools,
  pinnedTools,
  pillarClusters,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  pinnedIds,
  onTogglePin,
  onOpenTool,
}: IntelligenceHubOverviewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-transparent">
      <div className="bh-page bh-page-stack space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Executivo com Título e Subtítulo Autoritativo */}
        <PageTitleCard
          eyebrow="SISTEMA OPERACIONAL DE INTELIGÊNCIA COMERCIAL"
          title="Hub de Inteligência Artificial & Agentes"
          subtitle="Command Center unificado para orquestração da célula de agentes autônomos, geração tática de abordagens, governança human-in-the-loop e inferência Groq de alta performance."
          icon={<Cpu className="h-5 w-5 text-brand" />}
          accent="iris"
        />

        {/* Barra de Status Operacional e Métricas em Tempo Real */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Users,
              box: 'bg-brand/15 border-brand/30 text-brand',
              dot: 'bg-emerald-500 animate-pulse',
              title: 'Célula Autônoma',
              value: '12 Agentes Prontos',
            },
            {
              icon: Gauge,
              box: 'bg-amber-500/15 border-amber-500/30 text-amber-500',
              dot: 'bg-amber-500',
              title: 'Groq Cloud LPU',
              value: 'Ultra-Low Latency',
            },
            {
              icon: ShieldCheck,
              box: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500',
              dot: 'bg-emerald-500',
              title: 'Governança & Evals',
              value: 'Guardrails Ativos',
            },
            {
              icon: Database,
              box: 'bg-sky-500/15 border-sky-500/30 text-sky-500',
              dot: 'bg-sky-500',
              title: 'Base Vetorial',
              value: 'RAG Híbrido Conectado',
            },
          ].map((item) => {
            const StatusIcon = item.icon;
            return (
              <div
                key={item.title}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#15171C]/90 border border-line/80 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02]"
              >
                <div
                  className={`w-9 h-9 rounded-control border flex items-center justify-center shrink-0 ${item.box}`}
                >
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase tracking-wider font-mono">
                    {item.title}
                  </p>
                  <p className="text-xs font-black text-[#0F2942] dark:text-[#E2F1FF] truncate flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner Hero de Destaque: Célula Comercial de Agentes (Apenas na visão geral sem busca ativa) */}
        {selectedCategory === 'all' && searchQuery.trim() === '' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-card-lg overflow-hidden border border-brand/35 bg-gradient-to-br from-surface via-surface to-surface-2 dark:from-[#14141A] dark:via-[#0F1015] dark:to-[#0A0B0E] p-6 sm:p-8 shadow-elevated"
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-1/3 -bottom-24 h-64 w-64 rounded-full bg-iris/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-brand text-on-brand shadow-glow-brand">
                    <Zap className="w-3 h-3" /> FLAGSHIP DO HUB
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Next Best Action Operacional
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
                  Célula Comercial de Agentes Autônomos
                </h2>

                <p className="text-sm text-ink-2 leading-relaxed">
                  Workspace executivo dos 12 agentes especializados da Tríade Comercial (BDR, SDR,
                  Closer e Gestão de Contas) integrados a traces de governança, memória de contexto
                  e execução sincronizada.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-ink-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <span>12 Agentes Especialistas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-iris" />
                    <span>Tríade & Swarm Híbridos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Zero Alucinação com Guardrails</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onOpenTool('commercial_cell')}
                  className="w-full sm:w-auto bg-gradient-to-r bg-brand hover:bg-brand-hover text-on-brand font-display font-bold shadow-glow-brand hover:opacity-95 transition-all text-sm gap-2"
                >
                  Acessar Célula Comercial <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Barra de Capacidades Fixadas / Favoritos (se existirem ferramentas fixadas) */}
        {pinnedTools.length > 0 && searchQuery.trim() === '' && selectedCategory === 'all' && (
          <div className="p-3.5 rounded-card bg-surface/80 dark:bg-surface-elevated/80 border border-line">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-ink-2 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Capacidades Fixadas ({pinnedTools.length})
              </span>
              <span className="text-[10px] text-ink-2">Acesso rápido diário</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {pinnedTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={`pinned-${tool.id}`}
                    type="button"
                    onClick={() => onOpenTool(tool.id)}
                    className="flex items-center justify-between p-2.5 rounded-control bg-surface-2 hover:bg-surface border border-line hover:border-brand/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-on-brand transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate group-hover:text-brand transition-colors">
                          {tool.label}
                        </p>
                        <p className="text-[10px] text-ink-2 truncate">{tool.badge}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-ink-2 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Barra de Navegação por Categorias, Campo de Busca e Alternador de Modo de Visualização */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Categorias / Filtros Pills */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
              role="tablist"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const count =
                  cat.id === 'all'
                    ? TOOL_DEFINITIONS.length
                    : TOOL_DEFINITIONS.filter((t) => t.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      SoundFX.play('click');
                      onSelectCategory(cat.id);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00D4FF] text-[#0A1626] font-extrabold shadow-[0_0_14px_rgba(0,212,255,0.4)]'
                        : 'bg-white dark:bg-[#15171C] text-[#3B5A75] dark:text-[#94B3CD] hover:text-[#0F2942] dark:hover:text-white hover:bg-surface-2 border border-line/80 shadow-xs'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-black/20 text-on-brand'
                          : 'bg-surface-2 text-ink-2 border border-line'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Controles da Direita: Input de Busca + Alternador Grid / Matrix */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Input de Busca Rápida */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar capacidade, script, groq..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full rounded-full border border-line/80 bg-white dark:bg-[#15171C] pl-9 pr-8 py-2 text-xs text-[#0F2942] dark:text-[#E2F1FF] placeholder:text-[#5B7B98] focus:outline-none focus:border-[#00D4FF] focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink p-0.5 cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Alternador de Modo de Exibição (Grid vs. Matrix) */}
              <div className="flex items-center p-0.5 rounded-control bg-surface-2 border border-line shrink-0">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  title="Exibição em Cards (Bento Grid)"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-brand text-on-brand shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('matrix')}
                  title="Exibição Compacta (Command Matrix)"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-brand text-on-brand shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Subtítulo da categoria selecionada */}
          <div className="flex items-center justify-between text-xs text-ink-2 px-1">
            <span>
              Mostrando <strong className="text-ink font-semibold">{filteredTools.length}</strong>{' '}
              capacidade(s)
              {searchQuery && (
                <>
                  {' '}
                  para o termo &ldquo;
                  <span className="text-brand font-medium">{searchQuery}</span>
                  &rdquo;
                </>
              )}
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs text-brand hover:underline cursor-pointer"
              >
                Limpar busca
              </button>
            )}
          </div>
        </div>

        {/* Estado Vazio caso nenhuma busca retorne */}
        {filteredTools.length === 0 && (
          <div className="p-12 text-center rounded-card bg-surface-2 border border-dashed border-line space-y-3">
            <Search className="w-8 h-8 mx-auto text-ink-2 opacity-50" />
            <p className="text-sm font-semibold text-ink">
              Nenhuma ferramenta encontrada para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-ink-2 max-w-md mx-auto">
              Tente buscar por termos como &ldquo;bdr&rdquo;, &ldquo;groq&rdquo;,
              &ldquo;scripts&rdquo;, &ldquo;spin&rdquo; ou troque a categoria selecionada.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
            >
              Ver todas as 15 ferramentas
            </Button>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 1: BENTO GRID VIEW                                  */}
        {/* ======================================================== */}
        {filteredTools.length > 0 && viewMode === 'grid' && (
          <div className="space-y-8">
            {/* Se a visualização for 'all' e não houver termo de busca, exibe organizado por pilares */}
            {selectedCategory === 'all' && searchQuery.trim() === '' ? (
              pillarClusters.map((cluster) => {
                const PillarIcon = cluster.icon;
                return (
                  <section key={cluster.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-control bg-surface-2 border border-line flex items-center justify-center text-brand shrink-0">
                          <PillarIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-ink tracking-tight">
                            {cluster.label}
                          </h3>
                          <p className="text-xs text-ink-2 hidden sm:block">{cluster.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-ink-2 bg-surface-2 border border-line px-2 py-0.5 rounded-full">
                        {cluster.tools.length} capacidades
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cluster.tools.map((tool) => {
                        const Icon = tool.icon;
                        const isPinned = pinnedIds.includes(tool.id);

                        return (
                          <div key={tool.id} className="relative h-full group">
                            <Card
                              variant="interactive"
                              padding="sm"
                              onClick={() => onOpenTool(tool.id)}
                              className={`h-full flex flex-col justify-between rounded-[1.5rem] border border-line/80 group-hover:border-[#00D4FF]/50 bg-white/95 dark:bg-[#15171C]/95 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)] transition-all duration-200 cursor-pointer ${tool.isFlagship ? 'ring-1 ring-[#00D4FF]/40' : ''}`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-3 pr-7">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-control bg-brand/10 border border-brand/25 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand group-hover:text-on-brand transition-all duration-200">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <CardTitle className="text-xs font-black text-[#0F2942] dark:text-[#E2F1FF] group-hover:text-[#00D4FF] transition-colors line-clamp-1">
                                        {tool.label}
                                      </CardTitle>
                                      <span className="text-[10px] font-mono font-bold text-[#0284c7] dark:text-[#00D4FF] truncate block mt-0.5">
                                        {tool.badge}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <CardDescription className="text-xs text-[#3B5A75] dark:text-[#94B3CD] leading-relaxed line-clamp-3 mt-1">
                                  {tool.description}
                                </CardDescription>
                              </div>
                              <div className="mt-3.5 pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-ink-2 truncate max-w-[150px]">
                                  {tool.techMeta}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#00D4FF]/10 text-[#0284c7] dark:text-[#00D4FF] border border-[#00D4FF]/30 group-hover:bg-[#00D4FF] group-hover:text-[#0A1626] transition-all shrink-0">
                                  Acessar <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </Card>
                            <button
                              type="button"
                              onClick={(e) => onTogglePin(tool.id, e)}
                              title={isPinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                              className={`absolute top-4 right-4 z-20 p-1 rounded-md transition-colors cursor-pointer shrink-0 ${isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-ink-2/40 hover:text-ink-2'}`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              /* Visualização em grade plana quando filtrado por categoria ou termo de busca */
              <motion.nav
                aria-label="Capacidades de Inteligência Artificial"
                variants={staggerContainer()}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  const isPinned = pinnedIds.includes(tool.id);

                  return (
                    <div key={tool.id} className="relative h-full group">
                      <Card
                        variant="interactive"
                        padding="sm"
                        onClick={() => onOpenTool(tool.id)}
                        className={`h-full flex flex-col justify-between rounded-[1.5rem] border border-line/80 group-hover:border-[#00D4FF]/50 bg-white/95 dark:bg-[#15171C]/95 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)] transition-all duration-200 cursor-pointer ${tool.isFlagship ? 'ring-1 ring-[#00D4FF]/40' : ''}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3.5 pr-7">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-control bg-brand/10 border border-brand/25 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand group-hover:text-on-brand transition-all duration-200">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-black text-[#0F2942] dark:text-[#E2F1FF] group-hover:text-[#00D4FF] transition-colors line-clamp-1">
                                  {tool.label}
                                </CardTitle>
                                <span className="text-[10px] font-medium text-ink-2 uppercase tracking-wider block">
                                  {CATEGORY_SHORT_LABELS[tool.category]}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold py-0.5 px-2 bg-surface-2 border-line text-ink-2 shrink-0"
                            >
                              {tool.badge}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-[#3B5A75] dark:text-[#94B3CD] leading-relaxed line-clamp-3">
                            {tool.description}
                          </CardDescription>
                        </div>
                        <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-ink-2 truncate max-w-[190px]">
                            {tool.techMeta}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#00D4FF]/10 text-[#0284c7] dark:text-[#00D4FF] border border-[#00D4FF]/30 group-hover:bg-[#00D4FF] group-hover:text-[#0A1626] transition-all shrink-0">
                            Acessar <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Card>
                      <button
                        type="button"
                        onClick={(e) => onTogglePin(tool.id, e)}
                        title={isPinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                        className={`absolute top-4 right-4 z-20 p-1 rounded-md transition-colors cursor-pointer ${isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-ink-2/40 hover:text-ink-2'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </motion.nav>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 2: DENSE COMMAND MATRIX (Alta Densidade Operacional)  */}
        {/* ======================================================== */}
        {filteredTools.length > 0 && viewMode === 'matrix' && (
          <div className="rounded-card border border-line bg-surface/90 dark:bg-surface-elevated/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-2/70 text-ink-2 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold w-12 text-center">Pin</th>
                    <th className="py-3 px-4 font-semibold">Capacidade / Agente</th>
                    <th className="py-3 px-4 font-semibold">Pilar Operacional</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">
                      Stack & Metadados
                    </th>
                    <th className="py-3 px-4 font-semibold">Destaque</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    const isPinned = pinnedIds.includes(tool.id);

                    return (
                      <tr
                        key={tool.id}
                        onClick={() => onOpenTool(tool.id)}
                        className="hover:bg-surface-2/80 transition-colors cursor-pointer group"
                      >
                        {/* Pin Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => onTogglePin(tool.id, e)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              isPinned
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-ink-2/30 hover:text-ink-2'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                          </button>
                        </td>

                        {/* Nome e Ícone */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-control bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-on-brand transition-colors">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-ink group-hover:text-brand transition-colors">
                                {tool.label}
                              </p>
                              <p className="text-[11px] text-ink-2 line-clamp-1 max-w-sm">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-ink-2">
                            {CATEGORY_SHORT_LABELS[tool.category]}
                          </span>
                        </td>

                        {/* Stack Metadados */}
                        <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-ink-2">
                          {tool.techMeta}
                        </td>

                        {/* Badge de Destaque */}
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold py-0.5 px-2 bg-surface-2 border-line text-ink-2 whitespace-nowrap"
                          >
                            {tool.badge}
                          </Badge>
                        </td>

                        {/* Ação */}
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-1 transition-transform">
                            Executar <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
