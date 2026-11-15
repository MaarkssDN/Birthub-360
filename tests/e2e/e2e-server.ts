/**
 * e2e-server.ts — entry point do servidor Express para a suíte Playwright.
 *
 * Idêntico a `npm run start:e2e` (tsx server.ts com .env.test), exceto que instala ANTES o
 * stub de fetch do portal Bitrix mock (install.ts) — no-op a menos que E2E_BITRIX_MOCK=1.
 * O webServer do playwright.config.ts aponta para este arquivo; `start:e2e` continua
 * existindo para quem quiser o servidor sem o mock.
 */
import './bitrix-mock/install';
import '../../server';
