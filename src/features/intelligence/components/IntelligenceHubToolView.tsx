import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Database,
  FileText,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Intelligence } from '../../../components/Intelligence.js';
import { Button } from '../../../components/ui/Button.js';
import { Card, CardDescription, CardTitle } from '../../../components/ui/Card.js';
import { useBrandAccent } from '../../../hooks/useBrandAccent.js';
import { fadeInUp } from '../../../lib/motion.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { CopilotoIaHub } from '../../copiloto-ia/components/CopilotoIaHub.js';
import { AIConfigCenter } from '../../dashboard/components/AIConfigCenter.js';
import type { KnowledgeDocumentSummary } from '../../knowledge/knowledge.api.js';
import { AgentQualityPanel } from './AgentQualityPanel.js';
import { AIPendingActions } from './AIPendingActions.js';
import { AISuiteHub } from './AISuiteHub.js';
import { AutomationGuide } from './AutomationGuide.js';
import { B2BGenerator } from './B2BGenerator.js';
import { EliteCommercialAgentWorkspace } from './EliteCommercialAgentWorkspace.js';
import { GroqTelemetryPanel } from './GroqTelemetryPanel.js';
import {
  CATEGORY_SHORT_LABELS,
  formatRelativeDate,
  type IntelligenceTab,
  TOOL_DEFINITIONS,
  type ToolDefinition,
} from './intelligenceHub.catalog.js';
import { RobustScriptGenerator } from './RobustScriptGenerator.js';
import { SalesMethodologyStudio } from './SalesMethodologyStudio.js';
import { SuperagentCreator } from './SuperagentCreator.js';
import { SwarmDashboard } from './SwarmDashboard.js';
import { UniversalEcosystemPanel } from './UniversalEcosystemPanel.js';

interface IntelligenceHubToolViewProps {
  activeTab: IntelligenceTab;
  activeToolDef: ToolDefinition | undefined;
  onBack: () => void;
  onOpenTool: (id: IntelligenceTab) => void;
  onSelectTool: (id: IntelligenceTab) => void;
  ragDocuments: KnowledgeDocumentSummary[] | null;
  ragError: string | null;
  ragLoading: boolean;
  onRetryRag: () => void;
}

export function IntelligenceHubToolView({
  activeTab,
  activeToolDef,
  onBack,
  onOpenTool,
  onSelectTool,
  ragDocuments,
  ragError,
  ragLoading,
  onRetryRag,
}: IntelligenceHubToolViewProps) {
  const accent = useBrandAccent();

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Barra Superior de Navegação Rápida com Breadcrumb e Switcher */}
      <div className="p-3.5 rounded-card bg-surface/90 dark:bg-surface-elevated/90 border border-line flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              SoundFX.play('navigate');
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-surface-2 border border-line hover:border-brand/40 text-ink text-xs font-bold hover:bg-surface transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Hub</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-surface text-[10px] font-mono text-ink-2 border border-line">
              Esc
            </kbd>
          </button>

          <div className="h-4 w-[1px] bg-line hidden sm:block" />

          {/* Breadcrumb da ferramenta */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-2">Hub de IA</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-2/60" />
            <span className="text-ink-2 font-medium">
              {CATEGORY_SHORT_LABELS[activeToolDef?.category ?? 'infra']}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-2/60" />
            <span className="font-bold text-ink flex items-center gap-1.5">
              {activeToolDef?.label}
            </span>
          </div>
        </div>

        {/* Switcher Rápido de Ferramentas Adjacentes */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <span className="text-[11px] font-semibold text-ink-2 mr-1 hidden md:inline">
            Alternar no mesmo pilar:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TOOL_DEFINITIONS.filter((t) => t.category === activeToolDef?.category).map((peer) => {
              const isCurrent = peer.id === activeTab;
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => onOpenTool(peer.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-control transition-colors whitespace-nowrap cursor-pointer ${
                    isCurrent
                      ? 'bg-brand text-on-brand font-bold shadow-xs'
                      : 'bg-surface-2 text-ink-2 hover:text-ink hover:bg-surface border border-line'
                  }`}
                >
                  {peer.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Renderizador do Conteúdo da Ferramenta Ativa */}
      <motion.div key={activeTab} initial="hidden" animate="show" variants={fadeInUp}>
        {activeTab === 'commercial_cell' && <EliteCommercialAgentWorkspace />}
        {activeTab === 'telemetry' && <GroqTelemetryPanel />}
        {activeTab === 'ai_suite' && <AISuiteHub />}
        {activeTab === 'swarm' && <SwarmDashboard />}
        {activeTab === 'ecosystem' && (
          <Card variant="default" padding="lg" accentBar>
            <div className="space-y-8">
              <UniversalEcosystemPanel
                mode="studio"
                onLaunchSwarmMission={() => onSelectTool('swarm')}
              />
              <UniversalEcosystemPanel
                mode="connectors"
                onLaunchSwarmMission={() => onSelectTool('swarm')}
              />
            </div>
          </Card>
        )}
        {activeTab === 'quality' && <AgentQualityPanel />}
        {activeTab === 'methodologies' && <SalesMethodologyStudio />}
        {activeTab === 'ai_config' && <AIConfigCenter />}
        {activeTab === 'superagent' && <SuperagentCreator />}
        {activeTab === 'scripts' && <RobustScriptGenerator />}
        {activeTab === 'automations' && <AutomationGuide />}
        {activeTab === 'generator' && <B2BGenerator />}
        {activeTab === 'tools' && <Intelligence />}
        {activeTab === 'copiloto' && (
          <Card variant="default" padding="lg" accentBar>
            <CopilotoIaHub />
          </Card>
        )}

        {activeTab === 'actions' && (
          <Card variant="default" padding="lg" accentBar>
            <AIPendingActions />
          </Card>
        )}

        {activeTab === 'rag' && (
          <Card variant="default" padding="lg" accentBar>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                  <Database size={22} />
                </div>
                <div>
                  <CardTitle>Base de Conhecimento RAG</CardTitle>
                  <CardDescription>
                    Documentos reais indexados nesta organização. O Copiloto SDR consulta esta mesma
                    base (busca híbrida semântica + palavra-chave) para gerar abordagens contextuais
                    — nunca inventa uma fonte que não está aqui.
                  </CardDescription>
                </div>
              </div>
              <Button asChild variant="outline" className="shrink-0 whitespace-nowrap">
                <Link to="/knowledge">
                  Gerenciar base <ArrowUpRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>

            {ragLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-ink-2 py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando documentos…
              </div>
            )}

            {!ragLoading && ragError && (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-400" />
                <p className="text-sm text-ink-2 mb-4">{ragError}</p>
                <Button variant="outline" onClick={onRetryRag}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {!ragLoading && !ragError && ragDocuments !== null && ragDocuments.length === 0 && (
              <div className="text-center py-8 border border-dashed border-line rounded-card">
                <Database className="w-10 h-10 mx-auto mb-3 text-ink-2" />
                <p className="text-sm font-semibold text-ink mb-1">
                  Nenhum documento indexado ainda
                </p>
                <p className="text-xs text-ink-2 mb-4 max-w-sm mx-auto">
                  Sem documentos, o Copiloto SDR não tem playbook para consultar — ele avisa isso em
                  vez de inventar uma resposta.
                </p>
                <Button asChild variant="outline">
                  <Link to="/knowledge">Enviar o primeiro documento</Link>
                </Button>
              </div>
            )}

            {!ragLoading && !ragError && ragDocuments !== null && ragDocuments.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
                  {ragDocuments.length} documento{ragDocuments.length === 1 ? '' : 's'} ·{' '}
                  {ragDocuments.reduce((sum, d) => sum + d.chunkCount, 0)} trecho(s) vetorizado(s)
                </p>
                {ragDocuments.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-5 bg-surface-2 border border-line rounded-card flex items-center justify-between group ${accent.hoverBorder} transition-colors`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${accent.bgSoft} flex items-center justify-center ${accent.text} shrink-0`}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink text-sm truncate">{doc.title}</p>
                        <p className="text-[11px] font-semibold text-ink-2 mt-0.5 uppercase tracking-wider">
                          {doc.chunkCount} trecho{doc.chunkCount === 1 ? '' : 's'} · atualizado{' '}
                          {formatRelativeDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                        doc.chunkCount > 0
                          ? 'bg-success/15 text-success-active dark:text-success border-success/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {doc.chunkCount > 0 ? 'Indexado' : 'Sem trechos'}
                    </div>
                  </div>
                ))}
                {ragDocuments.length > 5 && (
                  <Link
                    to="/knowledge"
                    className="block text-center text-xs font-semibold text-ink-2 hover:text-ink transition-colors pt-1"
                  >
                    Ver todos os {ragDocuments.length} documentos →
                  </Link>
                )}
              </div>
            )}
          </Card>
        )}
      </motion.div>
    </div>
  );
}
