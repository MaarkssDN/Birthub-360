import type { SVGProps } from 'react';

/**
 * Base compartilhada da biblioteca de ícones própria da plataforma.
 * Grid 24x24, traço 1.75, cantos arredondados — geometria circular contínua,
 * ecoando o anel e a órbita do emblema Birth Hub 360.
 * Uso: <IconHome className="w-5 h-5" />
 */
export type BrandIconProps = SVGProps<SVGSVGElement>;

export function brandIconBase(props: BrandIconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}
