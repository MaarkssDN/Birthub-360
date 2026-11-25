import { ACTIVE_NAV_TABS } from '../../lib/navigationBus.js';

// ACTIVE_NAV_TABS é ReadonlySet<TabType>; alargar para string evita casts nos lookups.
const VALID_DEEP_LINK_TABS: ReadonlySet<string> = ACTIVE_NAV_TABS;

export interface DeepLinkResolution {
  targetInternalRoute: string;
  requiresAuth: boolean;
  redirectToLogin: boolean;
  preservedTargetAfterLogin: string | null;
}

/**
 * Contrato único de deep link do app (DEM-20261123-001, Agente 84 — Pia).
 *
 * Fonte de verdade dos destinos: `ACTIVE_NAV_TABS` de `src/lib/navigationBus.ts` —
 * o mesmo conjunto que os espelhos nativos `VALID_TABS` (MainActivity.java, Android)
 * e `validTabs` (SceneDelegate.swift, iOS) são obrigados a replicar; a paridade dos
 * três lados é garantida por tests/unit/navigation/*-valid-tabs-parity.test.ts.
 *
 * Formatos aceitos (idênticos ao tratamento nativo):
 * - `birthhub360://<tab>` — scheme custom declarado em AndroidManifest.xml
 *   (`android:scheme="birthhub360"`) e Info.plist (CFBundleURLTypes). O host da URI é o
 *   nome do TabType (ex.: `birthhub360://crm` → `/app/crm`). Host vazio ou `dashboard`
 *   → `/app`. Destino fora de ACTIVE_NAV_TABS → `/app` (o nativo mostra diálogo de erro;
 *   aqui o fallback seguro é o hub, sem fingir sucesso de navegação).
 * - `https://app.birthhub360.com.br/app/...` (e `http:`) — Android App Link declarado no
 *   manifest com `pathPrefix="/app"`. Quando o primeiro segmento após `/app` é um tab
 *   válido, o caminho profundo é preservado (`/app/<tab>/...`) porque o React Router de
 *   `src/App.tsx` (`/app/*`) é a autoridade das sub-rotas; o nativo só extrai o primeiro
 *   segmento, limitação de plataforma que este handler não precisa replicar.
 *
 * Qualquer outro formato/esquema retorna '/app'.
 */
export function parseNativeDeepLinkToRoute(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return '/app';
  }

  if (parsed.protocol === 'birthhub360:') {
    const tab = parsed.hostname.toLowerCase();
    if (!tab || tab === 'dashboard') {
      return '/app';
    }
    if (!VALID_DEEP_LINK_TABS.has(tab)) {
      return '/app';
    }
    return `/app/${tab}`;
  }

  if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
    const pathname = parsed.pathname;
    if (pathname === '/app') {
      return '/app';
    }
    if (pathname.startsWith('/app/')) {
      const firstSegment = pathname.slice('/app/'.length).split('/')[0];
      if (firstSegment === 'dashboard' || VALID_DEEP_LINK_TABS.has(firstSegment)) {
        return `${pathname}${parsed.search}`;
      }
      return '/app';
    }
  }

  return '/app';
}

export class MobileDeepLinkRouter {
  private pendingTargetRoute: string | null = null;

  handleIncomingDeepLink(rawUrl: string, isAuthenticated: boolean): DeepLinkResolution {
    const targetInternalRoute = parseNativeDeepLinkToRoute(rawUrl);

    if (!isAuthenticated) {
      this.pendingTargetRoute = targetInternalRoute;
      return {
        targetInternalRoute: '/login',
        requiresAuth: true,
        redirectToLogin: true,
        preservedTargetAfterLogin: targetInternalRoute,
      };
    }

    return {
      targetInternalRoute,
      requiresAuth: true,
      redirectToLogin: false,
      preservedTargetAfterLogin: null,
    };
  }

  consumePostLoginTarget(fallbackRoute: string = '/app'): string {
    const target = this.pendingTargetRoute ?? fallbackRoute;
    this.pendingTargetRoute = null;
    return target;
  }
}
