import { prisma } from '../src/lib/prisma.js';

async function main() {
  // Atualiza o usuário mais recente para ADMIN
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    console.log('Nenhum usuário encontrado');
    return;
  }

  console.log(`Atualizando usuário ${user.email} (${user.name}) de ${user.role} para ADMIN`);

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  });

  console.log('Usuário atualizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
