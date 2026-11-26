import {
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { B360UnifiedPipelineFlow } from '../CinematicFX.js';
import { ADAPTIVE_INTEGRATIONS } from './data.js';

interface AiEcosystemSectionProps {
  onOpenModal: (title: string, desc: string, pillarNum?: string) => void;
}

/** Seção IA — copiloto comercial e supervisor. */
export function AiSection({ onOpenModal }: AiEcosystemSectionProps) {
  return (
    <section className="b360-section" id="ia">
      <div className="b360-ai-grid">
        <div>
          <div className="b360-eyebrow">COPILOTO COMERCIAL & SUPERVISOR</div>
          <h2 className="text-3xl font-extrabold landing-title-gradient mb-4">
            Inteligência que compreende seu pipeline.
          </h2>
          <p className="text-slate-400 text-base mb-6">
            O copiloto analisa o estágio de cada negociação, o histórico das interações e as
            objeções recorrentes para apoiar sua equipe durante a negociação com supervisão contínua.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-900 b360-dark-card dark:bg-[#0B1A2E]/80">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                <h3 className="text-sm font-bold text-[#00D4FF]">Diagnóstico de entraves</h3>
              </div>
              <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                Identifique negócios estagnados no funil e receba o contexto exato do motivo de
                bloqueio.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-pink-500/20 bg-slate-900 b360-dark-card dark:bg-[#0B1A2E]/80">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-[#FF2D9B]" />
                <h3 className="text-sm font-bold text-[#FF2D9B]">Próxima melhor ação (NBA)</h3>
              </div>
              <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                Receba recomendações táticas preditivas para avançar negociações e contornar
                objeções.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-amber-500/20 bg-slate-900 b360-dark-card dark:bg-[#0B1A2E]/80">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-[#FFC107]" />
                <h3 className="text-sm font-bold text-[#FFC107]">Contexto histórico</h3>
              </div>
              <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                Leitura instantânea de chamadas gravadas, e-mails trocados e propostas enviadas.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-indigo-500/20 bg-slate-900 b360-dark-card dark:bg-[#0B1A2E]/80">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-4 h-4 text-[#8B7DFF]" />
                <h3 className="text-sm font-bold text-[#8B7DFF]">Supervisor On-line</h3>
              </div>
              <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                Orquestração autônoma de missões operacionais e alocação dinâmica de agentes.
              </p>
            </div>
          </div>
        </div>

        <div className="b360-copilot-card">
          <div className="b360-copilot-top">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <span>COPILOTO ON-LINE</span>
            </div>
            <small>Simulação Contextual</small>
          </div>
          <div className="b360-copilot-deal-info">
            <span className="b360-copilot-deal-tag">OPORTUNIDADE #1042</span>
            <h3>Oportunidade pede atenção.</h3>
            <p className="b360-copilot-deal-desc">
              Proposta comercial no valor de <strong>R$ 145.000</strong> enviada há 4 dias sem
              retorno registrado após reunião técnica.
            </p>
          </div>
          <div className="b360-suggestion-box">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D4FF] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Próxima Ação Sugerida (NBA):</span>
            </div>
            <p>
              Retomar contato com o CFO destacando o caso de ROI simulado (payback estimado em 45
              dias) e propor reunião executiva de implantação com modelo parcelado.
            </p>
          </div>
          <div className="b360-copilot-actions">
            <button
              type="button"
              onClick={() =>
                onOpenModal('Copiloto de IA', 'Simulação do Copiloto de IA em negociação real.')
              }
              className="b360-copilot-apply-btn"
            >
              <span>Aplicar recomendação na oportunidade</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Ecossistema / Integrações — conectividade total. */
export function IntegrationsSection() {
  return (
    <section className="b360-section" id="ecossistema">
      <div className="b360-sectionhead">
        <div className="b360-eyebrow">CONECTIVIDADE TOTAL</div>
        <h2>Conectado ao seu ecossistema.</h2>
        <p>
          Uma operação aberta e compatível com as ferramentas comerciais e produtividade que sua
          empresa já utiliza.
        </p>
      </div>

      {/* Visualização de Pipeline Unificado — Fluxo de Pacotes Luminosos com Desvio Fluido */}
      <B360UnifiedPipelineFlow />

      <div className="b360-integrations">
        {ADAPTIVE_INTEGRATIONS.map((integ) => (
          <article key={integ.name} className="b360-integration-card">
            <div className="b360-integration-header">
              <div className="b360-integration-title">
                <img src={integ.icon} alt={`${integ.name} logo`} />
                <h3>{integ.name}</h3>
              </div>
              <span className={`b360-status-pill ${integ.status}`}>
                {integ.status === 'active' && <span className="b360-status-dot green" />}
                {integ.status === 'in_dev' && <span className="b360-status-dot amber" />}
                {integ.status === 'planned' && <span className="b360-status-dot slate" />}
                <span>{integ.statusLabel}</span>
              </span>
            </div>
            <p>{integ.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Provas sociais — selos de segurança e certificações. */
export function ProofSection() {
  return (
    <section className="b360-section b360-proof-stage" id="provas-sociais">
      <div className="b360-sectionhead">
        <div className="b360-eyebrow">CONFIANÇA E SEGURANÇA</div>
        <h2>Garantias reais de plataforma, não promessas de marketing.</h2>
        <p>
          Isolamento multi-tenant, criptografia de dados e conformidade LGPD fazem parte da
          arquitetura do Birth Hub 360°.
        </p>
      </div>

      {/* Selos de Segurança e Certificações */}
      <div className="b360-trust-seals" aria-label="Garantias de segurança e conformidade">
        <div className="b360-seal-item">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Criptografia AES-256 Ponta a Ponta</span>
        </div>
        <div className="b360-seal-item">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>Isolamento Multi-Tenant via Postgres RLS</span>
        </div>
        <div className="b360-seal-item">
          <CheckCircle2 className="w-5 h-5 text-purple-400" />
          <span>Conformidade LGPD por design (Audit Ledger)</span>
        </div>
        <div className="b360-seal-item">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Controles alinhados a ISO 27001 (Ready)</span>
        </div>
      </div>
    </section>
  );
}
