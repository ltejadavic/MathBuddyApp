import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean existing data for idempotency in dev
  await prisma.user.deleteMany();

  // Create default admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mathbuddy.com',
      passwordHash: 'dummy_hash_for_now',
      role: Role.ADMIN,
    },
  });

  console.log('Created Admin User:', adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
