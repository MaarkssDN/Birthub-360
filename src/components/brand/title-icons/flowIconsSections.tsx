import type { TitleIconProps } from './types.js';

// 7. IA Section: Quantum Neural Spark
export function AiSectionIcon({
  size = 26,
  color = '#FF2D9B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M12 7V12L15 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 3L19 6L22 7L19 8L18 11L17 8L14 7L17 6L18 3Z" fill={color} />
    </svg>
  );
}

// 8. Automação Section: Multi-Cloud Sync Loop
export function AutomationSectionIcon({
  size = 26,
  color = '#00D4FF',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M4 4V9H9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20V15H15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 9A8 8 0 0 0 6.34 6.34L4 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 15A8 8 0 0 0 17.66 17.66L20 15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="#F59E0B"
        strokeWidth="1.8"
        fill="rgba(245, 158, 11, 0.2)"
      />
    </svg>
  );
}

// 9. Performance Section: Telemetry Velocity Gauge
export function PerfSectionIcon({
  size = 26,
  color = '#F59E0B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="4" fill={color} />
      <path d="M12 12L15 9" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 10. Previsibilidade Section: Predictive Forecast Trend Radar
export function ForecastSectionIcon({
  size = 26,
  color = '#F59E0B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M3 3V21H21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16L12 10L16 14L21 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" fill="#00D4FF" />
      <circle cx="21" cy="6" r="2.5" fill="#FF2D9B" />
    </svg>
  );
}

// 11. Ecossistema Section: Planetary Integration Constellation
export function EcosystemSectionIcon({
  size = 26,
  color = '#00D4FF',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <circle cx="4" cy="6" r="2" fill="#00D4FF" />
      <circle cx="20" cy="6" r="2" fill="#FF2D9B" />
      <circle cx="4" cy="18" r="2" fill="#F59E0B" />
      <circle cx="20" cy="18" r="2" fill="#10B981" />
      <path
        d="M8.5 10L5.5 7M15.5 10L18.5 7M8.5 14L5.5 17M15.5 14L18.5 17"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

// 12. Cockpit Section: Panoramic HUD Radar
export function CockpitSectionIcon({
  size = 26,
  color = '#FF2D9B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M12 3V12L18.5 15.5" stroke="#00D4FF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="#F59E0B" />
    </svg>
  );
}

// 13. CTA Section: Starburst Portal Beacon
export function CtaSectionIcon({
  size = 28,
  color = '#F59E0B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="url(#cta-star-icon-grad)"
        stroke={color}
        strokeWidth="1.2"
      />
      <defs>
        <linearGradient id="cta-star-icon-grad" x1="2" y1="2" x2="22" y2="22">
          <stop stopColor="#F59E0B" />
          <stop offset="0.5" stopColor="#FF2D9B" />
          <stop offset="1" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 14. Auth Modal Section: Biometric Zero-Trust Key Shield
export function AuthModalSectionIcon({
  size = 26,
  color = '#F59E0B',
  className = '',
  style,
}: TitleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="3"
        stroke={color}
        strokeWidth="1.8"
        fill={`${color}20`}
      />
      <path
        d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  );
}
