/**
 * constants.ts — valores compartilhados do portal Bitrix mock. Sem side effects: importado
 * tanto pelo processo do servidor Express (install.ts) quanto pelo processo do Playwright
 * (control.ts/specs).
 */

/** Host fake do "portal Bitrix24" — TEST-NET-3 (RFC 5737): IP literal público o suficiente
 *  para passar no guard de SSRF de safeFetch/assertSafeExternalUrl (que só bloqueia
 *  loopback/privado/reservado), mas nunca roteável — a conexão real nunca acontece porque o
 *  fetch global é interceptado antes (ver install.ts). */
export const MOCK_BITRIX_HOST = '203.0.113.10';
export const MOCK_BITRIX_WEBHOOK_PATH = '/bitrix-mock/rest/1/e2e-token/';
export const MOCK_BITRIX_WEBHOOK_URL = `https://${MOCK_BITRIX_HOST}${MOCK_BITRIX_WEBHOOK_PATH}`;

/** Porta do control plane + endpoint de dados do portal (bind 127.0.0.1 apenas). */
export const MOCK_BITRIX_PORT = Number(process.env.E2E_BITRIX_MOCK_PORT ?? '4799');
