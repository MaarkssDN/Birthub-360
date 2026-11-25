import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { requestContext } from '../src/lib/async-context.js';

async function main() {
  const email = process.argv[2] ?? 'qa.nav@birthhub.dev';
  const user = await requestContext.run({ bypassRls: true }, () =>
    prisma.user.update({
      where: { email },
      data: { emailVerified: true },
      select: { email: true, emailVerified: true, role: true },
    }),
  );
  console.log('VERIFIED:', JSON.stringify(user));
}

main()
  .catch((e) => {
    console.error('ERR', e?.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
