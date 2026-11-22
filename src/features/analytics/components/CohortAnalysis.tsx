import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.js';
import { api } from '../../../lib/api.js';
import { toast } from '../../../lib/toast.js';

interface CohortRow {
  month: string;
  total: number;
  won30d: number;
  won60d: number;
}

export function CohortAnalysis() {
  const [cohortData, setCohortData] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // `api.get` já desembrulha o envelope `{success,data}` do backend — ver `apiFetch` em
    // `src/lib/api.ts`. Antes desta correção o backend devolvia `{success,cohorts}` (sem
    // `data`), então `res.data` aqui sempre resolvia `undefined` e a tela nunca mostrava nada
    // além do estado de erro, mesmo com o número fictício ainda presente no servidor.
    api
      .get<{ cohorts: CohortRow[] }>('/api/analytics/cohort')
      .then((res) => {
        setCohortData(res.cohorts || []);
      })
      .catch((err) => {
        console.error(err);
        setError('Erro ao carregar dados de cohort.');
      })
      .finally(() => setLoading(false));
  }, []);

  // `api.get`/`apiFetch` sempre chamam `response.json()` (ver `src/lib/api.ts`) — não servem
  // para baixar um arquivo cru. Mesmo padrão de `fetch` bruto + `Blob` já usado em
  // `commercialIntelligence.api.ts` → `downloadExecutiveExport`.
  const downloadCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/export/csv', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`Falha ao exportar CSV (status ${response.status})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio-cohort.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao baixar CSV:', err);
      toast.error('Não foi possível gerar o CSV. Verifique o servidor.');
    }
  };

  if (loading) return <div>Carregando cohort...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card
      className="mt-6 relative overflow-hidden group/cohort bg-[#1C1D24] border-white/5"
      padding="sm"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B7DFF]/40 to-transparent opacity-0 group-hover/cohort:opacity-100 transition-opacity duration-700 z-20"
        aria-hidden="true"
      />
      <CardHeader className="flex flex-row items-center justify-between relative z-30">
        <CardTitle>Análise de Cohort (Conversão por mês de criação)</CardTitle>
        <button
          type="button"
          onClick={downloadCsv}
          className="bg-[#8B7DFF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#8B7DFF]/90 transition-colors"
        >
          Baixar CSV
        </button>
      </CardHeader>
      <CardContent>
        {cohortData.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">
            Nenhum dado de cohort disponível.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#15151A]/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mês</th>
                  <th className="px-4 py-3 font-semibold">Leads Criados</th>
                  <th className="px-4 py-3 font-semibold">Ganhos em 30 dias</th>
                  <th className="px-4 py-3 font-semibold">Ganhos em 60 dias</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {cohortData.map((row) => (
                  <tr key={row.month} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">{row.month}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3">
                      {row.won30d} ({row.total > 0 ? Math.round((row.won30d / row.total) * 100) : 0}
                      %)
                    </td>
                    <td className="px-4 py-3">
                      {row.won60d} ({row.total > 0 ? Math.round((row.won60d / row.total) * 100) : 0}
                      %)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
