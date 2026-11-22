import { useState } from 'react';
import { api } from '../../../../lib/api.js';

interface ProviderState {
  id: string;
  configured?: boolean;
  status: string;
  message?: string;
  error?: string;
  billable?: boolean;
  models?: string[];
  latencyMs?: number;
}

export function TurboProvidersPanel() {
  const [providers, setProviders] = useState<ProviderState[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async (test: boolean) => {
    setLoading(true);
    setError(null);
    try {
      setProviders(
        test
          ? await api.post<ProviderState[]>('/api/prospecting/providers/test', {})
          : await api.get<ProviderState[]>('/api/prospecting/providers'),
      );
    } catch (failure: unknown) {
      setError(
        failure instanceof Error ? failure.message : 'Não foi possível consultar provedores.',
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <details className="rounded-xl border border-line bg-surface p-4 mb-4 text-xs text-ink-2">
      <summary className="cursor-pointer py-2 font-semibold text-ink">
        Central de provedores
      </summary>
      <p className="my-2">
        Configuração não comprova autenticação. Teste de conexão verifica somente endpoints
        autorizados de autenticação ou modelos; Google Places e consultas empresariais exigem
        validação específica. Testes administrativos dependem da sua permissão.
      </p>
      <div className="flex flex-wrap gap-2 my-3">
        <button
          type="button"
          onClick={() => load(false)}
          disabled={loading}
          className="p-2 rounded-lg border border-line text-ink"
        >
          Consultar estados
        </button>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="p-2 rounded-lg border border-line text-ink"
        >
          Testar conexões autorizadas
        </button>
      </div>
      {loading && <p role="status">Consultando provedores...</p>}
      {error && (
        <p role="alert" className="text-warning-active dark:text-warning">
          {error}
        </p>
      )}
      {providers?.map((provider) => (
        <div key={provider.id} className="border-t border-line py-2 space-y-1">
          <p className="font-semibold text-ink">
            {provider.id}: {provider.status}
          </p>
          {provider.configured !== undefined && (
            <p>Configuração: {provider.configured ? 'presente' : 'ausente'}</p>
          )}
          {(provider.message || provider.error) && <p>{provider.message || provider.error}</p>}
          {provider.latencyMs !== undefined && <p>Latência: {provider.latencyMs} ms</p>}
          {provider.models?.length ? (
            <p>Modelos disponíveis: {provider.models.join(', ')}</p>
          ) : null}
          {provider.billable && <p>Pode consumir créditos. Cota e custo dependem do fornecedor.</p>}
        </div>
      ))}
    </details>
  );
}
