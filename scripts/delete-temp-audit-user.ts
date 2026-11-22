import { prisma } from '../src/lib/prisma.js';

async function main() {
  try {
    const email = 'audit-temp-1791213079215@birthhub360.internal';
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.user.delete({
        where: { email },
      });
      console.log(`✓ User deleted: ${email}`);
    } else {
      console.log(`✓ User not found: ${email}`);
    }
  } catch (err) {
    console.error('Error deleting user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
