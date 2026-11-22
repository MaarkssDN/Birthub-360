import { motion } from 'framer-motion';
import { Bot, Database, Globe, Link2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { BRAND } from '../../../config/brand.js';
import { useActivePlaybook } from '../../../hooks/useActivePlaybook.js';
import { useAssistantChat } from '../../../hooks/useAssistantChat.js';
import { usePlaybookMatrixData } from '../../../hooks/usePlaybookMatrixData.js';
import { SoundFX } from '../../../lib/soundEffects.js';

/**
 * Página cheia (`/app/chatbook`) do mesmo copiloto do drawer flutuante global
 * (`FloatingChatbook`/`CopilotTrigger`) — as duas telas consomem `useAssistantChat`, a única
 * fonte de estado/histórico/chamada do copiloto conversacional. Não são implementações
 * concorrentes: o drawer é o acesso rápido a partir de qualquer tela (⌘K → "Chamar copiloto de
 * IA"), esta página é a sessão dedicada para uma conversa mais longa. Ver TRUST_BLOCKERS_ROADMAP.md
 * P1-5.
 */
export function ChatbookHub() {
  const { playbook, info: playbookMeta } = useActivePlaybook();
  const { objections, qualifications } = usePlaybookMatrixData(playbook);
  const {
    messages,
    inputQuery,
    setInputQuery,
    isSearching,
    searchMode,
    setSearchMode,
    handleSendMessage,
    activeRecord,
  } = useAssistantChat(playbook, playbookMeta, playbook, objections, qualifications);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-4 md:p-8 flex flex-col items-center relative overflow-hidden transition-colors duration-1000">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-2/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 pb-8 relative z-10 flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/75 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-brand/25 shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden"
        >
          {/* Luz Especular de Fundo 2026 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-80" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand/15 blur-2xl" />

          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand flex items-center justify-center text-on-brand shadow-lg shadow-brand/25 relative overflow-hidden group">
              <Bot className="w-7 h-7" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5"
              title="Motor de IA Ativo"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-brand-ink dark:text-brand tracking-tight">
                {BRAND.shortName} Copilot
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-success/15 text-success-active dark:text-success font-bold border border-success/30 shrink-0 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Groq IA
              </span>
            </div>
            <p className="text-sm text-ink-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand shrink-0" /> Assistente comercial com base
              interna da marca; sem navegação web em tempo real.
            </p>
          </div>
        </motion.div>

        <div className="bg-surface/85 backdrop-blur-xl rounded-[2rem] border border-line/80 shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex-1 flex flex-col overflow-hidden min-h-[500px] relative">
          {/* Specular highlight border */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand/50 to-transparent" />

          <div className="p-3 border-b border-line bg-surface-2/80 flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-ink-2 font-medium">Fonte única do copiloto:</span>
              {activeRecord && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-brand-ink dark:text-brand bg-brand/10 border border-brand/20 rounded-full px-2.5 py-1">
                  <Link2 className="w-3 h-3" /> Contexto: {activeRecord.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-line">
              <button
                type="button"
                onClick={() => {
                  SoundFX.play('navigate');
                  setSearchMode('general');
                }}
                aria-pressed={searchMode === 'general'}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  searchMode === 'general'
                    ? 'bg-brand-active text-on-brand shadow-sm ring-1 ring-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> IA conversacional
              </button>
              <button
                type="button"
                onClick={() => {
                  SoundFX.play('navigate');
                  setSearchMode('internal');
                }}
                aria-pressed={searchMode === 'internal'}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  searchMode === 'internal'
                    ? 'bg-brand-active text-on-brand shadow-sm ring-1 ring-brand/30'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> Base {playbookMeta.label}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Inicie a conversa comercial inteligente
                  </h3>
                  <p className="text-xs text-ink-2 mt-1 max-w-sm mx-auto">
                    Faça perguntas sobre contorno de objeções, roteiros de abordagem ou estratégia
                    de produto:
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2">
                  {[
                    'Como contornar objeção de preço?',
                    'Qual o principal diferencial competitivo?',
                    'Qual o ICP prioritário da solução?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        SoundFX.play('click');
                        setInputQuery(suggestion);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-2 border border-line text-ink-2 hover:text-brand hover:border-brand/40 transition-all active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm space-y-2 leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-brand-active text-on-brand rounded-br-none font-medium shadow-brand/10'
                      : 'bg-surface-2 text-ink border border-line rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 pb-1 border-b border-current/10">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.sender === 'user' ? 'Você' : `${BRAND.shortName} Copilot`}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-brand-ink dark:text-brand bg-surface-2 p-3 rounded-2xl border border-line w-fit animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Consultando o motor Groq...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              SoundFX.play('focus');
              handleSendMessage(e);
            }}
            className="p-4 border-t border-line bg-surface/80 backdrop-blur-md flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                searchMode === 'general'
                  ? 'Pergunte sobre a rota ou registro aberto...'
                  : `Consulte a matriz comercial de ${playbookMeta.label}...`
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-2 text-ink text-sm border border-line focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40 transition-all"
            />
            <button
              type="submit"
              disabled={isSearching || !inputQuery.trim()}
              aria-label="Enviar mensagem"
              className="p-3 rounded-xl bg-brand-active text-on-brand font-bold disabled:opacity-50 hover:bg-brand-2 transition-all active:scale-95 shadow-md shadow-brand/20 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
