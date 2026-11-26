import { ArrowRight, TrendingUp } from 'lucide-react';
import { B360DecryptBlock } from '../CinematicFX.js';

interface ProblemSectionProps {
  isProblemIntersecting: boolean;
}

/** Problema / Contexto — eliminação de silos e decisões tardias. */
export function ProblemSection({ isProblemIntersecting }: ProblemSectionProps) {
  return (
    <section className="b360-section" id="problema">
      <div className="b360-sectionhead">
        <div className="b360-eyebrow">ELIMINAÇÃO DE SILOS</div>
        <h2>Sua equipe precisa de contexto para avançar.</h2>
        <p>
          Ferramentas isoladas fragmentam o histórico e escondem o que realmente trava o pipeline.
        </p>
      </div>

      <div className="b360-problem-grid">
        <article className="b360-problem-card">
          <div className="b360-problem-header">
            <span className="b360-problem-tag">SILOS DE INFORMAÇÃO</span>
            <span className="b360-problem-icon">❌</span>
          </div>
          <B360DecryptBlock
            text="Chega de silos operacionais"
            active={isProblemIntersecting}
            delayMs={0}
          />
          <div className="b360-problem-body">
            <div className="b360-problem-row">
              <span className="b360-label-flag red">Problema</span>
              <p>
                CRM, telefonia, e-mails e WhatsApp desconectados forçam os vendedores a caçar
                informações e retrabalhar contatos.
              </p>
            </div>
            <div className="b360-problem-row">
              <span className="b360-label-flag cyan">Solução Birth Hub</span>
              <p>
                Linha do tempo 360° unificada onde cada negociação preserva todo o histórico de
                interações e passagens de bastão.
              </p>
            </div>
          </div>
          <div className="b360-problem-kpi">
            <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
            <span>
              <b>Benefício esperado:</b> menos retrabalho e preparação comercial contextualizada.
            </span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar impacto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>

        <article className="b360-problem-card">
          <div className="b360-problem-header">
            <span className="b360-problem-tag">DECISÕES TARDIAS</span>
            <span className="b360-problem-icon">❌</span>
          </div>
          <B360DecryptBlock
            text="Decisões no tempo certo"
            active={isProblemIntersecting}
            delayMs={180}
          />
          <div className="b360-problem-body">
            <div className="b360-problem-row">
              <span className="b360-label-flag red">Problema</span>
              <p>
                Planilhas estáticas e fechamentos mensais revelam estagnações quando já não há tempo
                hábil para recuperar a meta.
              </p>
            </div>
            <div className="b360-problem-row">
              <span className="b360-label-flag cyan">Solução Birth Hub</span>
              <p>
                Telemetria operacional com alertas preditivos de gargalos e desvios de velocidade de
                ciclo em D+0.
              </p>
            </div>
          </div>
          <div className="b360-problem-kpi">
            <TrendingUp className="w-4 h-4 text-[#FF2D9B]" />
            <span>
              <b>Benefício esperado:</b> mais visibilidade de gargalos para priorizar ações.
            </span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar impacto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>

        <article className="b360-problem-card">
          <div className="b360-problem-header">
            <span className="b360-problem-tag">OPORTUNIDADES NO ESCURO</span>
            <span className="b360-problem-icon">❌</span>
          </div>
          <B360DecryptBlock
            text="Nenhuma oportunidade no escuro"
            active={isProblemIntersecting}
            delayMs={360}
          />
          <div className="b360-problem-body">
            <div className="b360-problem-row">
              <span className="b360-label-flag red">Problema</span>
              <p>
                Falta de rigor no cumprimento de SLAs faz negócios quentes esfriarem sem
                acompanhamento ou ação definida.
              </p>
            </div>
            <div className="b360-problem-row">
              <span className="b360-label-flag cyan">Solução Birth Hub</span>
              <p>
                Orquestração automática de follow-ups com regras de SLA configuráveis e
                recomendação da Próxima Melhor Ação (NBA).
              </p>
            </div>
          </div>
          <div className="b360-problem-kpi">
            <TrendingUp className="w-4 h-4 text-[#FFC107]" />
            <span>
              <b>Benefício esperado:</b> acompanhamento de próximos passos conforme regras e SLAs.
            </span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar impacto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>
      </div>
    </section>
  );
}
