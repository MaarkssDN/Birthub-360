import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  LayoutDashboard,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import {
  type DashboardRole,
  type KpiId,
  KPIS_METADATA,
  ROLE_DEFAULT_TEMPLATES,
  type WidgetId,
  WIDGETS_METADATA,
} from '../hooks/useDashboardLayout.js';

interface DashboardBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: DashboardRole;
  onSelectRole: (role: DashboardRole) => void;
  activeWidgets: WidgetId[];
  visibleKpis: KpiId[];
  isCustomized: boolean;
  onSave: (widgets: WidgetId[], kpis: KpiId[]) => void;
  onReset: () => void;
}

const ALL_WIDGET_IDS: WidgetId[] = [
  'realtimeCockpit',
  'productivityHeatmap',
  'commercialJourney',
  'pipelineFunnel',
  'quickActions',
  'aiOrchestrator',
  'gamification',
];

const ALL_KPI_IDS: KpiId[] = [
  'pipelineValue',
  'winRate',
  'pendingActivities',
  'totalCompanies',
  'closedThisMonth',
  'leadsToday',
  'wonRevenueMonth',
];

export function DashboardBuilderModal({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  activeWidgets,
  visibleKpis,
  isCustomized,
  onSave,
  onReset,
}: DashboardBuilderModalProps) {
  // Estado de trabalho local para poder cancelar sem aplicar
  const [selectedRole, setSelectedRole] = useState<DashboardRole>(currentRole);
  const [orderedWidgets, setOrderedWidgets] = useState<WidgetId[]>(() => {
    // Garantir que todos os widgets estejam presentes na lista para reordenação
    const missing = ALL_WIDGET_IDS.filter((id) => !activeWidgets.includes(id));
    return [...activeWidgets, ...missing];
  });
  const [enabledWidgets, setEnabledWidgets] = useState<Set<WidgetId>>(new Set(activeWidgets));
  const [selectedKpis, setSelectedKpis] = useState<KpiId[]>(visibleKpis);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (role: DashboardRole) => {
    setSelectedRole(role);
    onSelectRole(role);
    const tpl = ROLE_DEFAULT_TEMPLATES[role];
    setOrderedWidgets(tpl.activeWidgets);
    setEnabledWidgets(new Set(tpl.activeWidgets));
    setSelectedKpis(tpl.visibleKpis);
  };

  const handleToggleWidget = (id: WidgetId) => {
    setEnabledWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev; // Mantém pelo menos 1
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleKpi = (id: KpiId) => {
    setSelectedKpis((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedWidgets.length) return;
    const newItems = [...orderedWidgets];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setOrderedWidgets(newItems);
  };

  const handleSaveAndApply = () => {
    const filteredWidgets = orderedWidgets.filter((id) => enabledWidgets.has(id));
    onSave(filteredWidgets, selectedKpis);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    onReset();
    const tpl = ROLE_DEFAULT_TEMPLATES[selectedRole];
    setOrderedWidgets(tpl.activeWidgets);
    setEnabledWidgets(new Set(tpl.activeWidgets));
    setSelectedKpis(tpl.visibleKpis);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-builder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-overlay backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-3xl my-8 rounded-2xl border border-line bg-surface-elevated shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-surface/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="dashboard-builder-title"
                  className="text-lg font-bold text-ink font-display"
                >
                  Dashboard Builder & Personalização por Cargo
                </h2>
                {isCustomized && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand/10 text-brand border border-brand/20">
                    Customizado
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-2 font-interface">
                Escolha o perfil de atuação comercial e reordene os blocos de acordo com sua rotina.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CONTEÚDO SCROLLÁVEL ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SELEÇÃO DO PERFIL / ROLE */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-2 font-interface">
              1. Perfil Operacional (Template Base)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['SDR', 'CLOSER', 'GESTOR'] as DashboardRole[]).map((r) => {
                const tpl = ROLE_DEFAULT_TEMPLATES[r];
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand bg-brand/5 ring-2 ring-brand/30 shadow-sm'
                        : 'border-line bg-surface hover:bg-surface-2'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-ink font-display">{r}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-2 font-interface leading-snug">
                        {tpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELEÇÃO DOS 4 KPIS DO TOPO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2 font-interface">
                2. Indicadores Chave no Topo ({selectedKpis.length}/4 selecionados)
              </label>
              <span className="text-[11px] text-ink-3">Máximo de 4 cartões simultâneos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ALL_KPI_IDS.map((kpiId) => {
                const meta = KPIS_METADATA[kpiId];
                const isChecked = selectedKpis.includes(kpiId);
                return (
                  <button
                    key={kpiId}
                    type="button"
                    onClick={() => handleToggleKpi(kpiId)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer flex flex-col justify-between ${
                      isChecked
                        ? 'border-brand/40 bg-brand/10 text-ink font-semibold'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] leading-tight font-display">{meta.label}</span>
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isChecked
                            ? 'bg-brand border-brand text-brand-foreground'
                            : 'border-line bg-surface'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REORDENAÇÃO & ATIVAÇÃO DOS WIDGETS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2 font-interface">
                3. Organização dos Blocos (Arraste ou use as setas para reordenar)
              </label>
              <span className="text-[11px] text-ink-3">{enabledWidgets.size} blocos visíveis</span>
            </div>

            <Reorder.Group
              axis="y"
              values={orderedWidgets}
              onReorder={setOrderedWidgets}
              className="space-y-2"
            >
              {orderedWidgets.map((widgetId, index) => {
                const meta = WIDGETS_METADATA[widgetId];
                const isEnabled = enabledWidgets.has(widgetId);

                return (
                  <Reorder.Item
                    key={widgetId}
                    value={widgetId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 bg-surface select-none transition-colors ${
                      isEnabled
                        ? 'border-line text-ink'
                        : 'border-line/40 bg-surface-2/60 text-ink-3 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-ink-3 hover:text-ink p-1">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-display">{meta.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-surface-2 text-ink-2 border border-line">
                            {meta.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-2 font-interface line-clamp-1">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botões de Mover para Acessibilidade por Teclado */}
                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-surface-2 text-ink-3 hover:text-ink disabled:opacity-30 cursor-pointer"
                        title="Mover para cima"
                        aria-label={`Mover ${meta.name} para cima`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'down')}
                        disabled={index === orderedWidgets.length - 1}
                        className="p-1 rounded hover:bg-surface-2 text-ink-3 hover:text-ink disabled:opacity-30 cursor-pointer"
                        title="Mover para baixo"
                        aria-label={`Mover ${meta.name} para baixo`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão de Visibilidade */}
                      <button
                        type="button"
                        onClick={() => handleToggleWidget(widgetId)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-brand/10 border-brand/20 text-brand'
                            : 'bg-surface-2 border-line text-ink-3'
                        }`}
                        title={isEnabled ? 'Ocultar do dashboard' : 'Exibir no dashboard'}
                        aria-label={`${isEnabled ? 'Ocultar' : 'Exibir'} ${meta.name}`}
                      >
                        {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        </div>

        {/* ── FOOTER COM AÇÕES ─────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-line bg-surface/60 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-ink-2 hover:text-ink gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão do Cargo</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={handleSaveAndApply}
              className="text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Layout Salvo!</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Salvar e Aplicar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
