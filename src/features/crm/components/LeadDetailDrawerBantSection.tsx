import { ChevronDown, ChevronUp, ClipboardList, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import type { Lead, LeadQualification } from '../../../types/index.js';
import type { LeadScoreResult } from '../domain/leadScoreCalculator.js';
import { TEMPERATURE_EMOJI } from './leadDetailDrawer.constants.js';

const QUALIFICATION_GROUPS = [
  {
    category: 'budget',
    label: '💰 Budget / Orçamento',
    options: [
      { label: 'Aprovado (Verba garantida para telemetria/rastreamento)', value: 'aprovado' },
      { label: 'Em Planejamento / Estimativa orçamentária', value: 'em_planejamento' },
      { label: 'Indefinido / Avaliando viabilidade', value: 'indefinido' },
      { label: 'Sem Verba / Restrição orçamentária', value: 'sem_verba' },
    ],
  },
  {
    category: 'authority',
    label: '👑 Authority / Nível de Decisão',
    options: [
      { label: 'Decisor C-Level / Sócio / Diretor Executivo', value: 'decisor_clevel' },
      {
        label: 'Influenciador Forte / Gerente de Frota ou Logística',
        value: 'influenciador_gerente',
      },
      { label: 'Usuário Operacional / Supervisor de Pátio', value: 'usuario_operacional' },
      { label: 'Contato inicial / Sem autoridade', value: 'sem_autoridade' },
    ],
  },
  {
    category: 'need',
    label: '🎯 Need / Dores Principais (SPIN)',
    options: [
      {
        label: 'Dor Crítica (Alto custo de Diesel / Sinistros frequentes)',
        value: 'critica_urgente',
      },
      {
        label: 'Otimização Moderada (Controle de jornada e telemetria CAN)',
        value: 'moderada_otimizacao',
      },
      { label: 'Curiosidade / Comparação com concorrentes', value: 'curiosidade_benchmarking' },
      { label: 'Sem Dor identificada no momento', value: 'sem_dor' },
    ],
  },
  {
    category: 'timing',
    label: '⏳ Timing / Prazo de Decisão',
    options: [
      { label: 'Imediato (< 30 dias para início do piloto)', value: 'imediato_30d' },
      { label: 'Curto Prazo (30 a 60 dias)', value: 'curto_60d' },
      { label: 'Médio Prazo (60 a 90 dias)', value: 'medio_90d' },
      { label: 'Longo Prazo (> 90 dias / Indefinido)', value: 'longo_prazo' },
    ],
  },
];

interface LeadDetailDrawerBantSectionProps {
  lead: Lead;
  qualOpen: boolean;
  qualDraft: LeadQualification;
  liveScore: LeadScoreResult;
  savingQual: boolean;
  onToggleQual: () => void;
  onQualDraftChange: (draft: LeadQualification) => void;
  onSaveQualification: () => void;
}

export function LeadDetailDrawerBantSection({
  lead,
  qualOpen,
  qualDraft,
  liveScore,
  savingQual,
  onToggleQual,
  onQualDraftChange,
  onSaveQualification,
}: LeadDetailDrawerBantSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand" /> Matriz BANT & Lead Score
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              liveScore.temperature === 'Quente'
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : liveScore.temperature === 'Morno'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
            }`}
          >
            {TEMPERATURE_EMOJI[liveScore.temperature]} {liveScore.score}/100
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            SoundFX.play('click');
            onToggleQual();
          }}
          className="text-xs text-brand-ink dark:text-brand hover:underline font-semibold flex items-center gap-1 active:scale-95 transition-all"
        >
          {qualOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {qualOpen ? 'Fechar' : 'Editar BANT'}
        </button>
      </div>

      {qualOpen ? (
        <div className="bg-surface-2/40 p-4 rounded-2xl border border-line space-y-4">
          {/* Score Meter */}
          <div className="p-3.5 rounded-xl bg-surface border border-line space-y-2 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-60" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                🎯 Lead Score:{' '}
                <b className="text-sm font-black text-brand-ink dark:text-brand">
                  {liveScore.score}
                </b>
                /100
              </span>
              <span className="text-xs font-bold text-ink-2">
                Classificação:{' '}
                <b className="text-ink">
                  {TEMPERATURE_EMOJI[liveScore.temperature]} {liveScore.temperature}
                </b>
              </span>
            </div>

            <div className="w-full bg-surface-2 h-2.5 rounded-full overflow-hidden border border-line/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  liveScore.score >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : liveScore.score >= 40
                      ? 'bg-gradient-to-r from-blue-500 to-amber-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${liveScore.score}%` }}
              />
            </div>

            <p className="text-[11px] text-ink-2 italic pt-1">💡 {liveScore.recommendation}</p>
          </div>

          {QUALIFICATION_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <label
                htmlFor={`qual-${group.category}`}
                className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block"
              >
                {group.label}
              </label>
              <select
                id={`qual-${group.category}`}
                value={qualDraft[group.category as keyof LeadQualification] || ''}
                onChange={(e) =>
                  onQualDraftChange({ ...qualDraft, [group.category]: e.target.value })
                }
                className="w-full p-2 bg-surface border border-line rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-brand"
              >
                <option value="">Selecione...</option>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <Button
            type="button"
            variant="cosmic"
            shine
            soundClick
            onClick={onSaveQualification}
            loading={savingQual}
            className="w-full"
          >
            {!savingQual && <Save className="w-3.5 h-3.5 mr-2" />}
            Salvar Matriz & Atualizar Score ({liveScore.score} pts)
          </Button>
        </div>
      ) : (
        <div className="bg-surface-2/40 p-4 rounded-2xl border border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-ink">Score Atual:</span>
              <span className="px-2 py-0.5 rounded-lg bg-surface border border-line font-black text-xs text-brand-ink dark:text-brand">
                {lead.score ?? liveScore.score}/100
              </span>
            </div>
            <span className="text-xs font-bold text-ink-2">
              Temperatura:{' '}
              <b className="text-ink">
                {TEMPERATURE_EMOJI[lead.temperature || liveScore.temperature]}{' '}
                {lead.temperature || liveScore.temperature}
              </b>
            </span>
          </div>

          {Object.keys(lead.qualification || {}).length === 0 ? (
            <p className="text-xs text-ink-2 italic">
              Nenhuma resposta BANT registrada ainda. Clique em &quot;Editar BANT&quot; para
              qualificar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/50">
              {Object.entries(lead.qualification || {}).map(([k, v]) => (
                <div key={k} className="p-2 rounded-xl bg-surface border border-line/60">
                  <span className="text-[10px] text-ink-2 uppercase font-bold block">{k}</span>
                  <span className="text-xs font-semibold text-ink capitalize">
                    {String(v).replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
