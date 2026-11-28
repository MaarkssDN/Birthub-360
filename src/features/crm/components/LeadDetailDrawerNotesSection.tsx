import { Clock, FileText, Loader2, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Lead } from '../../../types/index.js';

interface LeadDetailDrawerNotesSectionProps {
  lead: Lead;
  noteText: string;
  savingNote: boolean;
  onNoteTextChange: (value: string) => void;
  onAddNote: (e: FormEvent) => void;
}

export function LeadDetailDrawerNotesSection({
  lead,
  noteText,
  savingNote,
  onNoteTextChange,
  onAddNote,
}: LeadDetailDrawerNotesSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand" /> Notas & Histórico
      </h3>
      <form onSubmit={onAddNote} className="space-y-2">
        <textarea
          value={noteText}
          onChange={(e) => onNoteTextChange(e.target.value)}
          placeholder="Adicionar uma observação..."
          rows={3}
          className="w-full p-3 bg-surface-2/40 border border-line rounded-2xl text-xs text-ink focus:outline-none focus:border-brand resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingNote || !noteText.trim()}
            className="px-4 py-2 bg-brand-active hover:brightness-110 text-on-brand rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {savingNote ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Adicionar Nota
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {lead.internalNotes?.map((n) => (
          <div key={n.id} className="p-3 bg-surface-2/40 rounded-2xl border border-line space-y-1">
            <p className="text-xs text-ink whitespace-pre-wrap">{n.content}</p>
            <span className="text-[10px] text-ink-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
