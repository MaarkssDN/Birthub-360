import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useActiveRecord } from '../../hooks/useActiveRecord.js';
import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';

const FloatingChatbook = lazy(() =>
  import('../../features/chatbook/components/FloatingChatbook.js').then((m) => ({
    default: m.FloatingChatbook,
  })),
);

const CopilotoIaPanel = lazy(() =>
  import('../../features/copiloto-ia/components/CopilotoIaPanel.js').then((m) => ({
    default: m.CopilotoIaPanel,
  })),
);

const CHATBOOK_OPEN_KEY = '@birthhub:assistant-chatbook-open';
const COPILOTO_OPEN_KEY = '@birthhub:assistant-copiloto-open';

function readPersisted(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(key) === 'true';
}

function persist(key: string, value: boolean) {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(key, String(value));
}

/**
 * Assistentes globais do Birth Hub 360° (Camada 3 da arquitetura modular):
 *
 * - **Chatbook** — drawer flutuante do assistente de playbook
 *   (`FloatingChatbook`/`useAssistantChat`), montado uma única vez aqui para
 *   que o histórico e o stream SSE sobrevivam à troca de módulos.
 * - **Copiloto IA** — painel lateral NÃO-modal com as conversas do Copiloto
 *   Comercial IA (`CopilotoIaPanel` em modo embed). Não usa o `Drawer` Radix
 *   porque ele é modal (overlay + focus trap) e impediria o uso simultâneo —
 *   o painel segue o mesmo padrão não-modal do FloatingChatbook.
 *
 * Simultaneidade: com os dois abertos em viewport ≥ lg, o Copiloto desloca-se
 * para a esquerda do Chatbook (`lg:right-[540px]`); abaixo disso o painel mais
 * recente sobrepõe — mecanismo adaptativo de "painéis alternáveis" previsto
 * na missão para resoluções menores.
 *
 * Os estados são independentes e persistem em sessionStorage — sobrevivem à
 * troca de módulos porque o dock vive no MainLayout, fora do <main>.
 */
export function AssistantsDock() {
  const { canAccessCopilotoIa } = useAuth();
  const { activeRecord } = useActiveRecord();

  const [chatbookOpen, setChatbookOpen] = useState(() => readPersisted(CHATBOOK_OPEN_KEY));
  const [copilotoOpen, setCopilotoOpen] = useState(() => readPersisted(COPILOTO_OPEN_KEY));
  // FloatingChatbook só é montado após a primeira abertura — antes disso o
  // chunk lazy nem é baixado.
  const [chatbookMounted, setChatbookMounted] = useState(chatbookOpen);

  useEffect(() => {
    if (chatbookOpen) setChatbookMounted(true);
  }, [chatbookOpen]);

  const toggleChatbook = useCallback(() => {
    SoundFX.play('focus');
    setChatbookOpen((prev) => {
      persist(CHATBOOK_OPEN_KEY, !prev);
      return !prev;
    });
  }, []);

  const toggleCopiloto = useCallback(() => {
    SoundFX.play('focus');
    setCopilotoOpen((prev) => {
      persist(COPILOTO_OPEN_KEY, !prev);
      return !prev;
    });
  }, []);

  // Contexto do registro ativo: Lead aberto → painel já filtrado (mesmo
  // contrato do ?leadId= da rota /app/copiloto_ia).
  const copilotoLeadId = activeRecord?.type === 'lead' ? activeRecord.id : undefined;

  return (
    <>
      {/* Pilha de gatilhos — canto inferior direito. Botões quadrados de 48px:
          o VoiceCommandWidget ocupa right-16 (64px), então a pilha fica em
          right-4 (16–64px) sem sobrepor voz, agente ou ações da tela.
          Quando um painel está aberto ele cobre a direita inteira — a pilha
          recua para a esquerda do painel para continuar acessível (é o que
          permite abrir o segundo assistente com o primeiro aberto). Abaixo de
          lg os painéis ocupam quase toda a tela: a pilha se esconde e o
          fechamento fica no botão X de cada painel. */}
      <div
        className={cn(
          // O backdrop do Chatbook (z-[999]) cobre a tela inteira; com ele
          // aberto a pilha sobe para z-[1001] para continuar clicável sobre
          // o fundo escurecido, à esquerda do painel.
          'fixed bottom-4 right-4 z-[900] flex flex-col items-end gap-2',
          chatbookOpen && 'z-[1001]',
          chatbookOpen && copilotoOpen
            ? 'max-xl:hidden xl:right-[996px]'
            : chatbookOpen
              ? 'max-lg:hidden lg:right-[556px]'
              : copilotoOpen
                ? 'max-lg:hidden lg:right-[456px]'
                : '',
        )}
      >
        {canAccessCopilotoIa && (
          <AssistantButton
            label="Copiloto IA"
            description="Conversas, deal health e writeback no CRM"
            open={copilotoOpen}
            onClick={toggleCopiloto}
            testId="assistant-copiloto-toggle"
            accent="iris"
          />
        )}
        <AssistantButton
          label="Chatbook"
          description="Assistente de playbook e roleplay"
          open={chatbookOpen}
          onClick={toggleChatbook}
          testId="assistant-chatbook-toggle"
          accent="cyan"
        />
      </div>

      {/* Chatbook global — monta sob demanda e permanece montado depois disso,
          preservando histórico/stream entre módulos e entre abrir/fechar. */}
      {chatbookMounted && (
        <Suspense fallback={null}>
          <FloatingChatbook isOpen={chatbookOpen} onClose={toggleChatbook} />
        </Suspense>
      )}

      <CopilotoDockPanel
        open={copilotoOpen}
        onClose={toggleCopiloto}
        leadId={copilotoLeadId}
        dockedBesideChatbook={chatbookOpen}
      />
    </>
  );
}

interface CopilotoDockPanelProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  dockedBesideChatbook: boolean;
}

const DOCK_WIDTH = 440;

function CopilotoDockPanel({ open, onClose, leadId, dockedBesideChatbook }: CopilotoDockPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Painel não-modal: Escape fecha; foco vai para o botão fechar ao abrir.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="complementary"
          aria-label="Copiloto IA"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          style={{ width: `min(${DOCK_WIDTH}px, 94vw)` }}
          className={cn(
            'fixed inset-y-0 right-0 z-[1002] flex flex-col border-l border-line bg-surface shadow-[var(--shadow-elevated)]',
            // Com o Chatbook aberto, o painel recua para a esquerda dele em
            // telas ≥ lg; abaixo disso sobrepõe (painéis alternáveis).
            dockedBesideChatbook && 'lg:right-[540px]',
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-display text-[14px] font-bold tracking-[-0.02em] text-ink">
                Copiloto IA
              </h2>
              <p className="truncate text-[10.5px] text-ink-2">
                Conversas capturadas pelo Copiloto Comercial IA
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar Copiloto IA"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <Suspense fallback={null}>
              <CopilotoIaPanel embedded leadId={leadId} className="flex h-full flex-col" />
            </Suspense>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

interface AssistantButtonProps {
  label: string;
  description: string;
  open: boolean;
  onClick: () => void;
  testId: string;
  accent: 'cyan' | 'iris';
}

function AssistantButton({ label, description, open, onClick, testId, accent }: AssistantButtonProps) {
  const activeRing =
    accent === 'iris'
      ? 'border-[#8B7DFF]/60 shadow-[0_0_18px_rgba(139,125,255,0.35)]'
      : 'border-[#00D4FF]/60 shadow-[0_0_18px_rgba(0,212,255,0.35)]';
  const dot = accent === 'iris' ? 'bg-[#8B7DFF]' : 'bg-[#00D4FF]';
  const text = accent === 'iris' ? 'text-[#8B7DFF]' : 'text-[#0284c7] dark:text-[#00D4FF]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${open ? 'Fechar' : 'Abrir'} ${label}`}
      aria-expanded={open}
      title={`${open ? 'Fechar' : 'Abrir'} ${label} — ${description}`}
      data-testid={testId}
      className={`group relative grid h-12 w-12 place-items-center rounded-2xl border bg-surface/95 backdrop-blur-xl transition-all duration-300 hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
        open ? activeRing : 'border-line shadow-card hover:border-line-strong'
      }`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-[10px] ${text} bg-surface-2`}
        aria-hidden="true"
      >
        <AssistantGlyph accent={accent} />
      </span>
      {open && (
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${dot}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function AssistantGlyph({ accent }: { accent: 'cyan' | 'iris' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {accent === 'iris' ? (
        <>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <rect x="7" y="7" width="10" height="10" rx="3" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.8A8 8 0 1 1 21 12Z" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
        </>
      )}
    </svg>
  );
}
