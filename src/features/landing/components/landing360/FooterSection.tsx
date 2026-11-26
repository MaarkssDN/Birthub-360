import { Link } from 'react-router-dom';
import { type HeroVariant } from '@/lib/analytics/conversionTelemetry';
import { B360FloatingNodes } from '../CinematicFX.js';
import { BH360LogoMark } from './data.js';

interface Landing360FooterProps {
  abVariant: HeroVariant;
  showStickyBar: boolean;
  onGoToLogin: () => void;
  onSwitchAbVariant: (variant: HeroVariant) => void;
  onOpenModal: (title: string, desc: string, pillarNum?: string) => void;
}

/** Sticky Action Bar + Footer Institucional + Dock de Auditoria A/B. */
export function Landing360Footer({
  abVariant,
  showStickyBar,
  onGoToLogin,
  onSwitchAbVariant,
  onOpenModal,
}: Landing360FooterProps) {
  return (
    <>
      {/* Sticky Action Bar (CTA Visível ao Rolar) */}
      {showStickyBar && (
        <aside className="b360-sticky-bar" aria-label="Ações rápidas de conversão">
          <div className="hidden sm:flex items-center gap-2">
            <BH360LogoMark size={20} />
            <span className="text-xs font-bold text-slate-200">
              Birth Hub <strong className="text-[#FF2D9B]">360°</strong>
            </span>
          </div>
          <span className="hidden md:inline text-xs text-slate-300">
            {abVariant === 'B'
              ? 'Multiplique as vendas do seu time'
              : 'Revenue Intelligence para o time comercial'}
          </span>
          <a href="#demonstracao" className="b360-sticky-cta-btn">
            Agendar Demonstração Gratuita →
          </a>
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs font-mono text-slate-300 hover:text-[#00D4FF] underline"
          >
            Entrar
          </button>
        </aside>
      )}

      {/* Footer Institucional */}
      <footer className="b360-footer">
        <B360FloatingNodes variant="footer" />
        <div className="b360-shell">
          <div className="b360-footer-grid">
            <div className="b360-footer-col brand">
              <div className="flex items-center gap-2.5 mb-3">
                <BH360LogoMark size={32} />
                <span className="font-display font-extrabold text-lg b360-footer-wordmark">
                  Birth Hub <strong className="text-[#FF2D9B]">360°</strong>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm">
                O sistema operacional definitivo para operações de receita enterprise unificando
                CRM, telemetria e inteligência artificial.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-slate-800/60 border border-slate-700/60 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                <span>Isolamento Multi-Tenant por RLS</span>
              </div>
            </div>

            <div className="b360-footer-col">
              <h4>Plataforma</h4>
              <ul>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenModal('01. Hub Comercial', 'Pipeline 360° e contas.', '01')
                    }
                  >
                    01. Pipeline & Contas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenModal('02. Inteligência de Mercado', 'Enriquecimento B2B.', '02')
                    }
                  >
                    02. Inteligência de Mercado
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenModal('03. Orquestração de Vendas', 'Cadência e SLAs.', '03')
                    }
                  >
                    03. Orquestração de Vendas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenModal('06. Inteligência Artificial', 'Copiloto de negociações.', '06')
                    }
                  >
                    06. Copiloto de IA
                  </button>
                </li>
              </ul>
            </div>

            <div className="b360-footer-col">
              <h4>Conectividade</h4>
              <ul>
                <li>
                  <span>Bitrix24 (API Oficial)</span>
                </li>
                <li>
                  <span>WhatsApp Business API</span>
                </li>
                <li>
                  <span>VoiceHub Telefonia em Nuvem</span>
                </li>
                <li>
                  <span>Webhooks & Open REST API</span>
                </li>
              </ul>
            </div>

            <div className="b360-footer-col">
              <h4>Governança</h4>
              <ul>
                <li>
                  <Link to="/privacy" className="hover:text-[#00D4FF] transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <span>Direitos do Titular (LGPD Art. 18)</span>
                </li>
                <li>
                  <span>Sessão Segura HttpOnly</span>
                </li>
                <li>
                  <span>Auditoria de Logs & RBAC</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Dock de Controle e Auditoria de Teste A/B (bloco duplicado preservado do original) */}
          <div className="flex items-center justify-center py-3 border-t border-slate-800/60 mb-4">
            <div
              className="b360-ab-pill-dock"
              role="group"
              aria-label="Controle de Experimento A/B"
            >
              <span className="font-mono text-[10px]">🧪 Experimento A/B:</span>
              <button
                type="button"
                className={`b360-ab-toggle-btn ${abVariant === 'A' ? 'active' : ''}`}
                onClick={() => onSwitchAbVariant('A')}
                title="Variante A: Foco em Aceleração de Pipeline e Produtividade"
              >
                Variante A (Aceleração)
              </button>
              <button
                type="button"
                className={`b360-ab-toggle-btn ${abVariant === 'B' ? 'active' : ''}`}
                onClick={() => onSwitchAbVariant('B')}
                title="Variante B: Foco em Multiplicação de Receita e Conversão"
              >
                Variante B (Multiplicação)
              </button>
            </div>
          </div>

          {/* Dock de Controle e Auditoria de Teste A/B */}
          <div className="flex items-center justify-center py-3 border-t border-slate-800/60 mb-4">
            <div
              className="b360-ab-pill-dock"
              role="group"
              aria-label="Controle de Experimento A/B"
            >
              <span className="font-mono text-[10px]">🧪 Experimento A/B:</span>
              <button
                type="button"
                className={`b360-ab-toggle-btn ${abVariant === 'A' ? 'active' : ''}`}
                onClick={() => onSwitchAbVariant('A')}
                title="Variante A: Foco em Aceleração de Pipeline e Produtividade"
              >
                Variante A (Aceleração)
              </button>
              <button
                type="button"
                className={`b360-ab-toggle-btn ${abVariant === 'B' ? 'active' : ''}`}
                onClick={() => onSwitchAbVariant('B')}
                title="Variante B: Foco em Multiplicação de Receita e Conversão"
              >
                Variante B (Multiplicação)
              </button>
            </div>
          </div>

          <div className="b360-footer-bottom">
            <span>© 2026 Birth Hub 360° · Todos os direitos reservados.</span>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Arquitetura Enterprise</span>
              </span>
              <span>·</span>
              <span>Versão 2.4 Enterprise</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
