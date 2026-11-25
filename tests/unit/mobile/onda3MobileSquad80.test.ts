import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  CRM360_PARITY_ENDPOINT_MAP,
  MobileCrm360ParityClient,
  resolveCrm360EndpointPath,
} from '../../../src/mobile/index.js';
import { evaluateIosSigningCertificateHealth } from '../../../src/mobile/ios/certRenewal.js';
import { MobileDeepLinkRouter } from '../../../src/mobile/deeplinks/handler.js';
import { reconcileOfflineFieldLevelMerge } from '../../../src/mobile/offline/sync.js';

describe('[Squad 80 · Mobile & Multiplataforma] Onda 3 — Navi (80), Ceci (83), Pia (84), Bóris (85)', () => {
  describe('[80 · Navi] Paridade de endpoints do CRM360 entre Web e Mobile', () => {
    it('expõe todos os 7 endpoints canônicos do CRM360 e roteia com tenantId e parâmetros codificados', async () => {
      expect(Object.keys(CRM360_PARITY_ENDPOINT_MAP)).toEqual([
        'overview',
        'leadDetail',
        'leadTimeline',
        'dealsPipeline',
        'activitiesFeed',
        'customerHealthScore',
        'omnichannelInbox',
      ]);

      expect(resolveCrm360EndpointPath('leadTimeline', { leadId: 'lead-42' })).toBe(
        '/api/crm360/leads/lead-42/timeline',
      );

      const requestSpy = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
      const client = new MobileCrm360ParityClient({ request: requestSpy });

      await client.fetchLeadTimeline({
        tenantId: 'tenant-m1',
        leadId: 'lead-42',
        cursor: 'evt-20',
        limit: 20,
      });

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        path: '/api/crm360/leads/lead-42/timeline',
        tenantId: 'tenant-m1',
        query: { cursor: 'evt-20', limit: 20 },
      });
    });
  });

  describe('[83 · Ceci] Automação de renovação de certificados e perfis iOS via Fastlane Match', () => {
    it('possui Fastfile configurado com match e aciona renew_certificates quando faltam <= 14 dias', () => {
      const fastfileContent = readFileSync(path.join(process.cwd(), 'ios/fastlane/Fastfile'), 'utf-8');
      expect(fastfileContent).toContain('lane :sync_certificates');
      expect(fastfileContent).toContain('lane :renew_certificates');
      expect(fastfileContent).toContain('match(');

      const now = new Date('2026-11-20T12:00:00Z');
      const expiringSoon = evaluateIosSigningCertificateHealth(
        {
          profileName: 'BirthHub360 AppStore',
          bundleId: 'com.birthhub360.mobile',
          expiresAt: new Date('2026-11-28T12:00:00Z'), // 8 dias
        },
        now,
      );
      expect(expiringSoon.status).toBe('RENEWAL_REQUIRED');
      expect(expiringSoon.fastlaneCommand).toBe('bundle exec fastlane ios renew_certificates');

      const healthy = evaluateIosSigningCertificateHealth(
        {
          profileName: 'BirthHub360 AppStore',
          bundleId: 'com.birthhub360.mobile',
          expiresAt: new Date('2027-06-01T12:00:00Z'),
        },
        now,
      );
      expect(healthy.status).toBe('VALID');
      expect(healthy.fastlaneCommand).toBeNull();
    });
  });

  describe('[84 · Pia] Roteamento de deep links nativos preservando a tela alvo após autenticação', () => {
    it('redireciona usuário deslogado para /login guardando o destino e restaura a entidade exata após o login', () => {
      const router = new MobileDeepLinkRouter();

      // Contrato unificado (Agente 84, DEM-20261123-001): scheme real `birthhub360://<tab>`
      // espelha os VALID_TABS nativos; sub-rotas profundas chegam via App Link https.
      const unauth = router.handleIncomingDeepLink(
        'https://app.birthhub360.com.br/app/crm/leads/lead-889?tab=timeline',
        false,
      );
      expect(unauth.redirectToLogin).toBe(true);
      expect(unauth.targetInternalRoute).toBe('/login');
      expect(unauth.preservedTargetAfterLogin).toBe('/app/crm/leads/lead-889?tab=timeline');

      // Após concluir login, consome o destino preservado
      const postLoginRoute = router.consumePostLoginTarget();
      expect(postLoginRoute).toBe('/app/crm/leads/lead-889?tab=timeline');
    });
  });

  describe('[85 · Bóris] Resolução de conflitos offline-first em nível de campo (field-level merge)', () => {
    it('preserva anotações feitas offline no celular enquanto mescla alteração de estágio feita na web no mesmo lead', () => {
      const base = {
        id: 'lead-1',
        tenantId: 'tenant-1',
        fields: {
          stageId: 'qualificacao',
          notes: 'Nota inicial',
          phone: '+5511999990000',
        },
        fieldTimestamps: { stageId: 1000, notes: 1000, phone: 1000 },
      };

      // Vendedor em campo (offline) editou `notes` no t=2000
      const local = {
        id: 'lead-1',
        tenantId: 'tenant-1',
        fields: {
          stageId: 'qualificacao',
          notes: 'Visita presencial realizada: cliente pediu proposta para 50 licenças',
          phone: '+5511999990000',
        },
        fieldTimestamps: { stageId: 1000, notes: 2000, phone: 1000 },
      };

      // Gestor na web (online) moveu `stageId` para `proposta` no t=2500
      const remote = {
        id: 'lead-1',
        tenantId: 'tenant-1',
        fields: {
          stageId: 'proposta',
          notes: 'Nota inicial',
          phone: '+5511999990000',
        },
        fieldTimestamps: { stageId: 2500, notes: 1000, phone: 1000 },
      };

      const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

      // Ambas as edições em campos distintos são preservadas sem perda!
      expect(merged.mergedFields).toEqual({
        stageId: 'proposta',
        notes: 'Visita presencial realizada: cliente pediu proposta para 50 licenças',
        phone: '+5511999990000',
      });
      expect(merged.resolvedFromLocal).toEqual(['notes']);
      expect(merged.resolvedFromRemote).toEqual(['stageId']);
      expect(merged.conflictingFieldsResolvedByTimestamp).toEqual([]);
    });
  });
});
