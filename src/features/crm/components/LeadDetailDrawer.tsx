import { motion, useReducedMotion } from 'framer-motion';
import { Clock, Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { EntityAttachments } from '../../../components/crm/EntityAttachments.js';
import { AIEmailGenerator } from '../../../components/ui/AIEmailGenerator.js';
import { Button } from '../../../components/ui/Button.js';
import { useConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { Timeline, type TimelineItem } from '../../../components/ui/Timeline.js';
import { useAuth } from '../../../contexts/AuthContext.js';
import { useActivePlaybook } from '../../../hooks/useActivePlaybook.js';
import { useActiveRecord } from '../../../hooks/useActiveRecord.js';
import { api } from '../../../lib/api.js';
import { drawerSlideRight, modalBackdropMotion } from '../../../lib/motion.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { toast } from '../../../lib/toast.js';
import type { Lead, LeadQualification, Note } from '../../../types/index.js';
// Mesmo raciocínio do WhatsAppChatPanel abaixo: o CRM só decide QUANDO oferecer a entrada, não
// COMO o Copiloto Comercial IA funciona (Onda 7 — UI/UX, ver src/features/copiloto-ia/AGENTS.md).
import { LeadCopilotoPanel } from '../../copiloto-ia/components/LeadCopilotoPanel.js';
import { bitrixApi } from '../../integrations/bitrix/bitrix.api.js';
// Painel de conversa real (histórico + envio) já usado pela Prospecção sobre a mesma integração
// de WhatsApp (src/features/integrations/whatsapp, sessão Baileys por tenant) — reusado aqui em vez
// de duplicar lógica de polling/envio; CRM só decide QUANDO oferecer a ação, não COMO ela funciona.
import { WhatsAppChatPanel } from '../../integrations/whatsapp/components/WhatsAppChatPanel.js';
import { PredictiveScoringNbaCard } from '../../intelligence/components/PredictiveScoringNbaCard.js';
import { type BantQualificationData, calculateLeadScore } from '../domain/leadScoreCalculator.js';
// Central unificada de conversas (item #18) — mescla lead.timeline com WhatsApp/e-mail/ligações.
import {
  type RawTimelineEvent,
  useUnifiedLeadConversation,
} from '../hooks/useUnifiedLeadConversation.js';
import { LeadActionBar } from './LeadActionBar.js';
import { LeadDetailDrawerBantSection } from './LeadDetailDrawerBantSection.js';
import { LeadDetailDrawerBitrixSection } from './LeadDetailDrawerBitrixSection.js';
import { LeadDetailDrawerHeader } from './LeadDetailDrawerHeader.js';
import { LeadDetailDrawerNotesSection } from './LeadDetailDrawerNotesSection.js';
import {
  LeadCompanySection,
  LeadContactSection,
} from './LeadDetailDrawerProfileSections.js';

// TimelineEvent.type já vem do backend (PrismaLeadRepository.ts) restrito a estes 6 valores —
// rótulo em português pra exibição; qualquer valor fora da lista cai no fallback (o próprio type).
const TIMELINE_TYPE_LABELS: Record<string, string> = {
  creation: 'Lead criado',
  edition: 'Dados atualizados',
  movement: 'Mudança de etapa',
  activity: 'Atividade registrada',
  comment: 'Comentário',
  generic: 'Evento',
};

const TIMELINE_ITEM_TYPE: Record<string, TimelineItem['type']> = {
  movement: 'status_change',
  comment: 'note',
};

// UX-11 (DEBT-0065): apiFetch (src/lib/api.ts) propaga erros HTTP como `Error(message)` sem
// expor status — o backend responde 404 de GET /api/leads/:id com {error:'Lead not found'}
// (LeadController.ts:53); falhas de rede/timeout têm mensagens próprias ("Não foi possível
// conectar ao servidor." / timeout). A distinção 404↔rede é feita pela mensagem do erro.
const isLeadNotFoundError = (err: unknown): boolean =>
  err instanceof Error && /lead not found|status 404/i.test(err.message);

interface LeadDetailDrawerProps {
  leadId: string;
  onClose: () => void;
  /** Chamado sempre que o lead muda (status, enriquecimento, exclusão) para o board recarregar. */
  onChanged: () => void;
}

export function LeadDetailDrawer({ leadId, onClose, onChanged }: LeadDetailDrawerProps) {
  const reduceMotion = useReducedMotion();
  const { playbook, info: playbookMeta } = useActivePlaybook();
  const { setActiveRecord, clearActiveRecord } = useActiveRecord();
  const { currentUser } = useAuth();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [qualOpen, setQualOpen] = useState(false);
  const [qualDraft, setQualDraft] = useState<LeadQualification>({});
  const [savingQual, setSavingQual] = useState(false);
  const [callingVoice, setCallingVoice] = useState(false);
  const [agentType, setAgentType] = useState('sdr');
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [savingOwner, setSavingOwner] = useState(false);
  const [exportingBitrix, setExportingBitrix] = useState(false);
  const [loadError, setLoadError] = useState<'network' | null>(null);

  const handleExportToBitrix = async () => {
    setExportingBitrix(true);
    try {
      const res = await bitrixApi.exportLead(leadId);
      toast.success(`Lead sincronizado com sucesso no Bitrix24 (ID #${res.data.bitrixLeadId})!`);
      fetchLead();
      onChanged();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Falha ao exportar para Bitrix24');
    } finally {
      setExportingBitrix(false);
    }
  };
  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.get<Lead>(`/api/leads/${leadId}`);
      setLead(data);
      setQualDraft((data.qualification as LeadQualification) || {});
      setActiveRecord({
        type: 'lead',
        id: data.id,
        label: data.title || data.company?.legalName || 'Lead',
      });
    } catch (err) {
      if (isLeadNotFoundError(err)) {
        toast.error('Lead não encontrado ou sem permissão de acesso');
        onClose();
      } else {
        // Erro de rede/5xx/timeout: mantém o drawer aberto em estado de erro com retry,
        // em vez de fechar e perder o contexto do deep link ?lead=<id> (UX-11).
        toast.error('Falha ao carregar detalhes do lead');
        setLoadError('network');
      }
    } finally {
      setLoading(false);
    }
  }, [leadId, onClose, setActiveRecord]);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    fetchLead();
    // /api/users nunca existiu como rota (404 silencioso todo carregamento) — endpoint real é
    // /api/team/assignable (ver team.routes.ts e o mesmo achado em CrmBoard.tsx).
    api
      .get<{ owners: { id: string; name: string }[] }>('/api/team/assignable')
      .then((res) => setOwners(res.owners))
      .catch(() => setOwners([]));
    return () => {
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
      clearActiveRecord(leadId);
    };
  }, [fetchLead, leadId, clearActiveRecord]);

  useEffect(() => {
    if (!loading && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleVoiceCall = useCallback(async () => {
    if (!lead) return;
    setCallingVoice(true);
    try {
      await api.post(`/api/integrations/birth-voice/call/${lead.id}`, { agentType });
      toast.success(
        'Ligação de qualificação disparada com sucesso! O resultado chega de forma assíncrona.',
      );
    } catch (error: any) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível disparar a ligação de qualificação.',
      );
    } finally {
      setCallingVoice(false);
    }
  }, [lead, agentType]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      const updated = await api.put<Lead>(`/api/leads/${lead.id}`, { status: newStatus });
      setLead(updated);
      onChanged();
      const isWon =
        newStatus.toLowerCase().includes('ganho') || newStatus.toLowerCase().includes('convert');
      if (isWon) {
        SoundFX.play('success');
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      } else {
        SoundFX.play('navigate');
      }
      toast.success(`Status atualizado para "${newStatus}"`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleOwnerChange = async (newOwnerId: string) => {
    if (!lead) return;
    setSavingOwner(true);
    try {
      // DATA-003 (Sprint 05/Onda 17): Lead.owner é contrato User.id, não nome — enviar o
      // nome aqui reintroduzia o mesmo bug já corrigido no import Bitrix (onda 10, ver
      // requireLeadOwnership.ts). Todo o resto da aplicação (autoatribuição, round-robin,
      // import Bitrix atual) já grava o id.
      const updated = await api.put<Lead>(`/api/leads/${lead.id}`, { owner: newOwnerId || null });
      setLead(updated);
      onChanged();
      toast.success('Responsável atualizado com sucesso');
    } catch {
      toast.error('Erro ao atualizar responsável');
    } finally {
      setSavingOwner(false);
    }
  };

  const handleEnrich = async () => {
    if (!lead) return;
    setEnriching(true);
    try {
      const result = await api.post<{ lead?: Lead; data?: { lead?: Lead } }>(
        `/api/leads/${lead.id}/enrich`,
        {},
      );
      const updatedLead = result.lead || result.data?.lead;
      if (updatedLead) {
        setLead(updatedLead);
      }
      onChanged();
      SoundFX.play('success');
      toast.success('Lead enriquecido com sucesso!');
    } catch {
      toast.error('Erro ao enriquecer lead');
    } finally {
      setEnriching(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !lead) return;
    setSavingNote(true);
    try {
      const newNote = await api.post<Note>(`/api/leads/${lead.id}/notes`, {
        content: noteText.trim(),
        author: currentUser?.name || 'Usuário',
      });
      setLead((prev) =>
        prev ? { ...prev, internalNotes: [newNote, ...(prev.internalNotes || [])] } : null,
      );
      setNoteText('');
      toast.success('Nota adicionada');
    } catch {
      toast.error('Erro ao adicionar nota');
    } finally {
      setSavingNote(false);
    }
  };

  // `qualDraft` (LeadQualification, checklist do Playbook Comercial) e BantQualificationData
  // (budget/authority/need/timing) têm formatos diferentes — o cast pré-existente já não batia
  // campo a campo antes desta correção de lint; mantido aqui como estava (via `unknown`, não
  // `any`) para não mudar o cálculo de score como efeito colateral de uma limpeza de lint.
  // ACH-05-07: o bônus de dor de diesel/sinistro (fuelCostPain/theftRiskPain) só vale para o
  // playbook de risco de carga/logística — repassa o playbook ativo do navegador em vez de
  // deixar o cálculo assumir logística para qualquer organização.
  const liveScore = calculateLeadScore({
    ...(qualDraft as unknown as BantQualificationData),
    activePlaybook: playbook,
  });

  const handleSaveQualification = async () => {
    if (!lead) return;
    setSavingQual(true);
    try {
      const updated = await api.put<Lead>(`/api/leads/${lead.id}`, {
        qualification: qualDraft,
        score: liveScore.score,
        temperature: liveScore.temperature,
      });
      setLead(updated);
      setQualOpen(false);
      onChanged();
      if (liveScore.score >= 70) {
        SoundFX.play('success');
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: [
              '--color-brand-primary',
              '--color-brand-secondary',
              '--color-brand-accent',
              '--color-success',
              '--color-info',
            ].map((token) =>
              getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
            ),
            disableForReducedMotion: true,
          });
        } catch {
          // ignore
        }
      } else {
        SoundFX.play('confirm');
      }
      toast.success(`Qualificação salva! Score: ${liveScore.score}/100 (${liveScore.temperature})`);
    } catch {
      SoundFX.play('error');
      toast.error('Erro ao salvar qualificação');
    } finally {
      setSavingQual(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    const confirmed = await confirm({
      title: 'Excluir lead',
      description: `Tem certeza que deseja excluir "${lead.company?.tradeName || lead.contact?.name || 'este lead'}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.delete(`/api/leads/${lead.id}`);
      toast.success('Lead excluído com sucesso');
      onChanged();
      onClose();
    } catch {
      toast.error('Erro ao excluir lead');
    } finally {
      setDeleting(false);
    }
  };

  const company = lead?.company;
  const leadPhone = lead?.contact?.whatsapp || lead?.contact?.phone || company?.phones?.[0] || null;

  // GET /api/leads/:id já inclui `timeline` (TimelineEvent[], PrismaLeadRepository.ts:99) desde
  // sempre — a UI nunca chegou a renderizar esse dado, só as notas manuais abaixo. Nenhuma rota,
  // migration ou campo novo foi necessário para esta seção.
  const nativeTimelineEvents: RawTimelineEvent[] = (lead?.timeline ?? []).map((event) => ({
    id: event.id,
    title: TIMELINE_TYPE_LABELS[event.type] ?? event.type,
    description: event.description,
    createdAt: event.createdAt,
    type: TIMELINE_ITEM_TYPE[event.type],
  }));
  // Central unificada de conversas (item #18) — mescla os eventos nativos acima com WhatsApp,
  // e-mail e ligações de voz do mesmo lead num único feed cronológico. Ver
  // `useUnifiedLeadConversation.ts` — três buscas independentes, nunca bloqueiam a timeline
  // nativa se uma integração falhar.
  const { items: timelineItems } = useUnifiedLeadConversation(lead?.id ?? '', nativeTimelineEvents);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop de "clicar fora fecha" — não precisa de suporte a teclado próprio: Escape já
          fecha o drawer via listener global (window.addEventListener acima), então isto é
          conveniência de mouse/touch, não um alvo de interação que um usuário de teclado precise
          alcançar. Elemento de backdrop com role="button" para fechar via teclado - sem aria-hidden
          pois é focável. */}
      <motion.div
        variants={reduceMotion ? undefined : modalBackdropMotion}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? undefined : 'show'}
        exit={reduceMotion ? undefined : 'exit'}
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        variants={reduceMotion ? undefined : drawerSlideRight}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? undefined : 'show'}
        exit={reduceMotion ? undefined : 'exit'}
        className="relative w-full max-w-2xl bg-surface border-l border-line shadow-2xl flex flex-col h-full overflow-hidden z-10 motion-gpu before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-brand/50 before:to-transparent before:z-20"
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : loadError && !lead ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-sm text-ink-2">Falha ao carregar — tente novamente.</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fetchLead()}>
                Tentar novamente
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : !lead ? null : (
          <>
            <LeadDetailDrawerHeader
              lead={lead}
              company={company}
              owners={owners}
              savingOwner={savingOwner}
              titleId={titleId}
              closeButtonRef={closeButtonRef}
              onStatusChange={handleStatusChange}
              onOwnerChange={handleOwnerChange}
              onClose={onClose}
            />

            <LeadActionBar
              lead={lead}
              enriching={enriching}
              onEnrich={handleEnrich}
              deleting={deleting}
              onDelete={handleDelete}
              agentType={agentType}
              onAgentTypeChange={setAgentType}
              callingVoice={callingVoice}
              onVoiceCall={handleVoiceCall}
              leadPhone={leadPhone}
              onOpenWhatsapp={() => setWhatsappOpen(true)}
              exportingBitrix={exportingBitrix}
              onExportBitrix={handleExportToBitrix}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {company && <LeadCompanySection company={company} />}

              {lead.contact && <LeadContactSection contact={lead.contact} />}

              <LeadDetailDrawerBantSection
                lead={lead}
                qualOpen={qualOpen}
                qualDraft={qualDraft}
                liveScore={liveScore}
                savingQual={savingQual}
                onToggleQual={() => setQualOpen((v) => !v)}
                onQualDraftChange={setQualDraft}
                onSaveQualification={handleSaveQualification}
              />

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand" /> Linha do Tempo
                  <span className="text-[10px] font-normal normal-case text-ink-2">
                    · CRM, WhatsApp, e-mail e ligações num só feed
                  </span>
                </h3>
                <Timeline
                  items={timelineItems}
                  emptyMessage="Nenhum evento registrado para este lead ainda."
                />
              </section>

              <LeadDetailDrawerNotesSection
                lead={lead}
                noteText={noteText}
                savingNote={savingNote}
                onNoteTextChange={setNoteText}
                onAddNote={handleAddNote}
              />

              <EntityAttachments entityType="lead" entityId={lead.id} />

              {playbookMeta && (
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" /> Copiloto de Vendas (
                    {playbookMeta.label})
                  </h3>
                  <AIEmailGenerator
                    companyName={lead.company?.legalName || lead.company?.tradeName || undefined}
                    contactName={lead.contact?.name || undefined}
                    role={lead.contact?.role || undefined}
                    phone={lead.contact?.phone || undefined}
                  />
                </section>
              )}

              <PredictiveScoringNbaCard
                leadId={lead.id}
                leadName={lead.contact?.name || lead.title || 'Lead'}
                companyName={company?.legalName || company?.tradeName || undefined}
                stage={lead.status}
                recentNotes={lead.internalNotes?.map((n) => n.content).join('; ')}
              />

              <LeadCopilotoPanel leadId={lead.id} />

              <LeadDetailDrawerBitrixSection lead={lead} />
            </div>
          </>
        )}
      </motion.div>

      {whatsappOpen && leadPhone && (
        <WhatsAppChatPanel
          phone={leadPhone}
          contactName={lead?.contact?.name || company?.tradeName || undefined}
          onClose={() => setWhatsappOpen(false)}
        />
      )}

      {confirmDialog}
    </div>
  );
}
