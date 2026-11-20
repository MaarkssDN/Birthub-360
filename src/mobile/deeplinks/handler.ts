export interface DeepLinkResolution {
  targetInternalRoute: string;
  requiresAuth: boolean;
  redirectToLogin: boolean;
  preservedTargetAfterLogin: string | null;
}

const ALLOWED_DEEP_LINK_HOSTS: Record<string, string> = {
  leads: '/app/crm/leads',
  deals: '/app/crm/deals',
  tasks: '/app/activities',
  inbox: '/app/inbox',
  voice: '/app/voice-hub',
};

export function parseNativeDeepLinkToRoute(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return '/app';
  }

  // Suporta tanto birthhub://leads/123 quanto https://app.birthhub360.com/app/crm/leads/123
  if (parsed.protocol === 'birthhub:') {
    const domainKey = parsed.hostname.toLowerCase();
    const baseRoute = ALLOWED_DEEP_LINK_HOSTS[domainKey];
    if (!baseRoute) {
      return '/app';
    }
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const fullPath = cleanPath ? `${baseRoute}/${cleanPath}` : baseRoute;
    return `${fullPath}${parsed.search}`;
  }

  if (parsed.pathname.startsWith('/app')) {
    return `${parsed.pathname}${parsed.search}`;
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
