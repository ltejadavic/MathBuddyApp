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
      passwordHash: '$2b$10$Tc66hUxy/Xr0xjTPnjvbL.UQ4GH9yIdXkb7NMV6Y3vTnD/ghi9tf.', // Admin123!
      role: Role.ADMIN,
    },
  });

  // Create default teacher user
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@mathbuddy.com',
      passwordHash: '$2b$10$Tc66hUxy/Xr0xjTPnjvbL.UQ4GH9yIdXkb7NMV6Y3vTnD/ghi9tf.', // Admin123!
      role: Role.TEACHER,
    },
  });

  // Create default student user
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@mathbuddy.com',
      passwordHash: '$2b$10$Tc66hUxy/Xr0xjTPnjvbL.UQ4GH9yIdXkb7NMV6Y3vTnD/ghi9tf.', // Admin123!
      role: Role.STUDENT,
    },
  });

  console.log('Created Users:');
  console.log(`- Admin: ${adminUser.email}`);
  console.log(`- Teacher: ${teacherUser.email}`);
  console.log(`- Student: ${studentUser.email}`);
  console.log('Password for all users: Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
