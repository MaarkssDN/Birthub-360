import type React from 'react';
import { cn } from '../../lib/utils.js';

export interface AuroraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'small';
  glow?: boolean;
  children: React.ReactNode;
}

export function AuroraButton({
  size = 'default',
  glow = true,
  className,
  children,
  ...props
}: AuroraButtonProps) {
  const isSmall = size === 'small';

  return (
    <button
      type="button"
      className={cn(
        'group relative inline-flex items-center justify-center p-[3px] rounded-full isolate overflow-visible cursor-pointer transition-transform duration-200 active:scale-[0.98]',
        isSmall ? 'min-h-[40px]' : 'min-h-[54px]',
        className,
      )}
      {...props}
    >
      {/* Halo de luz conic giratório de fundo (Aurora Glow) */}
      {glow && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -inset-[6px] rounded-full z-[-1] animate-[spin_5.5s_linear_infinite] opacity-65',
              isSmall ? 'blur-[11px]' : 'blur-[16px]',
            )}
            style={{
              background:
                'conic-gradient(from 0deg, #ff7358, #f797c2, #00d4ff, #41e5c5, #ac82ff, #f7ae6b, #ff7358)',
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[1px] rounded-full z-[-1] animate-[spin_5.5s_linear_infinite] opacity-85 blur-[3px]"
            style={{
              background:
                'conic-gradient(from 0deg, #ff7358, #f797c2, #00d4ff, #41e5c5, #ac82ff, #f7ae6b, #ff7358)',
            }}
          />
        </>
      )}

      {/* Núcleo do Botão (Inner Pill) */}
      <span
        className={cn(
          'relative z-10 inline-flex items-center justify-center gap-2.5 rounded-full font-sans font-bold text-slate-100 bg-[#0b1117] group-hover:bg-[#131e29] border border-[#1a2634] transition-all duration-200 shadow-lg group-hover:-translate-y-0.5',
          isSmall ? 'min-h-[36px] px-5 text-xs' : 'min-h-[48px] px-7 text-sm sm:text-base',
        )}
      >
        {children}
      </span>
    </button>
  );
}
