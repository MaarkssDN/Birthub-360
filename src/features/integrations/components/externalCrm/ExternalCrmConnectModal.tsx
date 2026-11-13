import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  PlugZap,
  X,
} from 'lucide-react';
import type React from 'react';

export interface ProviderMeta {
  emoji: string;
  tagline: string;
  description: string;
  docsUrl?: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  tokenHelp: string;
  requiresDomain?: boolean;
  domainLabel?: string;
  domainPlaceholder?: string;
  requiresBoardId?: boolean;
  boardIdLabel?: string;
  boardIdPlaceholder?: string;
  capabilities: Array<{ label: string; type: 'read' | 'write' | 'sync' }>;
  truthText: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
}

interface ExternalCrmConnectModalProps {
  meta: ProviderMeta;
  displayName: string;
  saving: boolean;
  testingBeforeSave: boolean;
  showTokenText: boolean;
  setShowTokenText: React.Dispatch<React.SetStateAction<boolean>>;
  formLabel: string;
  setFormLabel: React.Dispatch<React.SetStateAction<string>>;
  formToken: string;
  setFormToken: React.Dispatch<React.SetStateAction<string>>;
  formDomain: string;
  setFormDomain: React.Dispatch<React.SetStateAction<string>>;
  formBoardId: string;
  setFormBoardId: React.Dispatch<React.SetStateAction<string>>;
  formInboundEvents: boolean;
  setFormInboundEvents: React.Dispatch<React.SetStateAction<boolean>>;
  formValidationErrors: Record<string, string>;
  setFormValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pingResult: { success: boolean; message: string } | null;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  onPing: () => void;
}

export function ExternalCrmConnectModal({
  meta,
  displayName,
  saving,
  testingBeforeSave,
  showTokenText,
  setShowTokenText,
  formLabel,
  setFormLabel,
  formToken,
  setFormToken,
  formDomain,
  setFormDomain,
  formBoardId,
  setFormBoardId,
  formInboundEvents,
  setFormInboundEvents,
  formValidationErrors,
  setFormValidationErrors,
  pingResult,
  onSave,
  onClose,
  onPing,
}: ExternalCrmConnectModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {meta.emoji}
            </span>
            <div>
              <h3 id="crm-modal-title" className="text-lg font-bold text-ink">
                Conectar {displayName}
              </h3>
              <p className="text-xs text-ink-2">Preencha as credenciais da integração</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-ink-2 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSave} className="space-y-4">
          {/* Nome / Rótulo da Conexão */}
          <div>
            <label
              htmlFor="modal-crm-label"
              className="block text-xs font-semibold text-ink-2 mb-1"
            >
              Nome de Identificação (opcional)
            </label>
            <input
              id="modal-crm-label"
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder={`Ex: ${displayName} Comercial`}
              disabled={saving}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-line bg-surface-1 text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>

          {/* Token / Credencial Principal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="modal-crm-token"
                className="text-xs font-semibold text-ink-2 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand" />
                {meta.tokenLabel}
              </label>
              <button
                type="button"
                onClick={() => setShowTokenText((v) => !v)}
                className="text-[11px] text-ink-2 hover:text-ink inline-flex items-center gap-1"
                tabIndex={-1}
              >
                {showTokenText ? (
                  <>
                    <EyeOff className="w-3 h-3" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" /> Ver
                  </>
                )}
              </button>
            </div>
            <input
              id="modal-crm-token"
              type={showTokenText ? 'text' : 'password'}
              required
              value={formToken}
              onChange={(e) => {
                setFormToken(e.target.value);
                if (formValidationErrors.token) {
                  setFormValidationErrors((prev) => ({ ...prev, token: '' }));
                }
              }}
              placeholder={meta.tokenPlaceholder}
              disabled={saving}
              autoComplete="off"
              className={`w-full px-3.5 py-2 text-sm font-mono rounded-lg border ${
                formValidationErrors.token ? 'border-danger' : 'border-line'
              } bg-surface-1 text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors`}
            />
            {formValidationErrors.token && (
              <p className="mt-1 text-xs text-danger">{formValidationErrors.token}</p>
            )}
            <p className="mt-1 text-[11px] text-ink-3 leading-relaxed flex items-start gap-1">
              <HelpCircle className="w-3 h-3 shrink-0 mt-0.5 text-ink-3" />
              {meta.tokenHelp}
            </p>
          </div>

          {/* Domínio / Portal (se aplicável) */}
          {meta.requiresDomain && (
            <div>
              <label
                htmlFor="modal-crm-domain"
                className="block text-xs font-semibold text-ink-2 mb-1"
              >
                {meta.domainLabel ?? 'Domínio / Subdomínio'}
              </label>
              <input
                id="modal-crm-domain"
                type="text"
                value={formDomain}
                onChange={(e) => {
                  setFormDomain(e.target.value);
                  if (formValidationErrors.domain) {
                    setFormValidationErrors((prev) => ({ ...prev, domain: '' }));
                  }
                }}
                placeholder={meta.domainPlaceholder}
                disabled={saving}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  formValidationErrors.domain ? 'border-danger' : 'border-line'
                } bg-surface-1 text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors`}
              />
              {formValidationErrors.domain && (
                <p className="mt-1 text-xs text-danger">{formValidationErrors.domain}</p>
              )}
            </div>
          )}

          {/* ID do Quadro (Monday.com) */}
          {meta.requiresBoardId && (
            <div>
              <label
                htmlFor="modal-crm-board"
                className="block text-xs font-semibold text-ink-2 mb-1"
              >
                {meta.boardIdLabel ?? 'ID do Quadro (Board ID)'}
              </label>
              <input
                id="modal-crm-board"
                type="text"
                required
                value={formBoardId}
                onChange={(e) => {
                  setFormBoardId(e.target.value);
                  if (formValidationErrors.boardId) {
                    setFormValidationErrors((prev) => ({ ...prev, boardId: '' }));
                  }
                }}
                placeholder={meta.boardIdPlaceholder}
                disabled={saving}
                className={`w-full px-3.5 py-2 text-sm font-mono rounded-lg border ${
                  formValidationErrors.boardId ? 'border-danger' : 'border-line'
                } bg-surface-1 text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors`}
              />
              {formValidationErrors.boardId && (
                <p className="mt-1 text-xs text-danger">{formValidationErrors.boardId}</p>
              )}
            </div>
          )}

          {/* Switch Webhook de Entrada */}
          <div className="p-3 rounded-xl border border-line bg-surface-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-ink">Habilitar Webhooks de Entrada</p>
              <p className="text-[11px] text-ink-2">
                Recebe atualizações de leads e negócios automaticamente quando alterados no{' '}
                {displayName}.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formInboundEvents}
                onChange={(e) => setFormInboundEvents(e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-line rounded-full peer-checked:bg-brand transition-colors peer-disabled:opacity-40" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-xs" />
            </label>
          </div>

          {/* Banner de Resultado do Teste em Tempo Real */}
          {pingResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                pingResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                  : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
              }`}
            >
              {pingResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <p className="font-medium leading-relaxed">{pingResult.message}</p>
            </div>
          )}

          {/* Botões do Modal */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
            <button
              type="button"
              disabled={testingBeforeSave || saving}
              onClick={onPing}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-ink font-semibold text-sm rounded-xl border border-line flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {testingBeforeSave ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
              ) : (
                <PlugZap className="w-4 h-4 text-brand" />
              )}
              {testingBeforeSave ? 'Testando Conexão...' : 'Testar Conexão'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || testingBeforeSave}
                className="px-4 py-2 text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2 rounded-xl transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || testingBeforeSave}
                className="px-5 py-2 bg-brand text-on-brand font-bold text-sm rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Validando e Salvando...' : 'Salvar Conexão'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
