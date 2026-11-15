import { brandIconBase, type BrandIconProps } from './brandIconBase.js';

/**
 * Ícones estendidos da biblioteca (redes sociais e utilitários).
 * Núcleo em BrandIcons.tsx — ambos compartilham brandIconBase.tsx.
 */

export function IconFacebook(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M14.5 21v-7.5H17l.5-3.3h-3V8.1c0-1 .3-1.7 1.7-1.7H17.7V3.5A22 22 0 0 0 15.5 3.4c-2.4 0-4 1.5-4 4.1v2.7H8.9v3.3h2.6V21"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconStar(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M12 3.7l2.5 5.2 5.6.8-4 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4-4 5.6-.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTag(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M11.6 3.5H6a1 1 0 0 0-1 1v5.6a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l5.6-5.6a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3Z"
        strokeLinejoin="round"
      />
      <path d="M8.2 8.2h0" strokeWidth={2.4} />
    </svg>
  );
}

export function IconWrench(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M14.5 3.8a4.5 4.5 0 0 0-5.7 5.3L4 13.9v3.2h3.2l4.8-4.8a4.5 4.5 0 0 0 5.3-5.7l-3.1 3.1-2.3-.6-.6-2.3Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClipboard(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <rect x="8.5" y="3" width="7" height="3" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}

export function IconChevronDown(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

export function IconChevronUp(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M6 14.5 12 8.5 18 14.5" />
    </svg>
  );
}

export function IconSend(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M20 4 10.5 13.5M20 4 13.5 20l-3-6.5L4 10.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSave(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M5 4.5h11l3 3V19a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5Z"
        strokeLinejoin="round"
      />
      <path d="M8 4.5V9h7V4.5M8 19.5v-6h8v6" />
    </svg>
  );
}

export function IconInfo(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8h0" strokeWidth={2.6} />
    </svg>
  );
}

export function IconMessage(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M4 5.5h16v10.5a1 1 0 0 1-1 1H9l-4 3.5v-3.5H5a1 1 0 0 1-1-1Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCalendar(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
    </svg>
  );
}

export function IconChat(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M4 5.5h16v10.5a1 1 0 0 1-1 1H9l-4 3.5v-3.5H5a1 1 0 0 1-1-1Z"
        strokeLinejoin="round"
      />
      <path d="M8.3 10.3h0M12 10.3h0M15.7 10.3h0" strokeWidth={2.6} />
    </svg>
  );
}

export function IconDatabase(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <ellipse cx="12" cy="5.8" rx="7.5" ry="2.8" />
      <path d="M4.5 5.8V12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.8" />
      <path d="M4.5 12v6.2c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V12" />
    </svg>
  );
}

export function IconCpu(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9 3.3V7M15 3.3V7M9 17v3.7M15 17v3.7M3.3 9H7M3.3 15H7M17 9h3.7M17 15h3.7" />
    </svg>
  );
}

export function IconBot(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <rect x="4.5" y="9" width="15" height="11" rx="3" />
      <path d="M12 5.5V9" />
      <circle cx="12" cy="4.3" r="1.2" fill="currentColor" stroke="none" />
      <path d="M8.5 14v1M15.5 14v1" strokeWidth={2.2} />
      <path d="M9.5 17.3h5" />
      <path d="M2.5 12.5v3M21.5 12.5v3" />
    </svg>
  );
}

export function IconServer(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <rect x="3.5" y="4.5" width="17" height="6" rx="1.5" />
      <rect x="3.5" y="13.5" width="17" height="6" rx="1.5" />
      <path d="M7 7.5h0M7 16.5h0" strokeWidth={2.6} />
    </svg>
  );
}

export function IconShieldCheck(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M12 3.3 19 6v6c0 4.4-3 7.8-7 8.7-4-.9-7-4.3-7-8.7V6Z" strokeLinejoin="round" />
      <path d="M9 12.2l2.1 2.1L15.3 10" />
    </svg>
  );
}

export function IconWarning(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path
        d="M10.6 3.9 2.9 18a1.4 1.4 0 0 0 1.2 2.1h15.8a1.4 1.4 0 0 0 1.2-2.1L13.4 3.9a1.4 1.4 0 0 0-2.8 0Z"
        strokeLinejoin="round"
      />
      <path d="M12 9.3v4.4" />
      <path d="M12 16.8h0" strokeWidth={2.6} />
    </svg>
  );
}

export function IconLandmark(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M3.5 9.5 12 4l8.5 5.5" strokeLinejoin="round" />
      <path d="M4.5 9.5h15V20h-15Z" strokeLinejoin="round" />
      <path d="M8 12.5V17M12 12.5V17M16 12.5V17" />
    </svg>
  );
}

export function IconUserPlus(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <circle cx="9.5" cy="8.2" r="3.2" />
      <path d="M3.5 19.4c.7-3.3 2.9-5 6-5s5.3 1.7 6 5" />
      <path d="M18 8.5v5M15.5 11h5" />
    </svg>
  );
}

export function IconSliders(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M4 6.5h9M17 6.5h3M4 12h3M9 17.5h11M7 17.5h0" />
      <circle cx="14" cy="6.5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="7" cy="17.5" r="2.2" />
    </svg>
  );
}

export function IconDollar(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5v11" />
      <path d="M15 9.3c0-1.1-1.3-1.8-3-1.8s-3 .8-3 2 1.2 1.6 3 2 3 .9 3 2-1.3 2-3 2-3-.7-3-1.8" />
    </svg>
  );
}

export function IconBook(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function IconX(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconAlertTriangle(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconHelp(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconFilter(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconZap(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconCode(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function IconLayers(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function IconRefresh(props: BrandIconProps) {
  return (
    <svg {...brandIconBase(props)}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
