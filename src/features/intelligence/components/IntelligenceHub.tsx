import { Bot, Cpu, ShieldCheck, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SoundFX } from '../../../lib/soundEffects.js';
import { type KnowledgeDocumentSummary, knowledgeApi } from '../../knowledge/knowledge.api.js';
import { IntelligenceHubOverview } from './IntelligenceHubOverview.js';
import { IntelligenceHubToolView } from './IntelligenceHubToolView.js';
import {
  type IntelligenceTab,
  PINNED_STORAGE_KEY,
  TOOL_DEFINITIONS,
  type ToolCategory,
  type ToolDefinition,
  VIEW_MODE_STORAGE_KEY,
  type ViewMode,
} from './intelligenceHub.catalog.js';

export type { IntelligenceTab, ToolCategory, ViewMode } from './intelligenceHub.catalog.js';

interface IntelligenceHubProps {
  initialTab?: IntelligenceTab;
}

export function IntelligenceHub({ initialTab }: IntelligenceHubProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab | null>(initialTab ?? null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'matrix' || saved === 'grid') return saved;
    }
    return 'grid';
  });

  const [pinnedIds, setPinnedIds] = useState<IntelligenceTab[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(PINNED_STORAGE_KEY);
        if (saved) return JSON.parse(saved) as IntelligenceTab[];
      } catch {
        // Fallback silencioso
      }
    }
    return ['commercial_cell', 'tools', 'copiloto'];
  });

  const togglePin = useCallback((id: IntelligenceTab, e?: React.MouseEvent) => {
    e?.stopPropagation();
    SoundFX.play('click');
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const handleChangeViewMode = useCallback((mode: ViewMode) => {
    SoundFX.play('click');
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    }
  }, []);

  // Estado real da Base de Conhecimento (RAG) — respeita AGENTS.md Bloqueador B-06 (nunca dados fictícios)
  const [ragDocuments, setRagDocuments] = useState<KnowledgeDocumentSummary[] | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  const loadRagSummary = useCallback(async () => {
    setRagLoading(true);
    setRagError(null);
    try {
      setRagDocuments(await knowledgeApi.list());
    } catch (err: unknown) {
      setRagError(err instanceof Error ? err.message : String(err));
    } finally {
      setRagLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rag') void loadRagSummary();
  }, [activeTab, loadRagSummary]);

  // Teclado: Escape volta para a grade principal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTab !== null) {
        setActiveTab(null);
        SoundFX.play('navigate');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Filtragem de ferramentas
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TOOL_DEFINITIONS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      const matchesText =
        tool.label.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.techMeta.toLowerCase().includes(query) ||
        tool.keywords.some((k) => k.toLowerCase().includes(query));
      return matchesText;
    });
  }, [selectedCategory, searchQuery]);

  const activeToolDef = useMemo(() => {
    return TOOL_DEFINITIONS.find((t) => t.id === activeTab);
  }, [activeTab]);

  // Ferramentas fixadas que existem no catálogo
  const pinnedTools = useMemo(() => {
    return pinnedIds
      .map((id) => TOOL_DEFINITIONS.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => Boolean(t));
  }, [pinnedIds]);

  // Agrupamentos por pilares operacionais (para a visualização agrupada em 'all')
  const pillarClusters = useMemo(() => {
    return [
      {
        id: 'agents' as const,
        label: '1. Células & Enxames Autônomos',
        subtitle: 'Agentes executivos especializados com orquestração coordenada e trace...',
        icon: Bot,
        tools: filteredTools.filter((t) => t.category === 'agents'),
      },
      {
        id: 'tactical' as const,
        label: '2. Operação Tática & Outreach B2B',
        subtitle: 'Geração de abordagens multicanal, frameworks clássicos e scripts de conversão.',
        icon: Wand2,
        tools: filteredTools.filter((t) => t.category === 'tactical'),
      },
      {
        id: 'governance' as const,
        label: '3. Governança, Human-in-the-Loop & Qualidade',
        subtitle: 'Fila de aprovação de riscos, harness contínuo com Golden Dataset e te...',
        icon: ShieldCheck,
        tools: filteredTools.filter((t) => t.category === 'governance'),
      },
      {
        id: 'infra' as const,
        label: '4. Infraestrutura, Modelos & Conhecimento',
        subtitle: 'Console multi-motor (Ollama & Cloud), base de embeddings RAG e parâme...',
        icon: Cpu,
        tools: filteredTools.filter((t) => t.category === 'infra'),
      },
    ].filter((p) => p.tools.length > 0);
  }, [filteredTools]);

  const handleOpenTool = useCallback((id: IntelligenceTab) => {
    SoundFX.play('click');
    setActiveTab(id);
  }, []);

  // Se nenhuma ferramenta estiver ativa, renderiza a visão do Hub de IA com novo design de Command Center
  if (activeTab === null) {
    return (
      <IntelligenceHubOverview
        filteredTools={filteredTools}
        pinnedTools={pinnedTools}
        pillarClusters={pillarClusters}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleChangeViewMode}
        pinnedIds={pinnedIds}
        onTogglePin={togglePin}
        onOpenTool={handleOpenTool}
      />
    );
  }

  // Visualização de Ferramenta Ativa (quando o usuário abre uma das 15 ferramentas)
  return (
    <IntelligenceHubToolView
      activeTab={activeTab}
      activeToolDef={activeToolDef}
      onBack={() => setActiveTab(null)}
      onOpenTool={handleOpenTool}
      onSelectTool={setActiveTab}
      ragDocuments={ragDocuments}
      ragError={ragError}
      ragLoading={ragLoading}
      onRetryRag={() => void loadRagSummary()}
    />
  );
}
