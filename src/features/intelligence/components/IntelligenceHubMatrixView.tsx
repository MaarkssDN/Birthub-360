import { ArrowRight, Star } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Badge } from '../../../components/ui/Badge.js';
import type { IntelligenceTab } from './intelligenceHubTools.js';
import { CATEGORY_SHORT_LABELS, type ToolDefinition } from './intelligenceHubTools.js';

interface IntelligenceHubMatrixViewProps {
  tools: ToolDefinition[];
  pinnedIds: IntelligenceTab[];
  onTogglePin: (id: IntelligenceTab, e?: MouseEvent) => void;
  onOpenTool: (id: IntelligenceTab) => void;
}

export function IntelligenceHubMatrixView({
  tools,
  pinnedIds,
  onTogglePin,
  onOpenTool,
}: IntelligenceHubMatrixViewProps) {
  return (
    <div className="rounded-card border border-line bg-surface/90 dark:bg-surface-elevated/90 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface-2/70 text-ink-2 font-mono uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold w-12 text-center">Pin</th>
              <th className="py-3 px-4 font-semibold">Capacidade / Agente</th>
              <th className="py-3 px-4 font-semibold">Pilar Operacional</th>
              <th className="py-3 px-4 font-semibold hidden md:table-cell">Stack & Metadados</th>
              <th className="py-3 px-4 font-semibold">Destaque</th>
              <th className="py-3 px-4 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isPinned = pinnedIds.includes(tool.id);

              return (
                <tr
                  key={tool.id}
                  onClick={() => onOpenTool(tool.id)}
                  className="hover:bg-surface-2/80 transition-colors cursor-pointer group"
                >
                  {/* Pin Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={(e) => onTogglePin(tool.id, e)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isPinned
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-ink-2/30 hover:text-ink-2'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>

                  {/* Nome e Ícone */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-control bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-on-brand transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-ink group-hover:text-brand transition-colors">
                          {tool.label}
                        </p>
                        <p className="text-[11px] text-ink-2 line-clamp-1 max-w-sm">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium text-ink-2">
                      {CATEGORY_SHORT_LABELS[tool.category]}
                    </span>
                  </td>

                  {/* Stack Metadados */}
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-ink-2">
                    {tool.techMeta}
                  </td>

                  {/* Badge de Destaque */}
                  <td className="py-3 px-4">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold py-0.5 px-2 bg-surface-2 border-line text-ink-2 whitespace-nowrap"
                    >
                      {tool.badge}
                    </Badge>
                  </td>

                  {/* Ação */}
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-1 transition-transform">
                      Executar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
