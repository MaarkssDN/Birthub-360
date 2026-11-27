import { ArrowRight } from 'lucide-react';
import type React from 'react';
import { ADAPTIVE_PILLARS, renderPillarIcon, renderPillarVisual } from './data.js';

interface ModulesSectionProps {
  onOpenModal: (title: string, desc: string, pillarNum?: string) => void;
}

/** 11 Módulos — Bento Cinematográfico Refinado (8 Pilares + 3 Complementares) */
export function ModulesSection({ onOpenModal }: ModulesSectionProps) {
  return (
    <section id="destaques" className="b360-pillars-stage">
      <div className="b360-stage-lights" aria-hidden="true" />
      <div className="b360-pillars-head">
        <div>
          <div className="b360-eyebrow">ARQUITETURA DE RECEITA</div>
          <h2>
            Onze módulos.
            <br />
            <span className="b360-grad-a">Uma operação conectada.</span>
          </h2>
          <div className="b360-demo-disclaimer-banner">
            Cenário demonstrativo · Indicadores ilustrativos de simulação
          </div>
        </div>
        <p>
          Oito pilares centrais e três módulos complementares trabalham em conjunto em uma esteira
          integrada — do pipeline à governança, do campo ao social selling.
        </p>
      </div>

      <div className="b360-feature-grid b360-bento-grid">
        {ADAPTIVE_PILLARS.map((pillar) => (
          <button
            key={pillar.num}
            type="button"
            data-pillar={pillar.num}
            className={`b360-feature-card ${pillar.bentoClass} ${pillar.colorClass}`}
            onClick={() => onOpenModal(pillar.modalTitle, pillar.modalDesc, pillar.num)}
            aria-label={`Inspecionar capacidades: ${pillar.title}`}
          >
            {/* Imagem de Fundo Editorial com Leve Ampliação no Hover */}
            <div
              className="b360-card-bg"
              style={
                pillar.bg
                  ? { backgroundImage: `url('${pillar.bg}')` }
                  : {
                      background: 'linear-gradient(140deg, var(--a, #00D4FF), var(--b, #3B82F6))',
                    }
              }
              aria-hidden="true"
            />

            {/* Tonalização Cromática Editorial */}
            <div className="b360-card-tint" aria-hidden="true" />

            {/* Gradiente Scrim de Proteção para Legibilidade Editorial */}
            <div className="b360-card-scrim" aria-hidden="true" />

            {/* Glow Suave Oficial com a Cor do Pilar */}
            <div
              className="b360-card-glow"
              style={{ '--card-accent': pillar.accentColor } as React.CSSProperties}
              aria-hidden="true"
            />

            {/* Contorno Magnético Glassmorphism Reativo */}
            <div className="b360-card-magnetic-rim" aria-hidden="true" />

            {/* Conteúdo do Card em Camada Superior */}
            <div className="b360-card-content">
              <div className="b360-card-header">
                <span className="b360-pillar-badge">{pillar.num}</span>
                <span className="b360-pillar-tag">{pillar.tag}</span>
              </div>

              {renderPillarVisual(pillar.num)}

              <div className="b360-card-bottom">
                {['01', '04', '06', '08', '09', '10', '11'].includes(pillar.num) && (
                  <div className="b360-pillar-icon">{renderPillarIcon(pillar.num)}</div>
                )}
                <h3>
                  {pillar.num}. {pillar.title}
                </h3>
                <p>{pillar.desc}</p>
                <div className="b360-card-foot">
                  <span className="b360-card-kpi">
                    <small>{pillar.kpiPrefix}</small>
                    {pillar.kpi}
                  </span>
                  <span className="b360-card-action">
                    <span>Inspecionar capacidades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
