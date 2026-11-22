import { BarChart, HeatmapChart } from '../../../components/charts/index.js';

export function HeatmapWidget({ data }: { data?: any }) {
  if (!data) return null;
  return <HeatmapChart data={data.map((c: any) => [c.hour, c.dayOfWeek, c.count])} height={260} />;
}

export function AgentPerformanceWidget({ data }: { data?: any }) {
  if (!data) return null;
  return (
    <BarChart
      horizontal={true}
      height={220}
      data={{
        categories: data.map((d: any) => d.agent),
        series: [{ name: 'Leads Qualificados', data: data.map((d: any) => d.qualified) }],
      }}
    />
  );
}

export function LostReasonsWidget({ data }: { data?: any }) {
  if (!data) return null;
  return (
    <BarChart
      horizontal={true}
      height={220}
      data={{
        categories: data.map((d: any) => d.reason),
        series: [{ name: 'Perdidos', data: data.map((d: any) => d.count) }],
      }}
    />
  );
}

export function TmqTile({ value }: { value?: any }) {
  if (value == null) return null;
  return (
    <div className="text-4xl font-black text-slate-200">
      {value.toFixed(1)} <span className="text-lg font-normal text-slate-400">dias</span>
    </div>
  );
}
