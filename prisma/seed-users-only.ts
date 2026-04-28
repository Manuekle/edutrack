/**
 * Seed mínimo: solo 3 usuarios
 *Ejecutar: npx tsx prisma/seed-users-only.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsersOnly() {
  const password = await hash('password123', 12);

  console.log('🗑️  Limpiando base de datos...');

  // Limpiar todo primero
  await prisma.attendance.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicWeek.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.group.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.room.deleteMany();
  await prisma.unenrollRequest.deleteMany();
  await prisma.specialRange.deleteMany();
  await prisma.academicPeriod.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creando usuarios...\n');

  // Admin
  await prisma.user.create({
    data: {
      name: 'Administrador',
      document: 'ADMIN001',
      institutionalEmail: 'admin@fup.edu.co',
      personalEmail: 'admin@fup.edu.co',
      password,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('  ✅ Admin: admin@fup.edu.co');

  // Docente
  await prisma.user.create({
    data: {
      name: 'Docente',
      document: 'DOC001',
      institutionalEmail: 'docente@fup.edu.co',
      personalEmail: 'docente@personal.com',
      password,
      role: Role.DOCENTE,
      isActive: true,
    },
  });
  console.log('  ✅ Docente: docente@fup.edu.co');

  // Estudiante
  await prisma.user.create({
    data: {
      name: 'Estudiante',
      document: 'EST001',
      institutionalEmail: 'estudiante@fup.edu.co',
      personalEmail: 'estudiante@personal.com',
      password,
      role: Role.ESTUDIANTE,
      studentCode: 'EST001',
      isActive: true,
    },
  });
  console.log('  ✅ Estudiante: estudiante@fup.edu.co');

  console.log('\n✅ Completado! (solo 3 usuarios)');
}

seedUsersOnly()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
