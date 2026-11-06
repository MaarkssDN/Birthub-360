/**
 * src/serviceWorkerRegistration.ts
 * Gerenciamento de Service Worker PWA com purga deterministica de caches e desregistro em logout.
 * (Handoff 15-para-09 / DIV-AGENTE-09-001 / B-10)
 */

export class PwaCachePurgeService {
  /**
   * Limpa integralmente caches de dados de negocio e dados offline associados a sessao do usuario/organizacao.
   */
  public async purgeOnLogout(): Promise<string[]> {
    if (typeof caches === 'undefined') {
      return [];
    }

    const deletedCaches: string[] = [];
    const keys = await caches.keys();

    for (const key of keys) {
      // Deleta todos os caches que contenham dados de API, leads, contacts ou sessao
      if (key.includes('api') || key.includes('data') || key.includes('leads') || key.includes('birthhub')) {
        await caches.delete(key);
        deletedCaches.push(key);
      }
    }

    // Se houver navigator.serviceWorker, solicita atualizacao/desregistro
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    return deletedCaches;
  }
}

export const pwaCachePurgeService = new PwaCachePurgeService();
