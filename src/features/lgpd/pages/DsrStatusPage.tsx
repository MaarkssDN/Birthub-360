import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DSR_RIGHT_TYPE_LABELS,
  DSR_STATUS_LABELS,
  type DsrStatusResult,
  dsrDeadlineDate,
  dsrErrorMessage,
  formatDsrDate,
  dsrApi,
} from './dsr.api.js';
import { DsrAlert, DsrShell } from './dsrShared.js';

type StatusState =
  | { kind: 'loading' }
  | { kind: 'success'; result: DsrStatusResult }
  | { kind: 'error'; message: string };

/**
 * `/privacidade/dsr/acompanhamento?token=...` — acompanhamento do pedido pelo
 * token opaco entregue no e-mail. GET /status/:token devolve só metadados
 * (protocolo, tipo, status, datas) — nunca dados pessoais.
 */
export default function DsrStatusPage() {
  const [searchParams] = useSearchParams();
  const statusToken = searchParams.get('token') ?? '';
  const [state, setState] = useState<StatusState>(() =>
    statusToken
      ? { kind: 'loading' }
      : {
          kind: 'error',
          message:
            'Este link está incompleto — falta o token de acompanhamento. Abra o link exatamente como recebido no e-mail ou fale com o DPO.',
        },
  );
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!statusToken) {
      setState({
        kind: 'error',
        message:
          'Este link está incompleto — falta o token de acompanhamento. Abra o link exatamente como recebido no e-mail ou fale com o DPO.',
      });
      return;
    }
    try {
      const result = await dsrApi.status(statusToken);
      if (!mountedRef.current) return;
      setState({ kind: 'success', result });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState({
        kind: 'error',
        message: dsrErrorMessage(
          err,
          'Não foi possível consultar o status agora. Tente novamente em instantes.',
        ),
      });
    }
  }, [statusToken]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DsrShell title="Acompanhamento da sua solicitação">
      {state.kind === 'loading' && statusToken && (
        <p className="text-sm text-ink-2" role="status" aria-live="polite">
          Consultando o status da sua solicitação…
        </p>
      )}

      {state.kind === 'error' && <DsrAlert tone="error">{state.message}</DsrAlert>}

      {state.kind === 'success' && (
        <div className="space-y-5" aria-live="polite">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-2/70">Protocolo</dt>
              <dd className="font-semibold text-ink">{state.result.protocol}</dd>
            </div>
            <div>
              <dt className="text-ink-2/70">Tipo de solicitação</dt>
              <dd className="font-semibold text-ink">
                {DSR_RIGHT_TYPE_LABELS[state.result.rightType] ?? state.result.rightType}
              </dd>
            </div>
            <div>
              <dt className="text-ink-2/70">Status</dt>
              <dd className="font-semibold text-ink">
                {DSR_STATUS_LABELS[state.result.status] ?? state.result.status}
              </dd>
            </div>
            <div>
              <dt className="text-ink-2/70">Recebida em</dt>
              <dd className="font-semibold text-ink">{formatDsrDate(state.result.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-2/70">Prazo de resposta (art. 19 LGPD)</dt>
              <dd className="font-semibold text-ink">até {dsrDeadlineDate(state.result.createdAt)}</dd>
            </div>
          </dl>

          {state.result.status === 'PENDING_VERIFICATION' && (
            <DsrAlert tone="info">
              Sua solicitação ainda aguarda a confirmação pelo link enviado ao seu e-mail.
              Verifique a caixa de entrada (e o spam) e clique no link para concluir.
            </DsrAlert>
          )}
          {state.result.status === 'REJECTED' && (
            <DsrAlert tone="error">
              Não foi possível localizar seus dados para concluir esta solicitação. Fale com o
              DPO pelo e-mail da Política de Privacidade.
            </DsrAlert>
          )}
          {(state.result.status === 'IN_PROGRESS' || state.result.status === 'VERIFIED') && (
            <DsrAlert tone="info">
              Recebido e em análise. Você será avisado por e-mail quando houver atualização —
              nenhuma ação sua é necessária.
            </DsrAlert>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {refreshing ? 'Atualizando…' : 'Atualizar status'}
          </button>
        </div>
      )}
    </DsrShell>
  );
}
