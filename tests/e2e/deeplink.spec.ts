import { expect, test, type Page } from '@playwright/test';
import { E2E_PASSWORD, signUp, uniqueTestEmail, waitForAppReady } from './helpers';

// Aceite do deep link pós-login (correção em src/features/landing/pages/Landing360.tsx,
// `postLoginTarget` ~L530-539): o ProtectedRoute redireciona anônimos para /login com
// `state.from` apontando para a rota originalmente pedida; o login deve devolver o usuário
// exatamente para ela (pathname + search), nunca para um destino externo.
//
// O caso negativo não é exercitável por navegação comum: `state.from` só é populado pelo
// próprio ProtectedRoute com um Location interno. Para cobrir o sanitizador
// (`pathname` precisa começar com '/' e não com '//'), o spec injeta um `history.state.usr`
// malicioso via replaceState + popstate — mesmo mecanismo que o React Router usa para ler
// `location.state` (ver getUrlBasedHistory/createBrowserLocation em react-router).

async function loginViaUi(page: Page, email: string) {
  await page.getByPlaceholder('nome@empresa.com.br', { exact: true }).fill(email);
  await page.getByPlaceholder('••••••••').fill(E2E_PASSWORD);
  const signinResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/auth/sign-in/email'
      && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /^Entrar na Plataforma$/ }).click();
  const signinResponse = await signinResponsePromise;
  expect(signinResponse.ok(), 'Login real deve ser confirmado pelo servidor').toBe(true);
}

// Injeta `location.state.from` na entrada atual do histórico e força o Router a reler o
// estado (popstate → handlePop → history.location → globalHistory.state.usr). Preserva
// key/idx originais para não dessincronizar o índice interno do React Router.
async function injectFromState(page: Page, from: Record<string, string | null>) {
  await page.evaluate((payload) => {
    const current = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.replaceState({ ...current, usr: { from: payload } }, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, from);
  // O re-render do Landing360 com o novo location.state é assíncrono; sem uma pequena
  // espera o submit do login poderia ler o postLoginTarget ainda congelado no mount.
  await page.waitForTimeout(300);
}

test.describe('Deep link pós-login (state.from do ProtectedRoute)', () => {
  test('anônimo em rota protegida com path+query retorna para a mesma URL após login', async ({
    page,
    context,
  }) => {
    const email = uniqueTestEmail('deeplink');
    await signUp(page, { email });

    // Sessão nova, sem cookies: força o fluxo anônimo real (ProtectedRoute → /login).
    await context.clearCookies();
    await page.goto('/app/crm?filtro=deeplink-e2e');
    await expect(page).toHaveURL(/\/login/);

    await loginViaUi(page, email);

    // O destino pós-login deve ser exatamente a rota pedida, com o querystring preservado.
    await page.waitForURL(/\/app\/crm/, { timeout: 20_000 });
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe('/app/crm');
    expect(finalUrl.searchParams.get('filtro')).toBe('deeplink-e2e');
    await waitForAppReady(page);
  });

  test('state.from malicioso (//evil.com) é sanitizado e cai em /app', async ({
    page,
    context,
  }) => {
    const email = uniqueTestEmail('deeplink-evil');
    await signUp(page, { email });
    await context.clearCookies();

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /^Entrar na Plataforma$/ })).toBeVisible();
    await injectFromState(page, {
      pathname: '//evil.com',
      search: '?roubo=sessao',
      hash: '',
    });

    await loginViaUi(page, email);

    // Sem o sanitizador (`startsWith('//')` → fallback '/app'), o navigate levaria a URL a
    // '//evil.com' (path protocol-relative) e o usuário sairia da rota interna.
    await page.waitForURL(/\/app(?:[/?#]|$)/, { timeout: 20_000 });
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname.startsWith('/app')).toBe(true);
    // Cobre host e path: qualquer fuga para //evil.com ou URL absoluta apareceria aqui.
    expect(page.url()).not.toContain('evil.com');
  });

  test('state.from com URL absoluta externa é sanitizado e cai em /app', async ({
    page,
    context,
  }) => {
    const email = uniqueTestEmail('deeplink-abs');
    await signUp(page, { email });
    await context.clearCookies();

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /^Entrar na Plataforma$/ })).toBeVisible();
    await injectFromState(page, {
      pathname: 'https://evil.com/phish',
      search: '',
      hash: '',
    });

    await loginViaUi(page, email);

    await page.waitForURL(/\/app(?:[/?#]|$)/, { timeout: 20_000 });
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname.startsWith('/app')).toBe(true);
    expect(page.url()).not.toContain('evil.com');
  });
});
