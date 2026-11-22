import { Calendar, CheckCircle, UserPlus, Users } from 'lucide-react';
import { ChannelDonut } from '../../../../components/ui/ChannelDonut.js';
import { type DealCardData, DealsGrid } from '../../../../components/ui/DealsGrid.js';
import { type FunnelBarItem, FunnelBars } from '../../../../components/ui/FunnelBars.js';
import { KpiCard } from '../../../../components/ui/KpiCard.js';

interface MonthFunnelTabProps {
  monthName: string;
  leadsNovos: number;
  leadsNovosCaption: string;
  leadsTrabalhados: number;
  taxaContato: number;
  reuniaoAgendada: number;
  taxaAgendamento: number;
  convertido: number;
  ganhoValor: number;
  funnelItems: FunnelBarItem[];
  channelData: Record<string, number>;
  channelHex: Record<string, string>;
  deals: DealCardData[];
  formatCurrency: (value: number) => string;
}

export function MonthFunnelTab({
  monthName,
  leadsNovos,
  leadsNovosCaption,
  leadsTrabalhados,
  taxaContato,
  reuniaoAgendada,
  taxaAgendamento,
  convertido,
  ganhoValor,
  funnelItems,
  channelData,
  channelHex,
  deals,
  formatCurrency,
}: MonthFunnelTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={UserPlus}
          tone="brand"
          label="Leads Novos"
          value={leadsNovos}
          caption={leadsNovosCaption}
        />
        <KpiCard
          icon={Users}
          tone="ink"
          label="Leads Trabalhados"
          value={leadsTrabalhados}
          caption={`Taxa de contato: ${taxaContato}%`}
        />
        <KpiCard
          icon={Calendar}
          tone="gold"
          label="Reuniões Agendadas"
          value={reuniaoAgendada}
          caption={`Agendamento: ${taxaAgendamento}%`}
        />
        <KpiCard
          icon={CheckCircle}
          tone="ok"
          label="Convertidos"
          value={convertido}
          caption={`Receita ganha: ${formatCurrency(ganhoValor)}`}
        />
      </div>

      <div className="space-y-4 rounded-card-lg border border-line bg-surface p-6 shadow-card">
        <h3 className="text-sm font-black text-ink">Funil de Leads — {monthName}</h3>
        <FunnelBars items={funnelItems} />
      </div>

      <div className="space-y-3 rounded-card-lg border border-line bg-surface p-6 shadow-card">
        <h3 className="text-sm font-black text-ink">Canal das atividades — {monthName}</h3>
        <ChannelDonut
          data={channelData}
          colorMap={channelHex}
          totalLabel="atividades"
          formatLabel={(label) => label.replace(' (genérico)', '')}
        />
        <p className="text-[11px] text-ink-2">
          &quot;Contatar cliente (genérico)&quot; é o rótulo padrão da ferramenta de cadência — o
          canal real só aparece discriminado numa parte pequena dos registros.
        </p>
      </div>

      <div className="space-y-4 rounded-card-lg border border-line bg-surface p-6 shadow-card">
        <h3 className="text-sm font-black text-ink">
          Negócios rastreados a partir de Leads convertidos — {monthName}
        </h3>
        <DealsGrid deals={deals} />
      </div>
    </div>
  );
}
