import posthog from 'posthog-js';

export type HeroVariant = 'A' | 'B' | 'C';

export interface RoiSimulationTelemetryData {
  dealsCount: number;
  avgTicket: number;
  leakRate: number;
  recoverableMonthly: number;
  annualRecoverable: number;
}

export type ConversionEventName =
  | 'hero_variant_impression'
  | 'hero_cta_primary_click'
  | 'hero_roi_simulator_opened'
  | 'roi_simulator_converted'
  | 'hero_variant_switched';

export interface ConversionEventPayload {
  eventName: ConversionEventName;
  variant: HeroVariant;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'bh_cro_telemetry_events';
const MAX_LOCAL_EVENTS = 50;

/**
 * Registra eventos anonimizados e estruturados para otimização de conversão (CRO).
 * Integra automaticamente com PostHog, Google Tag Manager (dataLayer) e armazenamento local para auditoria.
 */
function recordConversionEvent(
  eventName: ConversionEventName,
  variant: HeroVariant,
  metadata?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const payload: ConversionEventPayload = {
    eventName,
    variant,
    timestamp,
    metadata,
  };

  // 1. PostHog (se ativo)
  try {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(eventName, {
        variant,
        ...metadata,
      });
    }
  } catch {
    // Falha silenciosa para não quebrar a navegação
  }

  // 2. Google Tag Manager / GA4 (dataLayer)
  try {
    if (typeof window !== 'undefined') {
      const gWindow = window as unknown as { dataLayer?: unknown[] };
      if (Array.isArray(gWindow.dataLayer)) {
        gWindow.dataLayer.push({
          event: eventName,
          cro_variant: variant,
          ...metadata,
        });
      }
    }
  } catch {
    // Falha silenciosa
  }

  // 3. Auditoria Local (SessionStorage / Buffer para validação e testes)
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const list: ConversionEventPayload[] = stored ? JSON.parse(stored) : [];
      list.push(payload);
      if (list.length > MAX_LOCAL_EVENTS) {
        list.shift();
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));

      if (import.meta.env.DEV) {
        // Log legível no console em ambiente de desenvolvimento
        console.info(`[CRO Telemetry] 📊 ${eventName}`, {
          variant,
          metadata,
          timestamp,
        });
      }
    }
  } catch {
    // Falha silenciosa
  }
}

/**
 * 1. Registra a visualização (impressão) de uma variante do Hero.
 * Deduplica na mesma sessão de página para evitar contagem inflada de refresh rápido.
 */
export function trackHeroVariantImpression(variant: HeroVariant): void {
  try {
    if (typeof window !== 'undefined') {
      const sessionKey = `bh_viewed_hero_${variant}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Já registrado nesta aba/sessão
      }
      sessionStorage.setItem(sessionKey, '1');
    }
  } catch {
    // Fallback normal se sessionStorage não estiver acessível
  }

  const device =
    typeof window !== 'undefined'
      ? window.innerWidth < 640
        ? 'mobile'
        : window.innerWidth < 1024
          ? 'tablet'
          : 'desktop'
      : 'desktop';

  recordConversionEvent('hero_variant_impression', variant, {
    device,
    referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
  });
}

/**
 * 2. Registra o clique no botão primário do Hero (alta intenção).
 */
export function trackHeroCtaPrimaryClick(variant: HeroVariant, ctaText: string): void {
  recordConversionEvent('hero_cta_primary_click', variant, {
    ctaText,
    destination: 'login_or_platform',
  });
}

/**
 * 3. Registra a abertura do Simulador Executivo de ROI & Previsibilidade.
 */
export function trackHeroRoiSimulatorOpened(
  variant: HeroVariant,
  trigger: 'hero_secondary' | 'floating_pill' | 'manual' | 'problem_section_banner' | (string & {}),
): void {
  recordConversionEvent('hero_roi_simulator_opened', variant, {
    trigger,
  });
}

/**
 * 4. Registra a conversão dentro do Simulador de ROI (usuário clicou para agir com base nos números).
 */
export function trackRoiSimulatorConverted(
  variant: HeroVariant,
  data: RoiSimulationTelemetryData,
): void {
  recordConversionEvent('roi_simulator_converted', variant, {
    dealsCount: data.dealsCount,
    avgTicket: data.avgTicket,
    leakRate: data.leakRate,
    recoverableMonthly: data.recoverableMonthly,
    annualRecoverable: data.annualRecoverable,
  });
}

/**
 * 5. Registra quando o visitante alternou manualmente entre as variantes A/B/C.
 */
export function trackHeroVariantSwitched(fromVariant: HeroVariant, toVariant: HeroVariant): void {
  recordConversionEvent('hero_variant_switched', toVariant, {
    fromVariant,
    toVariant,
  });
}

/**
 * Helper global para auditoria em console no browser: `window.__getConversionEvents()`
 */
if (typeof window !== 'undefined') {
  (
    window as unknown as { __getConversionEvents: () => ConversionEventPayload[] }
  ).__getConversionEvents = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };
}
