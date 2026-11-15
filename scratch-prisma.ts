import { config } from 'dotenv';
config({ path: '.env.test' });
const { prisma } = await import('./src/lib/prisma.js');
const { requestContext } = await import('./src/lib/async-context.js');
const t = Date.now();
const orgs = await requestContext.run({ bypassRls: true }, () =>
  prisma.organization.findMany({ select: { id: true } }),
);
console.log('orgs', orgs.length, 'ms', Date.now() - t);
await prisma.$disconnect();
process.exit(0);
