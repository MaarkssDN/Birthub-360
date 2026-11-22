import { Check, Copy, FileText, Printer } from 'lucide-react';

interface Pauta1to1TabProps {
  copyPautaToClipboard: () => void;
  copiedPauta: boolean;
  generatePautaMarkdown: () => string;
}

export function Pauta1to1Tab({
  copyPautaToClipboard,
  copiedPauta,
  generatePautaMarkdown,
}: Pauta1to1TabProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-card-lg border border-line bg-surface shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Pauta de Acompanhamento 1:1 — João Reis &amp; Gestor
            </h3>
            <p className="text-xs text-ink-2">
              Relatório executivo formatado pronto para apresentação na reunião individual de
              alinhamento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPautaToClipboard}
              className="px-4 py-2.5 rounded-xl bg-brand-active text-on-brand font-bold text-xs shadow-md hover:brightness-105 transition-colors cursor-pointer flex items-center gap-2"
            >
              {copiedPauta ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedPauta ? 'Copiado!' : 'Copiar Pauta (Markdown)'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2.5 rounded-xl border border-line bg-surface-2 text-ink-2 font-bold text-xs hover:text-ink transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-line bg-surface-2 font-mono text-xs text-ink leading-relaxed space-y-4 whitespace-pre-wrap select-all">
          {generatePautaMarkdown()}
        </div>
      </div>
    </div>
  );
}
