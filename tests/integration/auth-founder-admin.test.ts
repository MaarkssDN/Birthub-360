import { describe, it, expect, afterAll } from 'vitest';

import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';
import { withRlsBypass, uniqueEmail } from '../helpers/rbac-e2e-helpers';

// TAREFA-SANEAMENTO-044 / BT360-DT-0009 (Onda saneamento-20261110, Agente 01).
//
// A dívida pedia remover o `user.count` redundante da criação do primeiro usuário em
// src/lib/auth.ts. O count já foi eliminado (commit 5709caaa2 — "remedia 21 dívidas
// técnicas", onda-saneamento-20261015): hoje o `databaseHooks.user.create.before` atribui
// `role: 'ADMIN'` a quem funda uma organização NOVA (`!user.organizationId`), sem nenhuma
// consulta de contagem. Estes testes são a trava de regressão pedida pelo critério de
// aceite nº 3 do handoff: provar que (a) o fundador recebe ADMIN, (b) a decisão NÃO
// depende de contagem global de usuários — um segundo fundador também vira ADMIN da
// própria organização — e (c) o caminho de falha (e-mail duplicado) continua rejeitado.
//
// Requer Postgres real via `.env.test` (ver tests/helpers/integration-setup.ts).

const TEST_PASSWORD = 'FounderAdminTestPassword123!';

interface SignUpResult {
  user: { id: string; email: string; organizationId: string; role: string };
}

async function signUpFounder(prefix: string): Promise<SignUpResult['user']> {
  const email = uniqueEmail(prefix);
  const result = (await withRlsBypass(() =>
    auth.api.signUpEmail({
      body: {
        email,
        password: TEST_PASSWORD,
        name: `Founder ${prefix} ${Date.now()}`,
      },
      returnHeaders: true,
    }),
  )) as { response: SignUpResult };
  return result.response.user;
}

const createdUserIds: string[] = [];
const createdOrgIds: string[] = [];

afterAll(async () => {
  await withRlsBypass(async () => {
    // Setting/Session/Account caem por cascade a partir de Organization/User.
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
  });
});

describe('Cadastro de fundador de organização → role ADMIN (TAREFA-SANEAMENTO-044)', () => {
  it('fundador recebe ADMIN e sua organização é criada com módulos iniciais', async () => {
    const user = await signUpFounder('founder-a');
    createdUserIds.push(user.id);
    createdOrgIds.push(user.organizationId);

    expect(user.role).toBe('ADMIN');
    expect(user.organizationId).toBeTruthy();

    const org = await withRlsBypass(() =>
      prisma.organization.findUnique({ where: { id: user.organizationId } }),
    );
    expect(org).not.toBeNull();

    const modulesSetting = await withRlsBypass(() =>
      prisma.setting.findFirst({
        where: { organizationId: user.organizationId, key: 'organization.modules' },
      }),
    );
    expect(modulesSetting).not.toBeNull();
  });

  it('segundo fundador (com usuários já existentes) também recebe ADMIN da própria org — sem user.count', async () => {
    const first = await signUpFounder('founder-b1');
    const second = await signUpFounder('founder-b2');
    createdUserIds.push(first.id, second.id);
    createdOrgIds.push(first.organizationId, second.organizationId);

    // Dois fundadores globais consecutivos: se ainda existisse um `user.count` gateando
    // ADMIN para "apenas o primeiro usuário do sistema", o segundo nasceria VISUALIZADOR.
    expect(first.role).toBe('ADMIN');
    expect(second.role).toBe('ADMIN');
    expect(second.organizationId).not.toBe(first.organizationId);
  });

  it('falha: segundo cadastro com o mesmo e-mail é rejeitado', async () => {
    const email = uniqueEmail('founder-dup');
    const body = {
      email,
      password: TEST_PASSWORD,
      name: `Founder dup ${Date.now()}`,
    };

    await withRlsBypass(() => auth.api.signUpEmail({ body, returnHeaders: true }));

    await expect(
      withRlsBypass(() => auth.api.signUpEmail({ body, returnHeaders: true })),
    ).rejects.toThrow();
  });
});
