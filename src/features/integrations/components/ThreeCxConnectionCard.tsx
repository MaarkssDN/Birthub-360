import { IconWrench } from '../../../components/icons/index.js';
import { Card } from '../../../components/ui/Card.js';
import { useAuth } from '../../../contexts/AuthContext.js';
import { use3CXIntegration } from '../../../hooks/use3CXIntegration.js';
import { hasRequiredRole } from '../../../lib/auth/authorization.js';
import { IntegrationStatusBadge } from './IntegrationStatusBadge.js';
import { CapabilityBadge, IntegrationTruthBox } from './integrationUi.js';

export function ThreeCxConnectionCard() {
  const { currentUser } = useAuth();
  const canManage = !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);

  const {
    threecxConnections,
    threecxPbxUrlInput,
    setThreecxPbxUrlInput,
    threecxExtensionInput,
    setThreecxExtensionInput,
    threecxLabelInput,
    setThreecxLabelInput,
    threecxLoading,
    handle3CXConnect,
    handle3CXDisconnect,
    handle3CXTest,
  } = use3CXIntegration();

  return (
    <Card className="p-8 rounded-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-100 dark:border-sky-500/20">
            <IconWrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">PABX Telefonia 3CX</h3>
            <p className="text-sm text-sky-700 dark:text-[#70D6FF] mt-1">
              Cadastro de PABX 3CX e teste de comunicação; recursos avançados dependem da instalação
              3CX conectada e dos webhooks habilitados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${threecxConnections.length > 0 ? 'bg-success/15 text-success-active dark:text-success' : 'bg-surface-2 text-ink-2'}`}
          >
            {threecxConnections.length > 0 ? 'Ativo 24h' : 'Não conectado'}
          </span>
          {threecxConnections.length > 0 && (
            <IntegrationStatusBadge
              capability="write"
              title="Click-to-call dispara chamada real no PABX conectado"
            />
          )}
        </div>
      </div>

      <div className="space-y-6">
        <IntegrationTruthBox>
          <div className="flex flex-wrap gap-2">
            <CapabilityBadge status={threecxConnections.length > 0 ? 'connected' : 'error'}>
              {threecxConnections.length > 0 ? 'conectado' : 'desconectado'}
            </CapabilityBadge>
            <CapabilityBadge status={threecxConnections.length > 0 ? 'write' : 'pending'}>
              click-to-call configurado
            </CapabilityBadge>
            <CapabilityBadge status="pending">gravações dependem de webhook</CapabilityBadge>
            <CapabilityBadge status="pending">discador IA depende de escopo</CapabilityBadge>
          </div>
          <p>
            Esta tela registra conexão/ramal e testa comunicação; ela não prova, sozinha, gravação
            de chamadas ou prospecção 24h em produção.
          </p>
        </IntegrationTruthBox>
        {threecxConnections.length > 0 && (
          <div className="space-y-3">
            {threecxConnections.map((conn) => (
              <div
                key={conn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-ink">{conn.label}</p>
                    <p className="text-xs text-ink-2">
                      {conn.pbxUrl} — Ramal {conn.extension}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handle3CXTest(conn.id)}
                    disabled={!canManage}
                    title={canManage ? undefined : 'Requer permissão de Gestor ou Administrador'}
                    className="px-3 py-2 text-xs font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded-lg transition-colors border border-sky-100 dark:border-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Testar PABX
                  </button>
                  <button
                    type="button"
                    onClick={() => handle3CXDisconnect(conn.id)}
                    disabled={threecxLoading || !canManage}
                    title={canManage ? undefined : 'Requer permissão de Gestor ou Administrador'}
                    className="px-3 py-2 text-xs font-bold text-danger-active dark:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-5 rounded-xl border border-dashed border-line bg-surface-2/50 space-y-4">
          <p className="text-sm font-bold text-brand-ink dark:text-[#00D4FF]">
            {threecxConnections.length > 0
              ? 'Conectar outro PABX 3CX'
              : 'Conectar Servidor 3CX PABX'}
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={threecxLabelInput}
              onChange={(e) => setThreecxLabelInput(e.target.value)}
              placeholder="Nome de exibição (ex.: 3CX Comercial, Ramal 101)"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 shadow-sm bg-surface text-ink placeholder:text-ink-2 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
            <input
              type="url"
              value={threecxPbxUrlInput}
              onChange={(e) => setThreecxPbxUrlInput(e.target.value)}
              placeholder="https://seu-pabx.3cx.us"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 shadow-sm bg-surface text-ink placeholder:text-ink-2 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
            <input
              type="text"
              value={threecxExtensionInput}
              onChange={(e) => setThreecxExtensionInput(e.target.value)}
              placeholder="Ramal (ex.: 101)"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 shadow-sm bg-surface text-ink placeholder:text-ink-2 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handle3CXConnect}
            disabled={threecxLoading || !canManage}
            title={canManage ? undefined : 'Requer permissão de Gestor ou Administrador'}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {threecxLoading ? 'Registrando 3CX...' : 'Conectar 3CX PABX'}
          </button>
        </div>
      </div>
    </Card>
  );
}
