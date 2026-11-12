import { Activity, FileText, Play, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/design-system/index.js';

interface OverviewQuickActionsProps {
  onActionModal: (type: string) => void;
}

export function OverviewQuickActions({ onActionModal }: OverviewQuickActionsProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => onActionModal('agent')}
        >
          <div className="p-2 bg-brand/10 text-brand rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Criar Agente</h4>
            <p className="text-xs text-slate-500">Configurar novo agente</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/analytics')}
        >
          <div className="p-2 bg-indigo-50 dark:bg-iris/30 text-iris dark:text-iris rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Ver Análises</h4>
            <p className="text-xs text-slate-500">Métricas recentes</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/playground')}
        >
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Play className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Acessar Playground</h4>
            <p className="text-xs text-slate-500">Testar chamadas</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/knowledge')}
        >
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nova Base</h4>
            <p className="text-xs text-slate-500">Importar conhecimento</p>
          </div>
        </Card>
      </div>
    </>
  );
}
