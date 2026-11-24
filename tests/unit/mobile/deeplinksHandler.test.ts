import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MobileDeepLinkRouter,
  parseNativeDeepLinkToRoute,
} from '../../../src/mobile/deeplinks/handler.js';
import { ACTIVE_NAV_TABS } from '../../../src/lib/navigationBus.js';

/**
 * DEM-20261123-001 (Agente 84 — Pia): contrato unificado de deep link.
 *
 * Antes desta correção o handler testava `protocol === 'birthhub:'` enquanto o scheme real
 * declarado em AndroidManifest.xml/Info.plist é `birthhub360:` — todo link custom caía em
 * '/app' silenciosamente (B1 do handoff 80→84). Além disso o handler mantinha um mapa fixo
 * de 5 hosts (leads/deals/tasks/inbox/voice) divergente dos ~46 VALID_TABS nativos (B2).
 *
 * Este spec trava o contrato: scheme `birthhub360://<tab>` → `/app/<tab>` validado contra
 * ACTIVE_NAV_TABS (mesma fonte de verdade dos VALID_TABS nativos, cuja paridade já é
 * garantida por tests/unit/navigation/*-valid-tabs-parity.test.ts) e App Links
 * `https://<host>/app/<tab>[/...]` com preservação de sub-rota.
 */

const ROOT = path.resolve(__dirname, '../../..');

describe('parseNativeDeepLinkToRoute — scheme custom birthhub360://', () => {
  it('resolve birthhub360://<tab> para /app/<tab> para todo ACTIVE_NAV_TABS', () => {
    for (const tab of ACTIVE_NAV_TABS) {
      // 'dashboard' é special-case também no nativo (MainActivity.navigateTo → base + "/app").
      const expected = tab === 'dashboard' ? '/app' : `/app/${tab}`;
      expect(parseNativeDeepLinkToRoute(`birthhub360://${tab}`)).toBe(expected);
    }
  });

  it('host vazio ou dashboard cai em /app (mesmo comportamento do nativo)', () => {
    expect(parseNativeDeepLinkToRoute('birthhub360://')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('birthhub360://dashboard')).toBe('/app');
  });

  it('destino desconhecido cai em /app (fallback seguro; nativo mostra diálogo)', () => {
    expect(parseNativeDeepLinkToRoute('birthhub360://nao-existe')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('birthhub360://voice-hub')).toBe('/app'); // tab oculto
    expect(parseNativeDeepLinkToRoute('birthhub360://dialer')).toBe('/app'); // tab oculto
  });

  it('scheme antigo birthhub:// não é mais aceito (nunca foi declarado nos manifests)', () => {
    expect(parseNativeDeepLinkToRoute('birthhub://crm')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('birthhub://leads/lead-1')).toBe('/app');
  });

  it('normaliza case do host', () => {
    expect(parseNativeDeepLinkToRoute('birthhub360://CRM')).toBe('/app/crm');
  });
});

describe('parseNativeDeepLinkToRoute — App Links https/http', () => {
  it('preserva caminho profundo quando o primeiro segmento é tab válido', () => {
    expect(
      parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/app/crm/leads/lead-889?tab=timeline'),
    ).toBe('/app/crm/leads/lead-889?tab=timeline');
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/app/forecast')).toBe(
      '/app/forecast',
    );
  });

  it('/app sem segmento e /app/dashboard caem em /app', () => {
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/app')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/app/dashboard')).toBe(
      '/app/dashboard',
    );
  });

  it('primeiro segmento inválido cai em /app', () => {
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/app/rota-inexistente')).toBe(
      '/app',
    );
  });

  it('paths fora de /app e URLs malformadas caem em /app', () => {
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('https://app.birthhub360.com.br/aplicativo/crm')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('nao-e-url')).toBe('/app');
    expect(parseNativeDeepLinkToRoute('')).toBe('/app');
  });
});

describe('MobileDeepLinkRouter — auth gate pós-link', () => {
  it('usuário deslogado é redirecionado a /login e o destino é restaurado após login', () => {
    const router = new MobileDeepLinkRouter();
    const unauth = router.handleIncomingDeepLink('birthhub360://prospect', false);
    expect(unauth).toEqual({
      targetInternalRoute: '/login',
      requiresAuth: true,
      redirectToLogin: true,
      preservedTargetAfterLogin: '/app/prospect',
    });
    expect(router.consumePostLoginTarget()).toBe('/app/prospect');
    // Consumido uma vez: segunda chamada cai no fallback.
    expect(router.consumePostLoginTarget('/app')).toBe('/app');
  });

  it('usuário autenticado navega direto para a rota resolvida', () => {
    const router = new MobileDeepLinkRouter();
    const auth = router.handleIncomingDeepLink('birthhub360://reports', true);
    expect(auth.targetInternalRoute).toBe('/app/reports');
    expect(auth.redirectToLogin).toBe(false);
    expect(auth.preservedTargetAfterLogin).toBeNull();
  });
});

describe('paridade handler ↔ manifests nativos', () => {
  it('o scheme birthhub360 está declarado em AndroidManifest.xml e Info.plist', () => {
    const manifest = readFileSync(
      path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    );
    const plist = readFileSync(path.join(ROOT, 'ios/App/App/Info.plist'), 'utf8');
    expect(manifest).toContain('android:scheme="birthhub360"');
    expect(plist).toContain('<string>birthhub360</string>');
  });
});
