import type React from 'react';
import { HeroOrbit360 } from './HeroOrbit360';

export interface HeroCommandCenterProps {
  statusMessage: string;
  onReplaySequence: () => void;
  onOpenCommandSandbox?: () => void;
}

export const HeroCommandCenter: React.FC<HeroCommandCenterProps> = ({
  statusMessage,
  onReplaySequence,
  onOpenCommandSandbox,
}) => {
  return (
    <div className="bh-n1-stage">
      <HeroOrbit360 />

      <figure
        className="bh-n1-plate b360-hero-console"
        aria-label="Demonstração ilustrativa do centro de comando"
      >
        <div className="bh-n1-plate-bar">
          <div className="bh-n1-plate-title-group">
            <img
              className="bh-n1-plate-icon"
              src="/brand/birthhub360-icone.svg"
              alt=""
              width={18}
              height={18}
            />
            <span className="bh-n1-plate-title">Centro de comando</span>
            <span className="bh-n1-plate-module" title="Módulo P01">
              <span>P01</span> · <span>HUB</span> <span>COMERCIAL</span>
            </span>
          </div>
          <span className="bh-n1-sim-badge" title="Interface ilustrativa com dados simulados">
            <span className="bh-n1-sim-dot" aria-hidden="true" />
            Simulação
          </span>
        </div>

        {/* Band 1: Pipeline comercial */}
        <div className="bh-n1-band bh-n1-band-pipeline">
          <div className="bh-n1-band-head">
            <span className="bh-n1-band-title">Pipeline comercial</span>
            <span className="bh-n1-band-sub">5 etapas · etapa 3 ativa</span>
          </div>
          <ol className="bh-n1-stepper" aria-label="Etapas do pipeline comercial">
            <li className="bh-n1-step is-done">
              <span className="bh-n1-step-node" aria-hidden="true" />
              <span className="bh-n1-step-name">Prospecção</span>
            </li>
            <li className="bh-n1-step is-done">
              <span className="bh-n1-step-node" aria-hidden="true" />
              <span className="bh-n1-step-name">Qualificação</span>
            </li>
            <li className="bh-n1-step is-active" aria-current="step">
              <span className="bh-n1-step-node" aria-hidden="true" />
              <span className="bh-n1-step-name">Proposta</span>
            </li>
            <li className="bh-n1-step">
              <span className="bh-n1-step-node" aria-hidden="true" />
              <span className="bh-n1-step-name">Negociação</span>
            </li>
            <li className="bh-n1-step">
              <span className="bh-n1-step-node" aria-hidden="true" />
              <span className="bh-n1-step-name">Fechamento</span>
            </li>
          </ol>
        </div>

        {/* Band 2: Oportunidade ilustrativa */}
        <div className="bh-n1-band bh-n1-band-deal">
          <div className="bh-n1-deal-header">
            <div className="bh-n1-deal-id-block">
              <span className="bh-n1-deal-kicker">OPORTUNIDADE ILUSTRATIVA</span>
              <strong className="bh-n1-deal-name">Oportunidade #1042</strong>
            </div>
            <span className="bh-n1-deal-stage">ETAPA ATUAL · PROPOSTA</span>
          </div>
          <p className="bh-n1-deal-context">
            Conta corporativa em avaliação de proposta comercial com histórico de interações e
            materiais enviados.
          </p>
          <ul className="bh-n1-deal-signals" aria-label="Sinais da oportunidade">
            <li className="bh-n1-signal is-done">
              <span className="bh-n1-signal-dot" aria-hidden="true" />
              Reunião técnica realizada
            </li>
            <li className="bh-n1-signal is-done">
              <span className="bh-n1-signal-dot" aria-hidden="true" />
              Proposta enviada
            </li>
            <li className="bh-n1-signal is-pending">
              <span className="bh-n1-signal-dot" aria-hidden="true" />
              Retorno pendente
            </li>
          </ul>
        </div>

        {/* Band 3: Copiloto IA */}
        <div className="bh-n1-band bh-n1-band-copilot">
          <div className="bh-n1-copilot-head">
            <span className="bh-n1-copilot-tag">
              <span className="bh-n1-copilot-spark" aria-hidden="true" />
              Copiloto IA
            </span>
            <span className="bh-n1-copilot-meta">Próxima ação · P06 · Inteligência</span>
          </div>
          <p className="bh-n1-copilot-body">
            Retomar contato com o decisor técnico e revisar o escopo enviado antes da próxima
            conversa.
          </p>
          <div className="bh-n1-copilot-foot">
            <span className="bh-n1-copilot-note">
              Recomendação ilustrativa · decisão do vendedor
            </span>
          </div>
        </div>

        <div className="bh-n1-plate-controls">
          <button type="button" className="bh-n1-replay-btn" onClick={onReplaySequence}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Reproduzir sequência</span>
          </button>
          <span className="bh-n1-scene-status" role="status" aria-live="polite">
            {statusMessage}
          </span>
        </div>

        <figcaption className="bh-n1-plate-caption">
          <span>Interface ilustrativa · dados simulados</span>
          <span className="bh-n1-caption-actions">
            <span>11 módulos integrados</span>
            {onOpenCommandSandbox && (
              <>
                <span aria-hidden="true">·</span>
                <button type="button" className="bh-n1-sandbox-link" onClick={onOpenCommandSandbox}>
                  Abrir Command Center
                </button>
              </>
            )}
          </span>
        </figcaption>
      </figure>
    </div>
  );
};
