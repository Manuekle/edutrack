import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => hash(password, 12);

async function main() {
  console.log('Creating admin user...');

  const hashedPassword = await hashPassword('admin123');

  const admin = await prisma.user.upsert({
    where: { document: '12345678' },
    update: {},
    create: {
      name: 'Administrador',
      document: '12345678',
      correoInstitucional: 'admin@fup.edu.co',
      correoPersonal: 'admin@fup.edu.co',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('Admin user created:', admin.name);
  console.log('Email:', admin.correoInstitucional);
  console.log('Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
