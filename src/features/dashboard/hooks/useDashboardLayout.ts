import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js';

export type DashboardRole = 'SDR' | 'CLOSER' | 'GESTOR';

export type WidgetId =
  | 'realtimeCockpit'
  | 'productivityHeatmap'
  | 'commercialJourney'
  | 'unifiedTimeline'
  | 'pipelineFunnel'
  | 'quickActions'
  | 'aiOrchestrator'
  | 'gamification';

export type KpiId =
  | 'pipelineValue'
  | 'winRate'
  | 'pendingActivities'
  | 'totalCompanies'
  | 'closedThisMonth'
  | 'leadsToday'
  | 'wonRevenueMonth';

export interface WidgetMeta {
  id: WidgetId;
  name: string;
  category: 'Tempo Real' | 'Produtividade' | 'Pipeline' | 'Operações' | 'Inteligência';
  description: string;
}

export interface KpiMeta {
  id: KpiId;
  label: string;
  description: string;
}

export const WIDGETS_METADATA: Record<WidgetId, WidgetMeta> = {
  realtimeCockpit: {
    id: 'realtimeCockpit',
    name: 'Cockpit em Tempo Real (SSE)',
    category: 'Tempo Real',
    description: 'Indicadores live de hoje com pulso contínuo e alerta sentinela de anomalias.',
  },
  productivityHeatmap: {
    id: 'productivityHeatmap',
    name: 'Heatmap de Produtividade por Horário',
    category: 'Produtividade',
    description: 'Matriz semanal de ligações, reuniões, mensagens e conversões por faixa horária.',
  },
  commercialJourney: {
    id: 'commercialJourney',
    name: 'Jornada Comercial 360° Stream',
    category: 'Tempo Real',
    description: 'Feed em tempo real de movimentações, propostas e eventos comerciais.',
  },
  unifiedTimeline: {
    id: 'unifiedTimeline',
    name: 'Timeline Unificada Cross-Entity',
    category: 'Operações',
    description:
      'Auditoria cronológica de leads, negócios, chamadas, WhatsApp e automações, com exportação.',
  },
  pipelineFunnel: {
    id: 'pipelineFunnel',
    name: 'Funil Comercial & Temperatura',
    category: 'Pipeline',
    description: 'Taxa de avanço entre etapas de negociação e distribuição por temperatura.',
  },
  quickActions: {
    id: 'quickActions',
    name: 'Cockpits Operacionais & Ações Rápidas',
    category: 'Operações',
    description: 'Atalhos estratégicos para prospecção, pipeline, réguas e copiloto.',
  },
  aiOrchestrator: {
    id: 'aiOrchestrator',
    name: 'Motor de Inteligência Autônoma',
    category: 'Inteligência',
    description: 'Diagnósticos preditivos, pontos de inflexão e calibração contínua.',
  },
  gamification: {
    id: 'gamification',
    name: 'Performance & Gamificação da Equipe',
    category: 'Operações',
    description: 'Nível de XP, streaks operacionais e consistência de cadência comercial.',
  },
};

export const KPIS_METADATA: Record<KpiId, KpiMeta> = {
  pipelineValue: {
    id: 'pipelineValue',
    label: 'Volume em Pipeline',
    description: 'Total em R$ das oportunidades em aberto',
  },
  winRate: {
    id: 'winRate',
    label: 'Taxa de Conversão (Win Rate)',
    description: 'Percentual de leads convertidos em negócios ganhos',
  },
  pendingActivities: {
    id: 'pendingActivities',
    label: 'Atividades Pendentes',
    description: 'Volume de tarefas e interações na cadência',
  },
  totalCompanies: {
    id: 'totalCompanies',
    label: 'Contas e Empresas',
    description: 'Organizações registradas na base comercial',
  },
  closedThisMonth: {
    id: 'closedThisMonth',
    label: 'Ganhos no Mês',
    description: 'Quantidade de negócios concluídos com sucesso',
  },
  leadsToday: {
    id: 'leadsToday',
    label: 'Leads de Hoje',
    description: 'Volume de novas entradas no dia atual',
  },
  wonRevenueMonth: {
    id: 'wonRevenueMonth',
    label: 'Receita Faturada Mês',
    description: 'Total faturado no ciclo mensal vigente',
  },
};

export const ROLE_DEFAULT_TEMPLATES: Record<
  DashboardRole,
  {
    name: string;
    description: string;
    activeWidgets: WidgetId[];
    visibleKpis: KpiId[];
  }
> = {
  SDR: {
    name: 'SDR — Pré-Vendas & Prospecção',
    description: 'Otimizado para cadência rápida, contatos diários e agendamento de reuniões.',
    activeWidgets: [
      'realtimeCockpit',
      'productivityHeatmap',
      'commercialJourney',
      'unifiedTimeline',
      'pipelineFunnel',
      'quickActions',
      'gamification',
      'aiOrchestrator',
    ],
    visibleKpis: ['leadsToday', 'pendingActivities', 'winRate', 'totalCompanies'],
  },
  CLOSER: {
    name: 'Closer — Executivo de Negociação',
    description: 'Focado em avanço de estágios, envio de propostas e fechamento financeiro.',
    activeWidgets: [
      'pipelineFunnel',
      'realtimeCockpit',
      'productivityHeatmap',
      'commercialJourney',
      'unifiedTimeline',
      'quickActions',
      'aiOrchestrator',
      'gamification',
    ],
    visibleKpis: ['pipelineValue', 'winRate', 'closedThisMonth', 'wonRevenueMonth'],
  },
  GESTOR: {
    name: 'Gestor — Liderança Comercial',
    description:
      'Visão executiva 360°, sentinela de anomalias e produtividade consolidada do time.',
    activeWidgets: [
      'realtimeCockpit',
      'productivityHeatmap',
      'pipelineFunnel',
      'commercialJourney',
      'unifiedTimeline',
      'aiOrchestrator',
      'gamification',
      'quickActions',
    ],
    visibleKpis: ['pipelineValue', 'wonRevenueMonth', 'winRate', 'totalCompanies'],
  },
};

export interface DashboardLayoutState {
  role: DashboardRole;
  isCustomized: boolean;
  activeWidgets: WidgetId[];
  visibleKpis: KpiId[];
}

function getStorageKey(userId: string | undefined, role: DashboardRole): string {
  const safeId = userId || 'anonymous';
  return `birthhub:dashboard-layout:${safeId}:${role}`;
}

export function useDashboardLayout() {
  const { currentUser } = useAuth();

  // Mapear role do sistema para o papel comercial inicial
  const resolveInitialRole = (): DashboardRole => {
    const rawRole = (currentUser?.role || '').toUpperCase();
    if (rawRole.includes('SDR')) return 'SDR';
    if (rawRole.includes('CLOSER')) return 'CLOSER';
    return 'GESTOR';
  };

  const [role, setRoleState] = useState<DashboardRole>(resolveInitialRole);
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(
    ROLE_DEFAULT_TEMPLATES[resolveInitialRole()].activeWidgets,
  );
  const [visibleKpis, setVisibleKpis] = useState<KpiId[]>(
    ROLE_DEFAULT_TEMPLATES[resolveInitialRole()].visibleKpis,
  );
  const [isCustomized, setIsCustomized] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Carregar do localStorage ao inicializar ou mudar de cargo
  const loadLayoutForRole = useCallback(
    (targetRole: DashboardRole) => {
      try {
        const key = getStorageKey(currentUser?.id, targetRole);
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.activeWidgets) && Array.isArray(parsed.visibleKpis)) {
            setActiveWidgets(parsed.activeWidgets);
            setVisibleKpis(parsed.visibleKpis);
            setIsCustomized(true);
            return;
          }
        }
      } catch {
        // Fallback para o template padrão
      }
      const tpl = ROLE_DEFAULT_TEMPLATES[targetRole];
      setActiveWidgets(tpl.activeWidgets);
      setVisibleKpis(tpl.visibleKpis);
      setIsCustomized(false);
    },
    [currentUser?.id],
  );

  useEffect(() => {
    loadLayoutForRole(role);
  }, [role, loadLayoutForRole]);

  const setRole = (newRole: DashboardRole) => {
    setRoleState(newRole);
    loadLayoutForRole(newRole);
  };

  const reorderWidgets = (newOrder: WidgetId[]) => {
    setActiveWidgets(newOrder);
  };

  const toggleWidget = (widgetId: WidgetId) => {
    setActiveWidgets((prev) => {
      if (prev.includes(widgetId)) {
        // Garantir que pelo menos 1 widget permaneça ativo
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== widgetId);
      }
      return [...prev, widgetId];
    });
  };

  const toggleKpi = (kpiId: KpiId) => {
    setVisibleKpis((prev) => {
      if (prev.includes(kpiId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== kpiId);
      }
      if (prev.length >= 4) {
        // Máximo de 4 KPIs no topo: remove o mais antigo e adiciona o novo
        return [...prev.slice(1), kpiId];
      }
      return [...prev, kpiId];
    });
  };

  const saveLayout = (customWidgets?: WidgetId[], customKpis?: KpiId[]) => {
    const widgetsToSave = customWidgets || activeWidgets;
    const kpisToSave = customKpis || visibleKpis;
    try {
      const key = getStorageKey(currentUser?.id, role);
      localStorage.setItem(
        key,
        JSON.stringify({
          activeWidgets: widgetsToSave,
          visibleKpis: kpisToSave,
          updatedAt: new Date().toISOString(),
        }),
      );
      setActiveWidgets(widgetsToSave);
      setVisibleKpis(kpisToSave);
      setIsCustomized(true);
    } catch {
      // Ignora erro de gravação se storage indisponível
    }
  };

  const resetToRoleTemplate = () => {
    try {
      const key = getStorageKey(currentUser?.id, role);
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    const tpl = ROLE_DEFAULT_TEMPLATES[role];
    setActiveWidgets(tpl.activeWidgets);
    setVisibleKpis(tpl.visibleKpis);
    setIsCustomized(false);
  };

  return {
    role,
    setRole,
    activeWidgets,
    visibleKpis,
    isCustomized,
    isBuilderOpen,
    setIsBuilderOpen,
    reorderWidgets,
    toggleWidget,
    toggleKpi,
    saveLayout,
    resetToRoleTemplate,
  };
}
