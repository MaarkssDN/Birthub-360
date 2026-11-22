import type React from 'react';

export const HeroOrbit360: React.FC = () => {
  return (
    <>
      <div className="bh-n1-orbit-wrap" aria-hidden="true">
        <svg className="bh-n1-orbit-svg" viewBox="-220 -220 440 440" fill="none">
          <defs>
            <linearGradient id="bh-n1-rg" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="34%" stopColor="#8B7DFF" />
              <stop offset="68%" stopColor="#FF2D9B" />
              <stop offset="100%" stopColor="#FFC107" />
            </linearGradient>
          </defs>
          <g className="bh-n1-o-spin">
            <g className="bh-n1-o-ticks">
              <circle
                r="212"
                fill="none"
                stroke="var(--bh-tick)"
                strokeWidth="9"
                strokeDasharray="1 8.25"
              />
              <circle
                r="212"
                fill="none"
                stroke="var(--bh-tick)"
                strokeWidth="18"
                strokeDasharray="1.4 109.6"
              />
            </g>
          </g>
          <circle className="bh-n1-o-inner" r="162" />
          <circle className="bh-n1-o-arc" r="188" pathLength="1" transform="rotate(-205)" />
          <g className="bh-n1-o-dotg">
            <circle className="bh-n1-o-dot" r="6.5" cx="-170.4" cy="-79.4" />
            <circle className="bh-n1-o-node-cyan" r="4.5" cx="-64.3" cy="-176.7" />
            <circle className="bh-n1-o-node-gold" r="4.5" cx="162.8" cy="-94.0" />
          </g>
          <text className="bh-n1-o-lbl" x="0" y="-134" textAnchor="middle">
            360°
          </text>
        </svg>
      </div>

      <div className="bh-n1-orbit-bridge" aria-hidden="true">
        <span className="bh-n1-orbit-tag">VISÃO INTEGRADA · 360°</span>
        <span className="bh-n1-orbit-pillars">DADOS · IA · EXECUÇÃO</span>
      </div>
    </>
  );
};
