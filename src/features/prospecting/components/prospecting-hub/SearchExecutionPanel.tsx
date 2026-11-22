import { useState } from 'react';
import { api } from '../../../../lib/api.js';

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  totalResults: number;
  costUsd?: number;
  providersCalled?: Array<{
    provider: string;
    resultCount: number;
    status: string;
    costUsd: number;
  }>;
}

export function SearchExecutionPanel({ searchId }: { searchId: string }) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setExecution(
        await api.get<Execution>(`/api/prospecting/searches/${encodeURIComponent(searchId)}`),
      );
    } catch (failure: unknown) {
      setError(
        failure instanceof Error ? failure.message : 'Não foi possível carregar a execução.',
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="text-xs space-y-2">
      <button type="button" onClick={load} disabled={loading} className="py-2 underline text-ink">
        {loading ? 'Carregando histórico...' : 'Consultar histórico e custo desta execução'}
      </button>
      {error && (
        <p role="alert" className="text-warning-active dark:text-warning">
          {error}
        </p>
      )}
      {execution && (
        <div className="space-y-1">
          <p>
            Status registrado: {execution.status} · Resultados: {execution.totalResults}
          </p>
          <p>
            Início: {new Date(execution.startedAt).toLocaleString('pt-BR')} · Duração:{' '}
            {execution.durationMs === undefined ? 'Não informada' : `${execution.durationMs} ms`}
          </p>
          <p>
            Custo estimado registrado (USD): {execution.costUsd ?? 'Não informado'} — pode não
            incluir todos os custos cobrados pelo fornecedor.
          </p>
          {(execution.providersCalled ?? []).map((call, i) => (
            <p key={i}>
              {call.provider}: {call.status} · {call.resultCount} resultados · estimativa USD{' '}
              {call.costUsd}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
