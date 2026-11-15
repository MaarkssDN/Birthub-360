import type React from 'react';

interface BirthubLogoProps {
  variant?: 'full' | 'symbol' | 'with-subtitle';
  theme?: 'dark' | 'light' | 'orange';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BirthubLogo: React.FC<BirthubLogoProps> = ({
  variant = 'with-subtitle',
  theme = 'dark',
  size = 'md',
  className = '',
}) => {
  // Height & scale configuration
  const sizeMap = {
    sm: { symbolH: 22, textH: 'text-lg', subH: 'text-[9px]' },
    md: { symbolH: 30, textH: 'text-2xl', subH: 'text-[11px]' },
    lg: { symbolH: 40, textH: 'text-3xl', subH: 'text-xs' },
    xl: { symbolH: 52, textH: 'text-4xl', subH: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // Colors based on Birth Hub 360 Brand Manual
  // Gold: #D4AF37
  // Navy: #0B132B
  const orangeFill = '#D4AF37';
  const textFill = theme === 'light' ? '#0B132B' : '#FFFFFF';
  const subtitleColor = theme === 'light' ? '#475569' : '#94A3B8';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Birth Hub 360 Symbol */}
      <svg
        height={currentSize.symbolH}
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        {/* Circle */}
        <circle cx="60" cy="60" r="50" fill={orangeFill} />
        {/* Letter B */}
        <text
          x="60"
          y="70"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="36"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          B
        </text>
      </svg>

      {variant !== 'symbol' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${currentSize.textH}`}
              style={{ color: textFill, fontFamily: 'Montserrat, sans-serif' }}
            >
              Birth Hub 360
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[var(--brand)]/20 text-[var(--brand)] border border-[var(--brand)]/30">
              AI
            </span>
          </div>

          {variant === 'with-subtitle' && (
            <span
              className={`font-medium tracking-wide mt-0.5 ${currentSize.subH}`}
              style={{ color: subtitleColor }}
            >
              Intelligent Business Command Center
            </span>
          )}
        </div>
      )}
    </div>
  );
};
