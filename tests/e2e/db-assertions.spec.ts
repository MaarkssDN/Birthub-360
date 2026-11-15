/**
 * db-assertions.spec.ts — prova de persistência real nos E2E (TAREFA-SANEAMENTO-039 /
 * BT360-DT-0089).
 *
 * Antes desta tarefa os specs validavam apenas o DOM: a UI podia parecer funcionar
 * enquanto a escrita no backend falhava silenciosamente. Estes testes usam
 * tests/e2e/db-assertions.ts para afirmar que a ação da UI realmente persistiu —
 * e que a asserção detecta AUSÊNCIA quando o dado não existe (não é vacuamente verde).
 */
import { expect, test } from '@playwright/test';
import { dbCount, dbFindBy } from './db-assertions';
import { signUp, uniqueTestEmail } from './helpers';

test.describe('asserções diretas no banco de dados', () => {
  test('signup pela UI persiste User e Organization no banco', async ({ page }) => {
    const email = uniqueTestEmail('dbassert');
    await signUp(page, { email });

    const user = await dbFindBy('User', { email });
    expect(user, 'User deve existir no banco após signup real').not.toBeNull();
    expect(user?.role).toBe('ADMIN');

    const organizationId = user?.organizationId as string;
    expect(organizationId, 'User fundador deve pertencer a uma organização').toBeTruthy();

    const organization = await dbFindBy('Organization', { id: organizationId });
    expect(organization, 'Organization do fundador deve existir no banco').not.toBeNull();
  });

  test('asserção detecta ausência — consulta a e-mail inexistente retorna null', async () => {
    // Caminho de falha da própria asserção: se o banco retornasse linha para um
    // e-mail que nunca existiu, dbFindBy estaria quebrado e os testes acima seriam
    // falsos positivos. Aqui garantimos que a leitura é real e discriminante.
    const ghost = await dbFindBy('User', {
      email: `e2e-nunca-existiu-${Date.now()}@birthhub360.com.br`,
    });
    expect(ghost).toBeNull();

    const count = await dbCount('User', {
      email: `e2e-nunca-existiu-${Date.now()}@birthhub360.com.br`,
    });
    expect(count).toBe(0);
  });
});
