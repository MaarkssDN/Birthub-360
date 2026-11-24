import {
  AlertTriangle,
  Clock,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Music,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { voiceHubApi, type VoiceCallSummary } from '../api/voiceHub.api.js';
import { logger } from '../../../lib/logger.js';

// Rótulo honesto do executor das chamadas listadas: VoiceCallLog não guarda um nome de agente
// por chamada — toda linha vem do fluxo de voz IA (SDR Birth Voices). Nunca exibir um nome
// de agente inventado.
const AGENT_LABEL = 'Agente de Voz IA';

// `outcome` é o estado classificado por classifyCallOutcome (birthVoice.helpers.ts) — vocabulário
// fechado, nunca um "sentimento" inventado. O rótulo PT-BR abaixo apenas traduz o estado real.
const OUTCOME_LABELS: Record<string, string> = {
  completed: 'Concluída',
  voicemail: 'Caixa postal',
  busy: 'Ocupado',
  timeout: 'Timeout',
  'invalid-number': 'Número inválido',
  failed: 'Falhou',
  cancelled: 'Cancelada',
  'no-answer': 'Não atendida',
  unknown: 'Desconhecido',
};

type OutcomeTone = 'positive' | 'neutral' | 'negative';

function outcomeLabel(outcome: string): string {
  return OUTCOME_LABELS[outcome] ?? outcome;
}

function outcomeTone(outcome: string): OutcomeTone {
  if (outcome === 'completed') return 'positive';
  if (outcome === 'no-answer' || outcome === 'voicemail' || outcome === 'unknown')
    return 'neutral';
  return 'negative';
}

interface SessionRecord {
  id: string;
  agentName: string;
  caller: string;
  dateTime: string;
  duration: string;
  durationSeconds: number;
  outcome: string;
  outcomeText: string;
  tone: OutcomeTone;
  summary: string;
  audioUrl?: string;
}

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

function formatDurationSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.round(totalSeconds) : 0;
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;
  const mmss = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return hh > 0 ? `${hh}:${mmss}` : mmss;
}

function mapVoiceCalls(calls: VoiceCallSummary[]): SessionRecord[] {
  return calls.map((call) => ({
    id: call.id,
    agentName: AGENT_LABEL,
    caller: call.leadTitle || `Lead ${call.leadId}`,
    dateTime: new Date(call.createdAt).toLocaleString(),
    duration: formatDurationSeconds(call.durationSeconds ?? 0),
    durationSeconds: Number.isFinite(call.durationSeconds) ? call.durationSeconds : 0,
    outcome: call.outcome || 'unknown',
    outcomeText: outcomeLabel(call.outcome || 'unknown'),
    tone: outcomeTone(call.outcome || 'unknown'),
    summary: call.summary || 'Resumo não disponível',
    audioUrl: call.recordingUrl || '',
  }));
}

type TranscriptState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; text: string | null }
  | { status: 'error' };

function formatAverageDurationSeconds(sessions: SessionRecord[]): string | null {
  const withDuration = sessions.filter((s) => s.durationSeconds > 0);
  if (withDuration.length === 0) return null;
  const avg = Math.round(
    withDuration.reduce((acc, s) => acc + s.durationSeconds, 0) / withDuration.length,
  );
  return formatDurationSeconds(avg);
}

export default function ResultsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [transcript, setTranscript] = useState<TranscriptState>({ status: 'idle' });
  const transcriptRequestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    setLoadError(null);

    // Endpoint canônico `/api/integrations/birth-voice/calls` (VoiceCallLog, tenant-scoped).
    // O prefixo legado `/api/voice-hub/*` segue fail-closed (503 MODULE_NOT_READY) até a
    // decisão de reabertura do gate — ver handoff 65-para-00-voicehub-503-gate.
    void (async () => {
      try {
        const page = await voiceHubApi.getVoiceCalls(50);
        if (cancelled) return;
        const mapped = mapVoiceCalls(page.calls);
        setSessions(mapped);
        setSelectedSession(null);
        setTranscript({ status: 'idle' });
        setLoadState(mapped.length === 0 ? 'empty' : 'ready');
      } catch (err: unknown) {
        if (cancelled) return;
        logger.warn({ err }, '[Results] Falha ao carregar chamadas de voz');
        setSessions([]);
        setSelectedSession(null);
        setLoadError(
          err instanceof Error && err.message
            ? `Não foi possível carregar as chamadas de voz: ${err.message}`
            : 'Falha de rede ao carregar chamadas de voz. Nenhuma métrica foi inventada.',
        );
        setLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filteredSessions = sessions.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const averageDuration = useMemo(() => formatAverageDurationSeconds(sessions), [sessions]);
  // "Conversas realizadas" é derivado do outcome real classificado ('completed' = conversa
  // confirmada por callResultedInConversation) — não é uma pontuação de sentimento inventada.
  const conversationShare = useMemo(() => {
    if (sessions.length === 0) return null;
    const completed = sessions.filter((s) => s.outcome === 'completed').length;
    return Math.round((completed / sessions.length) * 100);
  }, [sessions]);
  const completedCount = useMemo(
    () => sessions.filter((s) => s.outcome === 'completed').length,
    [sessions],
  );

  const handleSelectSession = (session: SessionRecord) => {
    setSelectedSession(session);
    const requestId = ++transcriptRequestRef.current;
    setTranscript({ status: 'loading' });
    voiceHubApi
      .getVoiceCall(session.id)
      .then((detail) => {
        if (transcriptRequestRef.current !== requestId) return;
        setTranscript({ status: 'ready', text: detail?.transcript ?? null });
      })
      .catch((err: unknown) => {
        if (transcriptRequestRef.current !== requestId) return;
        logger.warn({ err, callId: session.id }, '[Results] Falha ao carregar transcrição');
        setTranscript({ status: 'error' });
      });
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    const headers = [
      'ID da Sessão',
      'Canal/Agente',
      'Caller/Contato',
      'Data e Hora',
      'Duração',
      'Resultado da Chamada (outcome real)',
      'Resumo Comercial/Operacional',
    ];

    // A transcrição integral não vem na listagem (só em GET /calls/:id) — o CSV exporta os
    // campos da listagem; a transcrição fica disponível na visualização detalhada da sessão.
    const csvContent = [
      headers.join(','),
      ...sessions.map((s) => {
        const escapedAgentName = `"${(s.agentName || '').replace(/"/g, '""')}"`;
        const escapedSummary = `"${(s.summary || '').replace(/"/g, '""')}"`;

        return [
          s.id,
          escapedAgentName,
          `"${s.caller.replace(/"/g, '""')}"`,
          s.dateTime,
          s.duration,
          `"${s.outcomeText}"`,
          escapedSummary,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `hub_resultados_transcricoes_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Resultados & Transcrições</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitore e analise os diálogos e métricas consolidadas dos agentes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={sessions.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium text-sm transition-opacity shadow-sm shrink-0 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Exportar Dados (CSV)
        </button>
      </div>

      {loadState === 'loading' && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
        >
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando chamadas de voz…
        </div>
      )}

      {loadState === 'error' && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {loadError ||
                'Módulo de voz indisponível. Nenhuma chamada ou métrica foi inventada para preencher esta tela.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadToken((n) => n + 1)}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Metrics — only from loaded sessions; never fabricate averages or scores. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total de Chamadas
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {loadState === 'ready' || loadState === 'empty' ? sessions.length : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {loadState === 'ready' || loadState === 'empty'
              ? 'Contagem a partir dos call logs carregados'
              : 'Aguardando dados reais do servidor'}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Duração Média
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {averageDuration ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {averageDuration
              ? 'Calculada só com durações parseáveis das sessões carregadas'
              : 'Sem durações suficientes para calcular'}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Conversas Realizadas
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {conversationShare === null ? '—' : `${conversationShare}%`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {conversationShare === null
              ? 'Sem sessões para derivar resultado'
              : `${completedCount} de ${sessions.length} chamadas com outcome "completed" (conversa confirmada)`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por ID, agente, resumo ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadState !== 'ready'}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-sans disabled:bg-slate-100"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-hide">
            {loadState === 'loading' && (
              <div role="status" className="p-8 text-center text-slate-400 text-sm">
                Carregando sessões…
              </div>
            )}
            {loadState === 'error' && (
              <div role="status" className="p-8 text-center text-slate-500 text-sm">
                Lista vazia de propósito — o servidor não confirmou chamadas de voz.
              </div>
            )}
            {loadState === 'empty' && (
              <div role="status" className="p-8 text-center text-slate-400 text-sm">
                Nenhuma sessão registrada ainda para esta organização.
              </div>
            )}
            {loadState === 'ready' && filteredSessions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma sessão corresponde aos filtros digitados.
              </div>
            )}
            {loadState === 'ready' &&
              filteredSessions.map((s) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                  onClick={() => handleSelectSession(s)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${
                    selectedSession?.id === s.id ? 'bg-brand-50 border-brand' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{s.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        s.tone === 'positive'
                          ? 'bg-green-100 text-green-700'
                          : s.tone === 'neutral'
                            ? 'bg-slate-100 text-slate-650'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.outcomeText}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900 mt-1.5 truncate">
                    {s.agentName}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="font-mono">{s.caller}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {s.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">{s.summary}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {selectedSession ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-brand font-bold bg-brand-50 px-2 py-1 rounded">
                      {selectedSession.id}
                    </span>
                    <span className="text-xs text-slate-400">{selectedSession.dateTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                    {selectedSession.agentName}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">{selectedSession.caller}</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                      selectedSession.tone === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : selectedSession.tone === 'neutral'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedSession.outcomeText}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-250">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Resumo Comercial / Operacional
                </h4>
                <p className="text-sm text-slate-700 mt-2.5 font-medium leading-relaxed">
                  {selectedSession.summary}
                </p>
              </div>

              <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 text-brand rounded-full">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      Gravação do Áudio da Chamada
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedSession.audioUrl
                        ? `Gravado pelo canal de voz (${selectedSession.duration})`
                        : 'Nenhuma URL de áudio confirmada pelo servidor para esta sessão'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!selectedSession.audioUrl}
                  onClick={() => {
                    if (!selectedSession.audioUrl) return;
                    const link = document.createElement('a');
                    link.href = selectedSession.audioUrl;
                    link.setAttribute('download', `chamada_${selectedSession.id}.wav`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 hover:bg-brand-50 text-slate-600 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Baixar Áudio
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Diálogo Completo
                </h4>
                <div className="space-y-3 max-h-[320px] overflow-y-auto bg-slate-50 border border-slate-100 p-4 rounded-lg scrollbar-hide">
                  {transcript.status === 'loading' && (
                    <div role="status" className="text-xs text-slate-500 text-center py-4">
                      Carregando transcrição da chamada…
                    </div>
                  )}
                  {transcript.status === 'error' && (
                    <div role="alert" className="text-xs text-amber-700 text-center py-4">
                      Não foi possível carregar a transcrição desta chamada.
                    </div>
                  )}
                  {transcript.status === 'ready' && !transcript.text && (
                    <div className="text-xs text-slate-500 text-center py-4">
                      Transcrição não disponível para esta chamada.
                    </div>
                  )}
                  {transcript.status === 'ready' &&
                    transcript.text &&
                    transcript.text.split('\n').map((line, idx) => {
                      const isAgent = line.startsWith('Agente:');
                      const cleanLine = line
                        .replace('Agente:', '')
                        .replace('Usuário:', '')
                        .trim();
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {isAgent ? 'Agente de Voz' : 'Usuário / Contato'}
                          </span>
                          <div
                            className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                              isAgent
                                ? 'bg-white text-slate-850 hover:border-slate-200 border border-slate-100 rounded-tl-none font-medium'
                                : 'bg-brand text-white rounded-tr-none'
                            }`}
                          >
                            {cleanLine}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              {loadState === 'error'
                ? 'Call logs indisponíveis — nada a exibir até o módulo Voice Hub responder com dados reais.'
                : 'Selecione uma chamada do painel esquerdo para visualizar as transcrições e análises correspondentes.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
